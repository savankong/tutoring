import { oauthRefCookieHeader, oauthStateCookieHeader } from '../lib/auth.js';
import { sanitizeRef } from '../lib/referral.js';

export default async (request) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const state = crypto.randomUUID();
  const ref = sanitizeRef(url.searchParams.get('ref'));

  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', `${origin}/api/google-oauth-callback`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('state', state);

  const headers = new Headers({ location: authorizeUrl.toString() });
  headers.append('set-cookie', oauthStateCookieHeader(state));
  if (ref) headers.append('set-cookie', oauthRefCookieHeader(ref));

  return new Response(null, { status: 302, headers });
};
