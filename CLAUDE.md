# Cambo App

AI camera-capture app for tutors: point your phone at a practice question, get the answer in seconds. Domain: camboapp.com.

## Repo & branch

- Working branch: `claude/tutor-camera-app-setup-u6xbvg`
- **Never push to the remote or open a PR unless explicitly asked.** All commits stay local until told otherwise.

## Hosting (Netlify)

- Site name: `tutor-camera-app`
- Site ID: `07e69cb1-330d-41bb-8c21-0d5290d2c7ec`
- Production URL: `https://camboapp.com`
- Deploy (after `npm run build`):
  ```
  netlify deploy --prod --site 07e69cb1-330d-41bb-8c21-0d5290d2c7ec --dir dist --functions netlify/functions
  ```
  Add `--skip-functions-cache` whenever backend function code changed — Netlify can otherwise serve a stale cached function bundle even after a "successful" deploy.
- **Only `--prod` deploys have database access.** Draft/branch-alias deploys show `database_branch_id: null` in their metadata — fine for pure Stripe API checks, useless for anything touching Postgres (any `getDatabase()` call will fail with an opaque `"error decoding lambda response: unexpected end of JSON input"`).
- Confirm a migration actually applied:
  ```
  netlify api getSiteDeploy --data '{"site_id":"07e69cb1-330d-41bb-8c21-0d5290d2c7ec","deploy_id":"<id>"}' | grep -i database
  ```
  Look for `database_migrations.files[].applied: true`.
- Env var changes need a fresh deploy to take effect (Lambda bundles env at deploy time, not injected live per-request). The Netlify MCP env-var write tool has been unreliable — use the Netlify dashboard UI and get explicit confirmation before deploying.
- To view function logs: `netlify link --id 07e69cb1-330d-41bb-8c21-0d5290d2c7ec` once, then `netlify logs --source functions --function <name> --since 20m`.

## Stack

- Frontend: React + Vite + React Router (`src/`)
- Backend: Netlify Functions, Node ESM (`netlify/functions/`), shared logic in `netlify/lib/`
- Database: Netlify DB / Neon Postgres via `@netlify/database`; migrations in `netlify/database/migrations/<timestamp>_<name>/migration.sql`
- Auth: email/password + Google OAuth (OAuth client reused from warroomusa.com)
- AI: Anthropic SDK, model `claude-opus-4-8`, structured JSON-schema output for question analysis (see `netlify/functions/analyze-question.js`)
- Payments: Stripe, live mode

## Business logic — plan tiers

`netlify/lib/plans.js` is the source of truth; `src/lib/plans.js` is a display-only mirror for the frontend (never import backend-only code into the client bundle).

| Plan | Price | Cap | Grace buffer | Overage |
|---|---|---|---|---|
| Free | $0 forever, no card | 20 captures/mo | — | hard block at cap |
| Personal | $9/mo (`STRIPE_PRICE_PERSONAL`) | 200/mo | 20 | $0.12/capture |
| Pro | $20/mo (`STRIPE_PRICE_PRO`) | 600/mo | 30 | $0.12/capture |
| Team | contact sales, no Stripe price | — | — | — |

The legacy `STRIPE_PRICE_ID` (old $15/mo plan) is still honored in `stripe-webhook.js`'s price→plan mapping for existing subscribers, treated as Personal-tier caps — don't remove it. Overage bills as a pending Stripe invoice item that auto-sweeps into the customer's next invoice; no cron job or scheduled function involved.

Cancellation (`customer.subscription.deleted`) drops a user back to `plan = 'free'` rather than cutting off access entirely.

Admin bootstrap: `savankong@gmail.com` is the (only) admin, promoted directly in the DB.

## Required env vars (Netlify dashboard — names only, never commit or print actual values)

`JWT_SECRET`, `APP_SESSION_SECRET`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (legacy), `STRIPE_PRICE_PERSONAL`, `STRIPE_PRICE_PRO`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Verification patterns that work here

- No direct DB access (no psql). Verify through the real app: register a test user via browser automation tools, or use a guarded temp `netlify/functions/debug-*.js` endpoint (hardcoded token gate) — **always delete it after use, and never deploy one without confirming the plan first.**
- Camera-dependent UI in a sandboxed browser: monkey-patch `navigator.mediaDevices.getUserMedia` to return a `canvas.captureStream(fps)` synthetic feed. Drives the real app code path, including real Claude calls, with no physical camera.
- Billing-sensitive changes: seed test data + isolated Stripe **test-mode** API calls. Never complete a real Checkout with a real card for testing — creating live Stripe Products/Prices or completing a real payment needs explicit confirmation of the exact numbers first, every time.
- Run `node --check` on every modified Netlify function before deploying — a syntax error here has broken a deploy before.
- For UI changes, actually drive the feature in the Browser pane (not just build/lint) before calling it done.

## House rules

- Never push to git remote or deploy destructively without asking.
- Never enter real payment/financial credentials anywhere, and never complete a real money transaction.
- When something is ambiguous or costly to get wrong (pricing, tier structure, copy), ask before building. If there's no immediate answer, state the assumption clearly and proceed rather than blocking.
