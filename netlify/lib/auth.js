import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_DAYS = 30;
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE_SECONDS = 600;

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
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

export function readOauthStateCookie(request) {
  return parseCookies(request)[OAUTH_STATE_COOKIE] || null;
}

export function oauthStateCookieHeader(state) {
  return `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`;
}

export function clearedOauthStateCookieHeader() {
  return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
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
