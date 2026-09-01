import { getDatabase } from '../lib/db.js';
import { generateToken, hashPassword, hashToken, passwordError, signSession, sessionCookieHeader } from '../lib/auth.js';
import { addContactToAudience, sendAdminNewUserNotification, sendVerificationEmail, sendWelcomeEmail } from '../lib/email.js';
import { sanitizeRef } from '../lib/referral.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFY_TOKEN_TTL_HOURS = 24;

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
  const pwError = passwordError(password);
  if (pwError) {
    return jsonResponse(400, { error: pwError });
  }

  const db = getDatabase();

  const [existing] = await db.sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing) {
    return jsonResponse(409, { error: 'An account with that email already exists.' });
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = generateToken();
  const verifyTokenHash = await hashToken(verifyToken);
  const verifyTokenExpiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  // plan defaults to 'free' — everyone starts on the free tier, no trial
  // clock, no card required (see netlify/lib/plans.js). email_verified
  // defaults to false — captures are gated on it until they click the link
  // (see analyze-question.js), which is the point: it's the friction that
  // keeps disposable-email signups from farming free-tier captures.
  const [user] = await db.sql`
    INSERT INTO users (email, password_hash, signup_ref, verify_token_hash, verify_token_expires_at)
    VALUES (${email}, ${passwordHash}, ${signupRef}, ${verifyTokenHash}, ${verifyTokenExpiresAt})
    RETURNING id, email, plan, subscription_status
  `;

  const verifyUrl = new URL('/verify-email', new URL(request.url).origin);
  verifyUrl.searchParams.set('token', verifyToken);
  try {
    await sendVerificationEmail(user.email, verifyUrl.toString());
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }
  try {
    await sendWelcomeEmail(user.email, 'password');
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
  try {
    await sendAdminNewUserNotification(user.email, 'email/password');
  } catch (err) {
    console.error('Failed to send admin new-user notification:', err);
  }
  try {
    await addContactToAudience(user.email);
  } catch (err) {
    console.error('Failed to add user to Resend audience:', err);
  }

  const token = signSession(user.id);
  return jsonResponse(
    200,
    { email: user.email, plan: user.plan, subscription_status: user.subscription_status },
    { 'set-cookie': sessionCookieHeader(token) },
  );
};
