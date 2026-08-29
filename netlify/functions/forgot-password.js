import { getDatabase } from '../lib/db.js';
import { generateToken, hashToken } from '../lib/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const RESET_TOKEN_TTL_MINUTES = 60;

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

  // Same response whether or not the account exists, and whether or not the
  // send succeeds — this endpoint must not be usable to enumerate emails.
  const genericResponse = () =>
    jsonResponse(200, { message: "If an account exists for that email, we've sent a reset link." });

  if (!email) return genericResponse();

  const db = getDatabase();
  const [user] = await db.sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;

  // Google-only accounts have no password_hash and nothing to reset.
  if (!user || !user.password_hash) return genericResponse();

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  await db.sql`
    UPDATE users
    SET reset_token_hash = ${tokenHash}, reset_token_expires_at = ${expiresAt}
    WHERE id = ${user.id}
  `;

  const resetUrl = new URL('/reset-password', new URL(request.url).origin);
  resetUrl.searchParams.set('token', token);

  try {
    await sendPasswordResetEmail(user.email, resetUrl.toString());
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }

  return genericResponse();
};
