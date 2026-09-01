import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'session';
// Long-lived on purpose — me.js reissues this cookie with a fresh expiry on
// every authenticated load, so an active tutor effectively never gets
// logged out; only someone who doesn't open the app for 90 straight days
// falls back to signing in again.
const SESSION_MAX_AGE_DAYS = 90;
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE_SECONDS = 600;
const OAUTH_REF_COOKIE = 'oauth_ref';
const OAUTH_CHECKOUT_COOKIE = 'oauth_checkout';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

const PASSWORD_MIN_LENGTH = 8;

// Returns an error message if the password fails the baseline, or null if
// it's fine. Shared by register.js and reset-password.js so both signup
// and password-reset enforce the exact same rule — added 2026-08-31,
// previously length-only.
export function passwordError(password) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character.';
  return null;
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signSession(userId) {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: `${SESSION_MAX_AGE_DAYS}d` });
}

export function verifySession(token) {
  try {
    const payload = jwt.verify(token, jwtSecret());
    return payload.sub ? payload : null;
  } catch {
    return null;
  }
}

function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

export function readSessionCookie(request) {
  return parseCookies(request)[SESSION_COOKIE] || null;
}

export function sessionCookieHeader(token) {
  const maxAge = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearedSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Raw, single-use token (password reset, email verification, ...) — sent to the user, never stored as-is. */
export function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hex digest of a token, for DB storage/lookup (mirrors password_hash's never-store-raw rule). */
export async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function readOauthStateCookie(request) {
  return parseCookies(request)[OAUTH_STATE_COOKIE] || null;
}

export function oauthStateCookieHeader(state) {
  return `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`;
}

export function clearedOauthStateCookieHeader() {
  return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Carries the landing-page ref (see netlify/lib/referral.js) across the
// Google redirect round-trip, same lifetime as the CSRF state cookie —
// there's no request body on an OAuth redirect to put it in otherwise.
export function readOauthRefCookie(request) {
  return parseCookies(request)[OAUTH_REF_COOKIE] || null;
}

export function oauthRefCookieHeader(ref) {
  return `${OAUTH_REF_COOKIE}=${ref}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`;
}

export function clearedOauthRefCookieHeader() {
  return `${OAUTH_REF_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Carries a pending plan/pass purchase (e.g. "plan:starter" or
// "pass:cram_24h") across the Google redirect round-trip, same mechanism as
// oauth_ref above — Register.jsx's ?plan=/?pass= only reaches the backend
// this way, since the Google button is a plain link, not a form post.
export function readOauthCheckoutCookie(request) {
  return parseCookies(request)[OAUTH_CHECKOUT_COOKIE] || null;
}

export function oauthCheckoutCookieHeader(value) {
  return `${OAUTH_CHECKOUT_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`;
}

export function clearedOauthCheckoutCookieHeader() {
  return `${OAUTH_CHECKOUT_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Returns the logged-in user's row, or null if there's no valid session. */
export async function requireUser(request, db) {
  const token = readSessionCookie(request);
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload) return null;
  const [user] = await db.sql`SELECT * FROM users WHERE id = ${payload.sub}`;
  return user || null;
}

/** Returns the logged-in user's row if they're an admin, or null otherwise. */
export async function requireAdmin(request, db) {
  const user = await requireUser(request, db);
  if (!user || user.role !== 'admin') return null;
  return user;
}
