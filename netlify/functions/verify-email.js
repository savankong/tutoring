import { getDatabase } from '../lib/db.js';
import { hashToken } from '../lib/auth.js';
import { grantInviteReward } from '../lib/referral.js';

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

  const token = (body?.token || '').trim();
  if (!token) {
    return jsonResponse(400, { error: 'Missing verification token.' });
  }

  const db = getDatabase();
  const tokenHash = await hashToken(token);

  const [user] = await db.sql`
    SELECT id FROM users
    WHERE verify_token_hash = ${tokenHash} AND verify_token_expires_at > now()
  `;

  if (!user) {
    return jsonResponse(400, { error: 'This verification link is invalid or has expired.' });
  }

  await db.sql`
    UPDATE users
    SET email_verified = true, verify_token_hash = NULL, verify_token_expires_at = NULL
    WHERE id = ${user.id}
  `;

  // If this account was invited by someone, this is the moment their
  // reward fires — deferred until now (rather than at signup) so a
  // disposable-email "friend" invited purely to farm free captures can't
  // trigger it, same anti-farming rationale as email_verified gating
  // captures in analyze-question.js.
  try {
    await grantInviteReward(db, user.id);
  } catch (err) {
    console.error('Failed to grant invite reward:', err);
  }

  return jsonResponse(200, { verified: true });
};
