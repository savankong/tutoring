import { sendFormSubmission } from '../lib/email.js';

// Replaces Netlify Forms (see src/lib/submitForm.js for the frontend side).
// Field names mirror what the two forms used to submit as data-netlify
// forms: "question" (name, email, question) and "help" (email, subject,
// message) — both also carry a honeypot field.
const ALLOWED_FORMS = new Set(['question', 'help']);

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

  const { formName, 'bot-field': botField, ...fields } = body ?? {};

  if (!ALLOWED_FORMS.has(formName)) {
    return jsonResponse(400, { error: 'Unknown form.' });
  }
  // Honeypot: real users never fill this in — a bot that does gets a fake
  // success response so it doesn't learn to work around it.
  if (botField) {
    return jsonResponse(200, { ok: true });
  }

  try {
    await sendFormSubmission(formName, fields);
  } catch (err) {
    console.error('submit-form failed:', err);
    return jsonResponse(500, { error: 'Could not submit the form. Please try again.' });
  }

  return jsonResponse(200, { ok: true });
};
