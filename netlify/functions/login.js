import { getDatabase } from '@netlify/database';
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

  if (!user || !user.password_hash) return invalidCredentials();
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return invalidCredentials();

  const token = signSession(user.id);
  return jsonResponse(
    200,
    { email: user.email, plan: user.plan, subscription_status: user.subscription_status },
    { 'set-cookie': sessionCookieHeader(token) },
  );
};
