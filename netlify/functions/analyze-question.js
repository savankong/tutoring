import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the Netlify environment

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    pattern_analysis: {
      type: 'string',
      description:
        'Internal scratch notes only, never shown to the user. For a pattern/matrix/sequence/spatial-reasoning question only, briefly note the per-row and per-column pattern (shape, count, shading, rotation) before answering. For any other question, leave this empty. 1 short sentence max — terse.',
    },
    answer: {
      type: 'string',
      description:
        'ONLY the final answer, as short as possible — no reasoning, no explanation, no "because". For multiple choice, output just the letter and the option value, e.g. "C. 96 flight/month". For open-ended questions, output just the final value or result, e.g. "42" or "x = 7". If no question is visible in the photo, output "No question detected."',
    },
  },
  required: ['pattern_analysis', 'answer'],
  additionalProperties: false,
};

const PROMPT = [
  'This is a photo of a screen showing a quiz, practice test, or worksheet question.',
  'Ignore browser chrome, tabs, breadcrumbs, and any other page navigation UI.',
  'Find the actual question — it is often preceded by a marker like "81. Question" — and solve it.',
  'If it is a pattern/matrix/sequence/spatial-reasoning question (e.g. "which figure completes the pattern"), be rigorous: check every row AND every column of the matrix independently for shape, count, shading, size, and rotation changes before choosing — do not guess from a partial glance.',
  'Answer as short as possible per the schema — no explanations.',
].join(' ');

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function callClaude(image, mediaType) {
  return client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: image,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });
}

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { image, mediaType } = body ?? {};
  if (!image || typeof image !== 'string') {
    return jsonResponse(400, { error: 'Missing "image" (base64) in request body' });
  }

  try {
    let response;
    try {
      response = await callClaude(image, mediaType);
    } catch (err) {
      // 401s aren't normally worth retrying, but a key that's momentarily
      // unavailable right after a deploy/env-var change looks identical to
      // a bad key — one quick retry tells them apart cheaply.
      if (err?.status === 401) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        response = await callClaude(image, mediaType);
      } else {
        throw err;
      }
    }

    if (response.stop_reason === 'refusal') {
      return jsonResponse(422, { error: 'Claude declined to answer this request.' });
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      return jsonResponse(502, { error: 'No text content in Claude response.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return jsonResponse(502, { error: 'Could not parse structured response from Claude.' });
    }

    return jsonResponse(200, { answer: parsed.answer ?? '' });
  } catch (err) {
    console.error('analyze-question error:', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    return jsonResponse(status, { error: err?.message || 'Failed to analyze the image.' });
  }
};
