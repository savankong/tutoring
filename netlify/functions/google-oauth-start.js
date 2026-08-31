import { oauthCheckoutCookieHeader, oauthRefCookieHeader, oauthStateCookieHeader } from '../lib/auth.js';
import { sanitizeRef } from '../lib/referral.js';
import { PLANS, PASSES } from '../lib/plans.js';

const PAID_PLAN_KEYS = new Set(['starter', 'personal', 'pro']);

export default async (request) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const state = crypto.randomUUID();
  const ref = sanitizeRef(url.searchParams.get('ref'));

  const planParam = url.searchParams.get('plan');
  const passParam = url.searchParams.get('pass');
  // Mirrors Register.jsx's own precedence: plan and pass are mutually
  // exclusive CTAs on the pricing page, so plan wins if somehow both arrive.
  let checkoutIntent = null;
  if (PAID_PLAN_KEYS.has(planParam) && PLANS[planParam]) {
    checkoutIntent = `plan:${planParam}`;
  } else if (passParam && PASSES[passParam]) {
    checkoutIntent = `pass:${passParam}`;
  }

  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', `${origin}/api/google-oauth-callback`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('state', state);

  const headers = new Headers({ location: authorizeUrl.toString() });
  headers.append('set-cookie', oauthStateCookieHeader(state));
  if (ref) headers.append('set-cookie', oauthRefCookieHeader(ref));
  if (checkoutIntent) headers.append('set-cookie', oauthCheckoutCookieHeader(checkoutIntent));

  return new Response(null, { status: 302, headers });
};
