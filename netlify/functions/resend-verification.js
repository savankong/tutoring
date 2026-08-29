import { getDatabase } from '../lib/db.js';
import { generateToken, hashToken, requireUser } from '../lib/auth.js';
import { sendVerificationEmail } from '../lib/email.js';

const VERIFY_TOKEN_TTL_HOURS = 24;

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

  const db = getDatabase();
  const user = await requireUser(request, db);
  if (!user) {
    return jsonResponse(401, { error: 'Not signed in.' });
  }
  if (user.email_verified || user.google_id) {
    return jsonResponse(200, { message: 'Your email is already verified.' });
  }

  const verifyToken = generateToken();
  const verifyTokenHash = await hashToken(verifyToken);
  const verifyTokenExpiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await db.sql`
    UPDATE users
    SET verify_token_hash = ${verifyTokenHash}, verify_token_expires_at = ${verifyTokenExpiresAt}
    WHERE id = ${user.id}
  `;

  const verifyUrl = new URL('/verify-email', new URL(request.url).origin);
  verifyUrl.searchParams.set('token', verifyToken);

  try {
    await sendVerificationEmail(user.email, verifyUrl.toString());
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return jsonResponse(502, { error: 'Could not send the verification email. Try again shortly.' });
  }

  return jsonResponse(200, { message: 'Verification email sent.' });
};
