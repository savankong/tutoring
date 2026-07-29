# Cambo App

AI camera-capture app for tutors: point your phone at a practice question, get the answer in seconds. Domain: camboapp.com.

## Docs & handoff

Full project docs (strategy, product spec, architecture, marketing/campaign pages, design + brand kit, secrets index, open items/backlog) live in Notion: [Cambo App — Strategy, Spec, Architecture & Marketing](https://app.notion.com/p/3a66f02f3b71814e9c9ce5b2af588c1e) — start there for anything not covered by this file. The **🔒 Secrets & API Keys** sub-page documents which env vars exist (names only, not values — see "Required env vars" below for where actual values live). Requires the Notion connector to be authorized for whatever account is using it; if it's not connected, this file plus the code itself are still self-sufficient for local dev.

## Repo & branch

- GitHub: `github.com/savankong/tutoring` — Working branch: `claude/tutor-camera-app-setup-u6xbvg`. This branch is pushed and up to date with prod as of 2026-07-26 (handoff point — see "Docs & handoff" below).
- **Never push to the remote or open a PR unless explicitly asked.** Commits stay local by default; only push when the user explicitly requests it (e.g. for a handoff to another session/account).

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
- Auth: email/password (gated behind email verification — see below) + Google OAuth (OAuth client reused from warroomusa.com, exempt from verification since Google already verified that email)
- AI: Anthropic SDK, model `claude-opus-4-8`, structured JSON-schema output for question analysis (see `netlify/functions/analyze-question.js`)
- Payments: Stripe, live mode
- Transactional email: Resend (see "Email (Resend)" below)
- Marketing/support forms: Netlify Forms (see "Forms (Netlify Forms)" below)

## Design system (redesigned to match a Claude Design mockup export)

- Single dark theme, no light/dark toggle — tokens in `src/index.css` `:root`. Key values: `--bg` `#111208`, `--card-bg` `#161810`, `--card-bg-2` `#1B1D12`, `--text-h` `#F5F1E4`, `--accent` (lime) `#D7FF3F`, `--accent2` (orange) `#FF5B35`. Font: Nunito (Google Fonts link in `index.html`).
- Shared `Sidebar` (`src/components/Sidebar.jsx`): fixed 248px desktop left nav, collapses to a horizontal top bar on mobile via CSS only (no JS). Used by Landing, Pricing, and all 24 SEO campaign pages (via `LpHeader.jsx`). Auth-aware through an optional `user` prop — hydrated pages pass `useAuthContext().user`; the static campaign pages omit it and always render logged-out (no auth context there).
- Decorative rotated "shape" motif (solid-fill + outlined rounded squares in accent/accent2) sits behind the hero phone mockup and the footer CTA — see `.hero-shape*` / `.footer-cta-shape*` in `App.css`. Don't drop a solid-fill version of this behind body copy — it tanked text contrast once (the how-section steps list) and had to be walked back to icon-badges/removed.
- Why-cards use inline SVG icon badges (bolt/phone/target/keyboard/dollar), not an icon font or emoji — see `WHY_ICON_PATHS` in `Landing.jsx`. Emoji/icon-font glyphs are not guaranteed to render across environments; inline SVG is the safe default here.
- The 24 SEO landing pages (`src/landing-pages/`, built via `renderToStaticMarkup` — zero JS, no hydration) share the same CSS classes as `Landing.jsx`, so most visual changes cascade automatically. Still check each `Lp*.jsx` component individually for its own hardcoded styles — `LpHero.jsx` had a duplicated phone-mockup with hardcoded light-theme inline colors that the shared-class cascade didn't touch.
- `HardReloadFallback` (`src/components/HardReloadFallback.jsx`) is the router's catch-all `*` route in `App.jsx`. If the SPA shell ever loads for a URL it doesn't own (chiefly a static SEO page URL, e.g. after a CDN edge propagation blip right after deploy), `<Routes>` would otherwise render nothing. This forces a real page navigation instead of a client render, which re-requests the URL and lets Netlify serve the actual static file — self-healing. Guarded by `sessionStorage` against looping if the failure is persistent rather than transient.
- Logo (`src/components/Logo.jsx`): a camera-lens mark (shutter ring, lens-flare arc, aperture swoosh, viewfinder bar) supplied directly by Savan (source: `logo.svg`/`logo.png` in `/Users/savankong/Projects/cambo-tutoring/Logos/`), replacing an earlier viewfinder-bracket mark as of 2026-07-25. **Fixed multi-tone palette, not `currentColor`** — `#595959`/`#A5A5A5`/`#F84B1F`/`#DF5A39` — it keeps its own colors regardless of surrounding text color, unlike the old mark. Non-square (442:513 aspect ratio) — the `size` prop scales height, width is derived. `public/favicon.svg` + `public/icons/icon-{180,192,512}.png` use the same mark on the existing rounded-square dark tile (regenerate the PNGs from `favicon.svg` via `sharp` if the mark ever changes again — no dedicated script for this, see git history for the one-off command). Full brand kit (dark/light lockups, mono-black, app icon, usage notes) lives on the Notion Design page — see "Docs & handoff" below.
- Camera capture crop handles (`.crop-handle` in `App.css`): must stay flush *inward* from the crop-rect corner, not straddling it with a negative margin. `.camera-viewfinder` clips overflow (for the rounded video frame) and the default crop rect is flush against its edges — a handle that hangs half outside the crop-rect gets half-clipped, which happens to be exactly where its visible L-bracket border lives, making it invisible until a corner's been dragged inward once. Bit us in production; don't reintroduce it.

## Auth — password reset & email verification

- Token pattern (shared by both flows): a random 256-bit token is generated (`generateToken()` in `netlify/lib/auth.js`), only its SHA-256 hash is stored (`users.reset_token_hash` / `users.verify_token_hash`), and the raw token only ever lives in the emailed link. Single-use, expiring (reset: 1hr, verification: 24hr).
- **Forgot password**: `forgot-password.js` → `reset-password.js`. Always returns the same generic response regardless of whether the account exists (no email enumeration). Google-only accounts (no `password_hash`) are skipped. Successful reset signs the user in immediately.
- **Email verification**: `register.js` sends the token; `verify-email.js` / `resend-verification.js` (Account page "Need help?" area is actually the resend-verification UI — the card itself is titled "Verify your email") consume/reissue it. New email/password signups get `users.email_verified = false`; `analyze-question.js` blocks captures (`403`, `reason: "email_unverified"`) until verified — this exists specifically to add friction against farming disposable-email accounts to reset the Free tier's 20-captures/month cap, not to gate login/account access generally. Existing users at ship time (2026-07-25) were backfilled `email_verified = true` in the migration.

## Email (Resend)

- `netlify/lib/email.js` sends both password-reset and verification emails via the Resend API. Requires `RESEND_API_KEY`.
- `camboapp.com` is verified as a Resend sending domain via DKIM + SPF + DMARC TXT/MX records added directly to Netlify DNS (not in this repo — check the Netlify DNS zone for `camboapp.com` if these ever need to be re-added). Sends from `noreply@camboapp.com`.
- **New domains have zero sending reputation.** Outlook/Yahoo/iCloud route mail to spam/Other for the first days-to-weeks after a domain starts sending, regardless of correct DKIM/SPF/DMARC — this is expected, not a misconfiguration. Check the Resend dashboard's delivered/bounced ratio if verification emails seem to be going unanswered.

## Forms (Netlify Forms)

- Two forms: `question` (inline on the homepage, `#ask` section in `Landing.jsx`, for logged-out visitors) and `help` (Account page "Need help?" card, for logged-in users). Both submit via `src/lib/netlifyForms.js`'s `submitNetlifyForm()` — a plain POST to `/` with the form name + fields, no backend function involved.
- Netlify's build-time crawler only detects `<form data-netlify>` markup present in a **static** HTML file — it never runs the SPA's JS. Since `/account` (the real `help` form's page) is never prerendered, a hidden `<form data-netlify>` pair for both forms lives in `index.html` outside `<div id="root">`, so it survives untouched through both the Vite build and `prerender.mjs`'s `template.replace()` (which only touches the `#root` div and `<head>` tags) — present in every deployed HTML file site-wide. Field names there must exactly match what the real forms submit.
- **Gotcha**: Netlify rewrites detected forms at deploy time — `data-netlify="true"`/`netlify-honeypot="..."` get stripped and replaced with normalized `<form hidden method='post' name='...'>` plus an injected `<input type='hidden' name='form-name' ...>` (single-quoted attributes). If you're grepping deployed HTML to verify a form shipped, match the *rewritten* shape, not the source `data-netlify` attributes — otherwise it looks like the form vanished when it didn't.
- Submissions forward to `camboapp101@gmail.com` via a site-level "Form submission notifications" email rule (Project configuration → Notifications → Form submission notifications) — configured in the Netlify dashboard, not in code.

## Business logic — plan tiers

`netlify/lib/plans.js` is the source of truth; `src/lib/plans.js` is a display-only mirror for the frontend (never import backend-only code into the client bundle).

| Plan | Price | Cap | Grace buffer | Beyond cap+grace |
|---|---|---|---|---|
| Free | $0 forever, no card | 20 captures/mo | — | hard block |
| Starter | $4.99/mo (`STRIPE_PRICE_STARTER`) | 45/mo | 5 | draw down credits, then block |
| Personal | $9.99/mo (`STRIPE_PRICE_PERSONAL`) | 90/mo | 10 | draw down credits, then block |
| Pro | $19.99/mo (`STRIPE_PRICE_PRO`) | 180/mo | 20 | draw down credits, then block |

No Team/Enterprise tier — Free/Starter/Personal/Pro is the whole ladder.

Cap + grace per paid tier is sized so worst-case per-capture cost (~$0.075 at `claude-opus-4-8` rates: large gallery image + hardest reasoning) never exceeds ~75% of the plan price — do the same math before changing any cap or price (see `netlify/lib/plans.js` comment for the derivation).

The legacy `STRIPE_PRICE_ID` (old $15/mo plan) is still honored in `stripe-webhook.js`'s price→plan mapping for existing subscribers, treated as Personal-tier caps — don't remove it.

**Add-on credits replace automatic overage billing.** Once a paid subscriber passes cap + grace, further captures debit `users.credit_balance` (1 credit = 1 capture) instead of triggering a Stripe invoice item. If the balance hits 0, captures are blocked (`analyze-question.js` → `isCapped`) until they buy more via `create-credit-checkout-session.js` (`STRIPE_PRICE_CREDIT_PACK`, `CREDIT_PACK_SIZE` = 100 credits / `CREDIT_PACK_PRICE_CENTS` = $15.00 — deliberately priced above the old $0.12/capture rate since credits are now the profit center). Credits roll over indefinitely while the user stays on a paid plan; `customer.subscription.deleted` resets `credit_balance` to 0 on downgrade to Free. Free-tier users cannot buy credits (`plan.creditsAllowed`). Purchases are recorded in `credit_purchases`, keyed on the Stripe checkout session id for webhook idempotency.

Cancellation (`customer.subscription.deleted`) drops a user back to `plan = 'free'` rather than cutting off access entirely.

Admin bootstrap: `savankong@gmail.com` is the (only) admin, promoted directly in the DB.

## Required env vars (Netlify dashboard — names only, never commit or print actual values)

`JWT_SECRET`, `APP_SESSION_SECRET`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (legacy), `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PERSONAL`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_CREDIT_PACK`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY` (password-reset + email-verification emails; sends from `noreply@camboapp.com`, domain verified in Resend via DNS records on Netlify DNS — see "Email (Resend)" above).

## Verification patterns that work here

- No direct DB access (no psql). Verify through the real app: register a test user via browser automation tools, or use a guarded temp `netlify/functions/debug-*.js` endpoint (hardcoded token gate) — **always delete it after use, and never deploy one without confirming the plan first.**
- Camera-dependent UI in a sandboxed browser: monkey-patch `navigator.mediaDevices.getUserMedia` to return a `canvas.captureStream(fps)` synthetic feed. Drives the real app code path, including real Claude calls, with no physical camera.
- Billing-sensitive changes: seed test data + isolated Stripe **test-mode** API calls. Never complete a real Checkout with a real card for testing — creating live Stripe Products/Prices or completing a real payment needs explicit confirmation of the exact numbers first, every time.
- Run `node --check` on every modified Netlify function before deploying — a syntax error here has broken a deploy before.
- For UI changes, actually drive the feature in the Browser pane (not just build/lint) before calling it done.

## House rules

- **Deploys are automatic — don't ask first.** Once a change is implemented and verified (build passes, `node --check` on modified functions, UI driven in the Browser pane where applicable), commit locally and run the `netlify deploy --prod` command above without stopping to confirm. This does not extend to git remote pushes/PRs (still never do that unless explicitly asked) or to creating/editing live Stripe Products or Prices (still needs explicit confirmation of exact numbers every time).
- Never enter real payment/financial credentials anywhere, and never complete a real money transaction.
- When something is ambiguous or costly to get wrong (pricing, tier structure, copy), ask before building. If there's no immediate answer, state the assumption clearly and proceed rather than blocking.
