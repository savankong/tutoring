import { oauthStateCookieHeader } from '../lib/auth.js';

export default async (request) => {
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();

  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', `${origin}/.netlify/functions/google-oauth-callback`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorizeUrl.toString(),
      'set-cookie': oauthStateCookieHeader(state),
    },
  });
};
