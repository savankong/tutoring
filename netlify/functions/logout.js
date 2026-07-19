import { clearedSessionCookieHeader } from '../lib/auth.js';

export default async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': clearedSessionCookieHeader(),
    },
  });
};
