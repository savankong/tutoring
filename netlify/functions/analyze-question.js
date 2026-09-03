import Anthropic from '@anthropic-ai/sdk';
import { getDatabase } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { capturesUsedThisPeriod, isCapped, isDrawingOnCredits, findActivePass, debitPass } from '../lib/access.js';
import { planFor } from '../lib/plans.js';
import { PUBLIC_QUESTION_TOPICS, normalizeQuestionKey } from '../lib/publicTopics.js';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from process.env

/** Best-effort credit debit — a capture that's already been allowed through
 * isCapped must never be blocked by a billing hiccup after the fact, so
 * failures here are logged, not thrown. Guarded by credit_balance > 0 so
 * concurrent requests can't drive the balance negative. */
async function debitCredit(db, user) {
  try {
    await db.sql`
      UPDATE users SET credit_balance = credit_balance - 1
      WHERE id = ${user.id} AND credit_balance > 0
    `;
  } catch (err) {
    console.error('debitCredit failed:', err);
  }
}

/** Auto-publishes a captured Q&A onto the matching landing page's public
 * question bank, so real usage grows real, indexable content over time
 * instead of only the hand-written starter set. Only runs for users who
 * signed up via one of the campaign pages (signup_ref) and haven't
 * opted out — best-effort, never blocks the capture response. */
async function publishPublicQuestion(db, user, { questionText, answer, explanation, whyOthersWrong }) {
  if (user.public_captures_opt_out) return;
  if (!user.signup_ref || !PUBLIC_QUESTION_TOPICS.has(user.signup_ref)) return;
  if (!questionText) return;

  try {
    const normalizedKey = normalizeQuestionKey(questionText);
    await db.sql`
      INSERT INTO public_questions (topic_slug, question, answer, explanation, why_others_wrong, normalized_key)
      VALUES (${user.signup_ref}, ${questionText}, ${answer}, ${explanation}, ${whyOthersWrong}, ${normalizedKey})
      ON CONFLICT (topic_slug, normalized_key)
      DO UPDATE SET times_seen = public_questions.times_seen + 1, last_seen_at = now()
    `;
  } catch (err) {
    console.error('publishPublicQuestion failed:', err);
  }
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description:
        '3-6 word label for the question, for a history list, e.g. "CCAT Math & Logic Q31" or "Flights per month word problem". Empty string if no question is visible.',
    },
    question_text: {
      type: 'string',
      description:
        'The actual question, transcribed verbatim (or very close to it) from the photo, cleaned up for readability — e.g. "Which of the following is a best practice for protecting CUI?" This is the real question text, not a short label. Include multiple-choice options inline if shown. Empty string if no question is visible.',
    },
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
    explanation: {
      type: 'string',
      description:
        'A thorough explanation of why the answer is correct — full step-by-step reasoning a tutor could walk a student through, not a one-liner. Lead with what makes this the right answer, then justify it completely (the relevant rule, calculation, or pattern, worked through in full). Empty string if no question is visible.',
    },
    why_others_wrong: {
      type: 'string',
      description:
        'For multiple-choice questions only: a thorough, separate explanation of why each of the OTHER options is incorrect. Go through every remaining option one at a time (e.g. "A is wrong because...", "B is wrong because...") and give the full reasoning for why each fails — not just "doesn\'t match," explain the specific error, miscalculation, or broken rule in that option. Leave empty for open-ended/non-multiple-choice questions, or if no question is visible.',
    },
  },
  required: ['title', 'question_text', 'pattern_analysis', 'answer', 'explanation', 'why_others_wrong'],
  additionalProperties: false,
};

