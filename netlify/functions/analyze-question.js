import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the Netlify environment

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    question: {
      type: 'string',
      description:
        'The question exactly as written in the photo, including multiple-choice options if present. Empty string if no question is visible in the photo.',
    },
    answer: {
      type: 'string',
      description:
        'The correct answer, worked out and clearly formatted for a tutor to read. For multiple choice, state the letter and the option text, then a brief justification. For open-ended questions, give the full worked answer.',
    },
  },
  required: ['question', 'answer'],
  additionalProperties: false,
};

const PROMPT = [
  'This is a photo of a screen showing a quiz, practice test, or worksheet question.',
  'Ignore browser chrome, tabs, breadcrumbs, and any other page navigation UI.',
  'Find the actual question — it is often preceded by a marker like "81. Question" — and solve it.',
  'If nothing resembling a question is visible, return an empty "question" and explain that in "answer".',
].join(' ');

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
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
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'high',
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

    return jsonResponse(200, {
      question: parsed.question ?? '',
      answer: parsed.answer ?? '',
    });
  } catch (err) {
    console.error('analyze-question error:', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    return jsonResponse(status, { error: err?.message || 'Failed to analyze the image.' });
  }
};
