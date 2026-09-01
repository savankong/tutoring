// Single Node/Express server replacing Netlify's Functions runtime + static
// hosting + redirects, for deployment on DO App Platform.
//
// Every handler in netlify/functions/*.js is unchanged: `export default
// async (request) => Response`, Web Fetch API style. This file's only job is
// adapting Express's req/res to that shape and back — no body-parsing
// middleware runs before it, so each handler's own request.json()/
// request.text() sees the exact same bytes it always has (this matters for
// stripe-webhook.js, which verifies a signature over the raw body).
import express from 'express';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getDatabase } from '../netlify/lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FUNCTIONS_DIR = path.join(__dirname, '..', 'netlify', 'functions');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 8080;

// Every DB-backed route (register/login/Google OAuth/captures/admin/billing)
// throws inside its handler when the pool can't be created or a query fails,
// and that throw is caught below and flattened to the same generic 500 the
// browser sees either way — so a bad DATABASE_URL (unset, wrong credentials,
// unreachable due to the DO Managed PostgreSQL cluster's trusted-sources
// firewall, or migrations never applied) is otherwise invisible until a real
// user hits register/login and reports "Internal server error" with no other
// clue. Ping the DB once at boot so the real cause is the first thing in
// `doctl apps logs` instead of something to guess at later.
async function checkDatabaseConnection() {
  try {
    await getDatabase().sql`SELECT 1`;
    console.log('Database connection OK.');
  } catch (err) {
    console.error(
      'Database connection check FAILED at startup. Every DB-backed route ' +
        '(register, login, Google OAuth, captures, admin, billing) will ' +
        'return 500 Internal Server Error until this is fixed. Check that ' +
        'DATABASE_URL is set correctly, that the DO Managed PostgreSQL ' +
        "cluster's trusted sources include this app, and that `npm run " +
        'migrate` has been run against it:',
      err,
    );
  }
}

async function loadHandlers() {
  const handlers = new Map();
  const files = readdirSync(FUNCTIONS_DIR).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const name = file.slice(0, -3);
    const mod = await import(pathToFileURL(path.join(FUNCTIONS_DIR, file)).href);
    handlers.set(name, mod.default);
  }
  return handlers;
}

function bufferRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function toWebRequest(req, rawBody) {
  const url = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody && rawBody.length > 0 ? rawBody : undefined,
  });
}

async function sendWebResponse(res, response) {
  res.status(response.status);
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') continue; // handled below
    res.setHeader(key, value);
  }
  const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  if (cookies.length > 0) res.setHeader('set-cookie', cookies);

  const body = response.body ? Buffer.from(await response.arrayBuffer()) : Buffer.alloc(0);
  res.end(body);
}

async function main() {
  const handlers = await loadHandlers();
  await checkDatabaseConnection();

  const app = express();
  // App Platform terminates TLS and proxies over HTTP internally; trust its
  // X-Forwarded-* headers so req.protocol (used to build OAuth redirect_uris
  // and email links from request.url) reports https, not http.
  app.set('trust proxy', true);

  app.all('/api/:name', async (req, res) => {
    const handler = handlers.get(req.params.name);
    if (!handler) return res.status(404).json({ error: 'Not found' });

    try {
      const rawBody = await bufferRawBody(req);
      const webRequest = toWebRequest(req, rawBody);
      const webResponse = await handler(webRequest);
      await sendWebResponse(res, webResponse);
    } catch (err) {
      console.error(`Handler /api/${req.params.name} failed:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Cache-Control matters here, not just as an optimization: express.static
  // sets none by default, which left browsers free to heuristically cache
  // HTML pages (index.html and the 24 prerendered SEO pages) for an
  // unpredictable stretch. A deploy replaces the JS/CSS bundles with
  // freshly content-hashed filenames and deletes the old ones, so a
  // browser holding a stale cached HTML page kept referencing asset
  // filenames that no longer existed — the page would load with broken or
  // half-missing styling until a hard refresh forced a real fetch. Fixed
  // by cache-busting HTML explicitly (immutable filenames don't need
  // this — they're addressed by content hash, so far-future caching is
  // actually correct for them, and is what makes the fetch cheap on
  // repeat visits once the HTML itself is fresh).
  //
  // `no-store`, not just `no-cache`: `no-cache` still lets the browser
  // *store* the response (it just has to revalidate before reusing it),
  // which meant a tab that returned to a page via back/forward or a
  // suspended-tab restore could still get served straight from
  // back/forward cache (bfcache) — a frozen snapshot with no network
  // round trip and no Cache-Control check at all, so stale HTML kept
  // showing up on a page that had been sitting open a while, until a
  // hard reload (which never uses bfcache) fixed it. Browsers specifically
  // exclude `no-store` responses from bfcache eligibility, so this closes
  // that gap — confirmed to be recurring in production 2026-08-31.
  app.use(
    express.static(DIST_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store');
        } else if (/[/\\]assets[/\\]/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  // /contact was a standalone page briefly, now inlined as a mailto link on
  // the legal pages (the #ask section it used to redirect to no longer
  // exists — see "Design system" in CLAUDE.md).
  app.get('/contact', (req, res) => res.redirect(301, '/'));

  // SPA fallback so client-side routes (/app, /history, /account, ...)
  // survive a direct load or refresh.
  app.use((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(404).json({ error: 'Not found' });
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Cambo server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
