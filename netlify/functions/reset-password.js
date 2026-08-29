import { getDatabase } from '../lib/db.js';
import { hashPassword, hashToken, sessionCookieHeader, signSession } from '../lib/auth.js';

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

  const token = (body?.token || '').trim();
  const password = body?.password || '';

  if (!token) {
    return jsonResponse(400, { error: 'Missing reset token.' });
  }
  if (password.length < 8) {
    return jsonResponse(400, { error: 'Password must be at least 8 characters.' });
  }

  const db = getDatabase();
  const tokenHash = await hashToken(token);

  const [user] = await db.sql`
    SELECT id, email FROM users
    WHERE reset_token_hash = ${tokenHash} AND reset_token_expires_at > now()
  `;

  if (!user) {
    return jsonResponse(400, { error: 'This reset link is invalid or has expired.' });
  }

  const passwordHash = await hashPassword(password);

  const [updated] = await db.sql`
    UPDATE users
    SET password_hash = ${passwordHash}, reset_token_hash = NULL, reset_token_expires_at = NULL
    WHERE id = ${user.id}
    RETURNING id, email, plan, subscription_status
  `;

  const sessionToken = signSession(updated.id);
  return jsonResponse(
    200,
    { email: updated.email, plan: updated.plan, subscription_status: updated.subscription_status },
    { 'set-cookie': sessionCookieHeader(sessionToken) },
  );
};
