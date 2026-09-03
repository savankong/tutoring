import { getDatabase } from '../lib/db.js';
import { verifyPassword, signSession, sessionCookieHeader } from '../lib/auth.js';

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
  if (!email || !password) {
    return jsonResponse(400, { error: 'Email and password are required.' });
  }

  const db = getDatabase();
  const [user] = await db.sql`SELECT * FROM users WHERE email = ${email}`;

  const invalidCredentials = () => jsonResponse(401, { error: 'Incorrect email or password.' });

  if (!user) return invalidCredentials();
  // A real, deliberate exception to "don't reveal whether an account
  // exists": this account exists but was created via Google, so no password
  // attempt will ever succeed against it — telling the user that directly
  // (code: 'google_account', handled in Login.jsx) resolves the login
  // attempt instead of sending them into the forgot-password flow, where
  // that account also has no password to reset (see forgot-password.js) and
  // used to be a dead end. Login forms revealing "this email uses a
  // different sign-in method" is standard practice elsewhere (Slack,
  // Notion, etc.) — unlike forgot-password's response, which stays fully
  // generic since silent account-enumeration protection matters more there.
  if (!user.password_hash) return jsonResponse(401, { error: 'This email uses Google Sign-In.', code: 'google_account' });
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return invalidCredentials();

  const token = signSession(user.id);
  return jsonResponse(
    200,
    { email: user.email, plan: user.plan, subscription_status: user.subscription_status },
    { 'set-cookie': sessionCookieHeader(token) },
  );
};
