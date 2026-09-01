import Stripe from 'stripe';
import { getDatabase } from '../lib/db.js';
import {
  clearedOauthCheckoutCookieHeader,
  clearedOauthInvitedByCookieHeader,
  clearedOauthRefCookieHeader,
  clearedOauthStateCookieHeader,
  readOauthCheckoutCookie,
  readOauthInvitedByCookie,
  readOauthRefCookie,
  readOauthStateCookie,
  sessionCookieHeader,
  signSession,
} from '../lib/auth.js';
import { grantInviteReward, sanitizeRef, userIdFromInviteCode } from '../lib/referral.js';
import { planCheckoutSessionParams, passCheckoutSessionParams } from '../lib/checkout.js';
import { addContactToAudience, sendAdminNewUserNotification, sendWelcomeEmail } from '../lib/email.js';

function redirectToLogin(origin, message) {
  const url = new URL('/login', origin);
  url.searchParams.set('error', message);
  const headers = new Headers({ location: url.toString() });
  headers.append('set-cookie', clearedOauthStateCookieHeader());
  headers.append('set-cookie', clearedOauthRefCookieHeader());
  headers.append('set-cookie', clearedOauthCheckoutCookieHeader());
  headers.append('set-cookie', clearedOauthInvitedByCookieHeader());
  return new Response(null, { status: 302, headers });
}

// Parses the "plan:<key>" / "pass:<key>" cookie set by google-oauth-start.js
// and, if there's a working Stripe checkout for it, returns the URL to send
// the user to instead of /app — mirrors what Register.jsx does for the
// email/password signup path, just server-side since there's no client-side
// fetch step in an OAuth redirect.
async function checkoutRedirectUrl(request, origin, user) {
  const intent = readOauthCheckoutCookie(request);
  if (!intent) return null;
  const [kind, key] = intent.split(':');
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  const params =
    kind === 'plan'
      ? planCheckoutSessionParams({ origin, planKey: key, userId: user.id, userEmail: user.email })
      : kind === 'pass'
        ? passCheckoutSessionParams({
            origin,
            passKey: key,
            userId: user.id,
            userEmail: user.email,
            stripeCustomerId: user.stripe_customer_id,
          })
        : null;
  if (!params) return null;

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create(params);
    return session.url;
  } catch (err) {
    console.error('google-oauth-callback checkout error:', err);
    return null;
  }
}

export default async (request) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (url.searchParams.get('error')) {
    return redirectToLogin(origin, 'Google sign-in was cancelled.');
  }
  if (!code || !state || state !== readOauthStateCookie(request)) {
    return redirectToLogin(origin, 'Google sign-in failed. Please try again.');
  }

  let tokenRes;
  try {
    tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/google-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });
  } catch {
    return redirectToLogin(origin, 'Could not reach Google. Please try again.');
  }
  if (!tokenRes.ok) {
    return redirectToLogin(origin, 'Google sign-in failed. Please try again.');
  }
  const { access_token: accessToken } = await tokenRes.json();

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!userInfoRes.ok) {
    return redirectToLogin(origin, 'Google sign-in failed. Please try again.');
  }
  const googleUser = await userInfoRes.json();
  const email = (googleUser.email || '').trim().toLowerCase();
  const googleId = googleUser.sub;
  if (!email || !googleUser.email_verified || !googleId) {
    return redirectToLogin(origin, 'Your Google account has no verified email.');
  }

  const db = getDatabase();
  const signupRef = sanitizeRef(readOauthRefCookie(request));

  let isNewUser = false;
  let [user] = await db.sql`SELECT * FROM users WHERE google_id = ${googleId}`;
  if (!user) {
    const [existingByEmail] = await db.sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingByEmail) {
      [user] = await db.sql`
        UPDATE users SET google_id = ${googleId} WHERE id = ${existingByEmail.id}
        RETURNING *
      `;
    } else {
      // Same existence check register.js does — google-oauth-start.js only
      // validated the cookie's shape, not that the user is still real.
      const invitedByCandidate = userIdFromInviteCode(readOauthInvitedByCookie(request));
      let invitedByUserId = null;
      if (invitedByCandidate) {
        const [inviter] = await db.sql`SELECT id FROM users WHERE id = ${invitedByCandidate}`;
        if (inviter) invitedByUserId = inviter.id;
      }

      // plan defaults to 'free' — no trial clock, no card required.
      [user] = await db.sql`
        INSERT INTO users (email, google_id, signup_ref, invited_by_user_id)
        VALUES (${email}, ${googleId}, ${signupRef}, ${invitedByUserId})
        RETURNING *
      `;
      isNewUser = true;
    }
  }

  if (isNewUser) {
    // Fire-and-forget-ish, same pattern as register.js: never let an email
    // hiccup block sign-in. No verification email here — Google already
    // verified this address (checked above), unlike the email/password path.
    try {
      await sendWelcomeEmail(user.email, 'google');
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
    try {
      await sendAdminNewUserNotification(user.email, 'Google');
    } catch (err) {
      console.error('Failed to send admin new-user notification:', err);
    }
    try {
      await addContactToAudience(user.email);
    } catch (err) {
      console.error('Failed to add user to Resend audience:', err);
    }
    // Granted immediately (not deferred like the email/password path in
    // verify-email.js) since Google already verified this email address.
    try {
      await grantInviteReward(db, user.id);
    } catch (err) {
      console.error('Failed to grant invite reward:', err);
    }
  }

  const token = signSession(user.id);
  const checkoutUrl = await checkoutRedirectUrl(request, origin, user);
  const location = checkoutUrl || new URL('/app', origin).toString();
  const headers = new Headers({ location });
  headers.append('set-cookie', sessionCookieHeader(token));
  headers.append('set-cookie', clearedOauthRefCookieHeader());
  headers.append('set-cookie', clearedOauthCheckoutCookieHeader());
  headers.append('set-cookie', clearedOauthInvitedByCookieHeader());
  return new Response(null, { status: 302, headers });
};
