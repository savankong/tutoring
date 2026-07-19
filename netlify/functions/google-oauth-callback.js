import { getDatabase } from '@netlify/database';
import {
  clearedOauthStateCookieHeader,
  readOauthStateCookie,
  sessionCookieHeader,
  signSession,
} from '../lib/auth.js';

const TRIAL_DAYS = 7;

function redirectToLogin(origin, message) {
  const url = new URL('/login', origin);
  url.searchParams.set('error', message);
  return new Response(null, {
    status: 302,
    headers: { location: url.toString(), 'set-cookie': clearedOauthStateCookieHeader() },
  });
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
        redirect_uri: `${origin}/.netlify/functions/google-oauth-callback`,
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

  let [user] = await db.sql`SELECT * FROM users WHERE google_id = ${googleId}`;
  if (!user) {
    const [existingByEmail] = await db.sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingByEmail) {
      [user] = await db.sql`
        UPDATE users SET google_id = ${googleId} WHERE id = ${existingByEmail.id}
        RETURNING *
      `;
    } else {
      const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      [user] = await db.sql`
        INSERT INTO users (email, google_id, trial_ends_at)
        VALUES (${email}, ${googleId}, ${trialEndsAt})
        RETURNING *
      `;
    }
  }

  const token = signSession(user.id);
  const appUrl = new URL('/app', origin);
  return new Response(null, {
    status: 302,
    headers: { location: appUrl.toString(), 'set-cookie': sessionCookieHeader(token) },
  });
};
