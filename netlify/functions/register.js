import { getDatabase } from '@netlify/database';
import { hashPassword, signSession, sessionCookieHeader } from '../lib/auth.js';
import { sanitizeRef } from '../lib/referral.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const signupRef = sanitizeRef(body?.ref);

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

  // plan defaults to 'free' — everyone starts on the free tier, no trial
  // clock, no card required (see netlify/lib/plans.js).
  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, signup_ref)
    VALUES (${email}, ${passwordHash}, ${signupRef})
    RETURNING id, email, plan, subscription_status
  `;

  const token = signSession(user.id);
  return jsonResponse(
    200,
    { email: user.email, plan: user.plan, subscription_status: user.subscription_status },
    { 'set-cookie': sessionCookieHeader(token) },
  );
};