const PROMPT = [
  'This is a photo of a screen showing a quiz, practice test, or worksheet question.',
  'Ignore browser chrome, tabs, breadcrumbs, and any other page navigation UI.',
  'Find the actual question — it is often preceded by a marker like "81. Question" — and solve it. Transcribe it into question_text as you find it, cleaned up but not paraphrased.',
  'If it is a pattern/matrix/sequence/spatial-reasoning question (e.g. "which figure completes the pattern"), be rigorous: check every row AND every column of the matrix independently for shape, count, shading, size, and rotation changes before choosing — do not guess from a partial glance.',
  'The answer field must be as short as possible — no explanations there.',
  'The explanation field leads with the answer already given, then gives the complete, thorough reasoning for why it is correct — show the logic in full, as if teaching it, not a quick summary.',
  'If the question is multiple choice, separately fill in why_others_wrong: go through every other option individually and explain in full, logical detail exactly why each one is incorrect (the specific mistake, miscalculation, or broken rule it represents), with the same rigor as the correct-answer explanation. If the question is not multiple choice, leave why_others_wrong as an empty string.',
].join(' ');

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Normalizes Claude's parsed output into the shape the rest of the handler
// expects, defaulting any missing/malformed field to ''.
function normalizeParsed(parsed) {
  return {
    title: typeof parsed?.title === 'string' ? parsed.title : '',
    question_text: typeof parsed?.question_text === 'string' ? parsed.question_text : '',
    answer: typeof parsed?.answer === 'string' ? parsed.answer : '',
    explanation: typeof parsed?.explanation === 'string' ? parsed.explanation : '',
    why_others_wrong: typeof parsed?.why_others_wrong === 'string' ? parsed.why_others_wrong : '',
  };
}

async function callClaude(image, mediaType) {
  const response = await client.messages.create({
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

  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('Claude declined to answer this request.'), { status: 422 });
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw Object.assign(new Error('No text content in Claude response.'), { status: 502 });
  }

  return normalizeParsed(JSON.parse(textBlock.text));
}

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) {
    return jsonResponse(401, { error: 'Not signed in.', reason: 'unauthenticated' });
  }
  // Google accounts are exempt — Google already verified that email.
  if (!user.email_verified && !user.google_id) {
    return jsonResponse(403, { error: 'Verify your email to start using captures.', reason: 'email_unverified' });
  }
  const plan = planFor(user);
  // An active one-time pass (see netlify/lib/plans.js) is drawn down before
  // plan cap/grace/credits — it expires on the wall clock regardless of
  // whether it's used, so using it first never wastes it. Only fall through
  // to the plan-cap check when there's no pass to use.
  const activePass = await findActivePass(db, user.id);
  let capturesUsedBefore = 0;
  if (!activePass) {
    capturesUsedBefore = await capturesUsedThisPeriod(db, user.id, user.current_period_start);
    // Free tier hits a hard cap. Paid tiers get a grace buffer beyond their
    // cap, then draw down purchased credits (see debitCredit below) — once
    // both are exhausted they're capped too.
    if (isCapped(user, capturesUsedBefore)) {
      const error = plan.creditsAllowed
        ? `You've used all ${plan.captureCap + plan.graceBuffer} captures (including your grace buffer) for this month. Buy credits to keep going.`
        : `You've used all ${plan.captureCap} captures for this month.`;
      return jsonResponse(402, { error, reason: 'cap_reached' });
    }
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
    let parsed;
    try {
      parsed = await callClaude(image, mediaType);
    } catch (err) {
      // 401s aren't normally worth retrying, but a key that's momentarily
      // unavailable right after a deploy/env-var change looks identical to
      // a bad key — one quick retry tells them apart cheaply.
      if (err?.status === 401) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        parsed = await callClaude(image, mediaType);
      } else {
        throw err;
      }
    }

    const answer = parsed.answer ?? '';
    const title = parsed.title ?? '';
    const questionText = parsed.question_text ?? '';
    const explanation = parsed.explanation ?? '';
    const whyOthersWrong = parsed.why_others_wrong ?? '';

    // Nothing worth keeping if Claude couldn't find a real question in the
    // photo — skip the write entirely rather than logging a blank/junk row
    // to the user's history and the admin submissions log, and don't charge
    // them a capture (against cap or credits) for a failed detection.
    const questionDetected = questionText.trim().length > 0 && answer.trim().length > 0;

    if (questionDetected) {
      await db.sql`
        INSERT INTO captures (user_id, title, question_text, answer, explanation, why_others_wrong, pass_purchase_id)
        VALUES (${user.id}, ${title}, ${questionText}, ${answer}, ${explanation}, ${whyOthersWrong}, ${activePass?.id ?? null})
      `;

      if (activePass) {
        await debitPass(db, activePass.id);
      } else if (isDrawingOnCredits(user, capturesUsedBefore)) {
        await debitCredit(db, user);
      }

      await publishPublicQuestion(db, user, { questionText, answer, explanation, whyOthersWrong });
    }

    return jsonResponse(200, { answer, explanation, why_others_wrong: whyOthersWrong });
  } catch (err) {
    console.error('analyze-question error:', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    return jsonResponse(status, { error: err?.message || 'Failed to analyze the image.' });
  }
};
