import { getDatabase } from '@netlify/database';
import { hashPassword, signSession, sessionCookieHeader } from '../lib/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRIAL_DAYS = 7;

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
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

  const email = (body?.email || '').trim().toLowerCase();
  const password = body?.password || '';

  if (!EMAIL_RE.test(email)) {
    return jsonResponse(400, { error: 'Enter a valid email address.' });
  }
  if (password.length < 8) {
    return jsonResponse(400, { error: 'Password must be at least 8 characters.' });
  }

  const db = getDatabase();

  const [existing] = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing) {
    return jsonResponse(409, { error: 'An account with that email already exists.' });
  }

  const passwordHash = await hashPassword(password);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, trial_ends_at)
    VALUES (${email}, ${passwordHash}, ${trialEndsAt})
    RETURNING id, email, trial_ends_at, subscription_status
  `;

  const token = signSession(user.id);
  return jsonResponse(
    200,
    { email: user.email, trial_ends_at: user.trial_ends_at, subscription_status: user.subscription_status },
    { 'set-cookie': sessionCookieHeader(token) },
  );
};
