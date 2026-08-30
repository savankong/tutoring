# Cambo App

AI camera-capture app for tutors: point your phone at a practice question, get the answer in seconds. Domain: camboapp.com.

## Docs & handoff

Full project docs (strategy, product spec, architecture, marketing/campaign pages, design + brand kit, secrets index, open items/backlog) live in Notion: [Cambo App — Strategy, Spec, Architecture & Marketing](https://app.notion.com/p/3a66f02f3b71814e9c9ce5b2af588c1e) — start there for anything not covered by this file. The **🔒 Secrets & API Keys** sub-page documents which env vars exist (names only, not values — see "Required env vars" below for where actual values live). Requires the Notion connector to be authorized for whatever account is using it; if it's not connected, this file plus the code itself are still self-sufficient for local dev.

## Repo & branch

- GitHub: `github.com/savankong/tutoring` — `main` is the canonical branch as of 2026-08-29; all work funnels into it and `.do/app.yaml`'s `branch:` points at it. Point App Platform's GitHub source at `main` in the DO dashboard if it's still tracking an old `claude/*` branch from before this existed.
- **Never push to the remote or open a PR unless explicitly asked.** Commits stay local by default; only push when the user explicitly requests it (e.g. for a handoff to another session/account).

## Hosting (DigitalOcean App Platform)

**Migrated off Netlify starting 2026-08-29** (see git history on `claude/netlify-to-do-migration-vdfapd` for the full change). Netlify Functions became a single Express server (`server/index.js`), Netlify DB (Neon) became DO Managed PostgreSQL, and Netlify Forms became a real backend endpoint (`netlify/functions/submit-form.js`, sent via Resend). The `netlify/functions/*.js` files themselves are unchanged in shape — still `export default async (request) => Response` — just adapted to run under Express instead of Netlify's function runtime; `netlify/lib/db.js` swaps `@netlify/database` for a plain `pg.Pool`-backed tagged-template so every `db.sql\`...\`` call site needed zero changes.

- App Platform app: `<TBD — fill in App ID once created, see Part B of the migration runbook>`
- DO Managed PostgreSQL cluster: `<TBD — fill in cluster ID once created>`
- Production URL: `https://camboapp.com`
- Spec file: `.do/app.yaml` — one web service, build command `npm ci && npm run build`, run command `npm start` (→ `node server/index.js`), health check on `/`.
- **Deploy = git push to the branch App Platform tracks** (`deploy_on_push: true` in `.do/app.yaml`) — there's no decoupled manual-deploy command like Netlify's CLI had. This means, unlike the old Netlify workflow, a deploy now requires a push to the remote — so it falls under this file's "never push without being asked" rule (see House rules below), not the old "deploys are automatic" one. Confirm with the user before pushing to trigger a production deploy, or use `doctl apps create-deployment <app-id>` to redeploy the current remote HEAD without a new push.
- Run pending DB migrations before or after a deploy that adds one: `DATABASE_URL=<cluster connection string> npm run migrate` (wraps `scripts/migrate-db.mjs`, applies `netlify/database/migrations/*/migration.sql` in order, tracked in a `schema_migrations` table — DO doesn't auto-apply these the way Netlify DB did).
- Env var changes: set in the DO dashboard (App → Settings → App-Level Environment Variables) as `SECRET` type, matching the names in `.do/app.yaml`; redeploy for changes to take effect.
- View logs: `doctl apps logs <app-id> --type run --follow`.
- `netlify.toml` and `netlify/database/` are left in place for now (inert once nothing points at them) — remove them in a follow-up cleanup once DO has run stable in production for a while.
- **Troubleshooting "Internal server error" on register/login/Google sign-in**: confirmed live on 2026-08-29 that `https://camboapp.com/api/register` and `/api/login` both 500 with exactly `{"error":"Internal server error"}` while `/` still serves fine — this is `server/index.js`'s generic catch-all around every `/api/*` handler, and every DB-backed route (register, login, Google OAuth, captures, admin, billing) throws through it the same way whenever `netlify/lib/db.js`'s `getPool()` can't reach Postgres. Reproduced exactly locally by omitting `DATABASE_URL`. Root cause is DB connectivity, not the handler code (register/login/google-oauth-callback all verified correct against a real local Postgres). Check, in order: (1) `DATABASE_URL` is actually set in the DO dashboard's App-Level Environment Variables — `.do/app.yaml` only declares the key, the value is never committed and must be pasted in manually; (2) the DO Managed PostgreSQL cluster's "Trusted Sources" allows this app component; (3) `npm run migrate` has been run against that cluster's `DATABASE_URL` (DO doesn't auto-apply migrations). `server/index.js` now pings the DB once at boot and logs a loud, specific error to `doctl apps logs` if any of this is wrong, instead of only surfacing on a user's first login attempt.

## Stack

- Frontend: React + Vite + React Router (`src/`)
- Backend: Node ESM handlers in `netlify/functions/` (still Web Fetch API `Request`/`Response` shape), served by a single Express server (`server/index.js`) on DO App Platform; shared logic in `netlify/lib/`
- Database: DO Managed PostgreSQL via `pg` (`netlify/lib/db.js`); migrations in `netlify/database/migrations/<timestamp>_<name>/migration.sql`, applied with `npm run migrate`
- Auth: email/password (gated behind email verification — see below) + Google OAuth (OAuth client reused from warroomusa.com, exempt from verification since Google already verified that email)
- AI: `netlify/functions/analyze-question.js` calls the Anthropic SDK directly (`claude-opus-4-8`, structured JSON-schema output) — see "Question analysis model routing" below for why the earlier free-tier OpenRouter pool was dropped
- Payments: Stripe, live mode
- Transactional email: Resend (see "Email (Resend)" below)
- Marketing/support forms: backend endpoint + Resend (see "Forms" below)

## Design system

- **Homepage (`/`) and Pricing (`/pricing`) run a separate "newsprint zine" redesign as of 2026-08-30**, superseding the conservative blue/grey rebrand below **for those two routes only** — everything else (the 24 SEO campaign pages, `Sidebar`, auth pages, the app shell/camera UI, Account/History/Admin) is still on blue/grey. This is a deliberate, temporary two-theme state, not an oversight — don't "fix" the inconsistency by reskinning the rest of the site without asking, and don't reskin these two pages back to blue/grey without asking either.
  - Positioning pivot, intentional: copy moved from tutor-facing ("built for tutors") to a broader "anyone stuck in a required class/compliance module/gatekeeper test" audience — see hero ("This is not an app for cheating") and the "Who this is for" section in `Landing.jsx`. Confirmed with Savan 2026-08-30, not a scope-creep guess.
  - Origin: a Claude Design export (`Cambo Redesign.dc.html`) handed off via a separate design session — hand-drawn/organic, ink-on-paper. Implemented as real React rather than copying the export's internal `.dc.html` structure.
  - Fully isolated from the blue/grey system: new tokens + classes live in `src/styles/zine.css` (all `.zn-*`, imported only by `Landing.jsx`/`Pricing.jsx`), new header in `src/components/zine/ZineHeader.jsx` (not a `Sidebar` reskin — `Sidebar` still backs the SEO pages), new resources chips in `src/components/zine/ZineResources.jsx`. Fonts: Bricolage Grotesque (display) + Archivo (body), loaded per-page via `<Seo>`'s `children` (Helmet), not globally in `index.html`. Colors: ink `#141310`, paper `#f0ece1`, card `#e9e3d3`, accent (burnt clay) `#cf5f33`/`#e08a63`. Unlike the rest of the site, this design uses box-shadows deliberately (the hard-edged button/card offset-shadow look).
  - **Gotcha that bit this build**: `src/index.css` sets `h1, h2 { color: var(--text-h) }` globally. Since that's an explicit rule (not inheritance), it silently overrides any `.zn-*` heading's inherited paper/ink color regardless of that rule's low specificity — every `.zn-*` h1/h2 selector in `zine.css` sets `color` explicitly for this reason. Same root cause for links: the reset uses `:where(.zn-root) a { color: ... }` (zeroed specificity) specifically so it never outranks a real button class like `.zn-btn`/`.zn-nav-cta`. If you add a new heading or link style here, give it an explicit `color`, don't rely on inheritance.
  - Pricing page renders the real `PLANS` from `src/lib/plans.js` (not fabricated numbers) styled into the zine card grid, with the `featured` tier getting the dark/inverted treatment the mockup used for its single paid tier. **Pricing/packaging itself is being reworked separately** (new one-time "Cram/Prep/Unlimited" pass tiers, updated prices) in a financial model spreadsheet Savan is filling in — ask him for the current link if it's not in recent conversation history rather than assuming these are final. When that lands, update `PLANS` and this page follows automatically.
  - `PhoneMockup.jsx` was deleted — the old hero/how-it-works device-bezel mockup it backed is gone from both redesigned pages and nothing else referenced it.

- **Rebranded to a conservative blue/grey palette on white as of 2026-08-29** (was a dark lime/orange theme matching a Claude Design mockup export — see git history before this date for those values). Single light theme, no light/dark toggle — tokens in `src/index.css` `:root`. Key values: `--bg` `#FFFFFF`, `--card-bg` `#F5F7FA`, `--card-bg-2` `#EEF1F6`, `--text-h` `#16213A`, `--accent` (blue) `#2F5ED6`, `--accent2` (slate) `#64748B`. No box-shadows anywhere in the design (`--shadow` token removed, every decorative `box-shadow` set to `none`) — the only surviving `box-shadow` in `App.css` is the functional dim-outside-crop-rect trick on `.crop-rect`, which isn't a visual drop shadow. Font: Nunito (Google Fonts link in `index.html`). **As of 2026-08-30 this no longer applies to `/` or `/pricing` — see above.**
- The camera-scan screen (`.App.camera-mode` in `App.css`) and the hero/landing-page phone mockups' simulated "captured quiz screen" content stay intentionally dark, independent of the site's light theme — they're meant to look like a real device camera viewfinder / a photographed third-party quiz app, not Cambo's own UI chrome. Don't try to reskin these to match the light palette.
- Shared `Sidebar` (`src/components/Sidebar.jsx`): fixed 248px desktop left nav, collapses to a horizontal top bar on mobile via CSS only (no JS). Used by Landing, Pricing, and all 24 SEO campaign pages (via `LpHeader.jsx`). Auth-aware through an optional `user` prop — hydrated pages pass `useAuthContext().user`; the static campaign pages omit it and always render logged-out (no auth context there).
- Decorative rotated "shape" motif (solid-fill + outlined rounded squares in accent/accent2) sits behind the hero phone mockup and the footer CTA — see `.hero-shape*` / `.footer-cta-shape*` in `App.css`. Don't drop a solid-fill version of this behind body copy — it tanked text contrast once (the how-section steps list) and had to be walked back to icon-badges/removed.
- Why-cards use inline SVG icon badges (bolt/phone/target/keyboard/dollar), not an icon font or emoji — see `WHY_ICON_PATHS` in `Landing.jsx`. Emoji/icon-font glyphs are not guaranteed to render across environments; inline SVG is the safe default here.
- The 24 SEO landing pages (`src/landing-pages/`, built via `renderToStaticMarkup` — zero JS, no hydration) share the same CSS classes as `Landing.jsx`, so most visual changes cascade automatically. Still check each `Lp*.jsx` component individually for its own hardcoded styles — `LpHero.jsx` had a duplicated phone-mockup with hardcoded light-theme inline colors that the shared-class cascade didn't touch.
- `HardReloadFallback` (`src/components/HardReloadFallback.jsx`) is the router's catch-all `*` route in `App.jsx`. If the SPA shell ever loads for a URL it doesn't own (chiefly a static SEO page URL, e.g. right after a deploy before the new build is fully live), `<Routes>` would otherwise render nothing. This forces a real page navigation instead of a client render, which re-requests the URL and lets the host (Express's static file serving, on DO) serve the actual static file — self-healing. Guarded by `sessionStorage` against looping if the failure is persistent rather than transient.
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

## Forms

- Two forms: `question` (inline on the homepage, `#ask` section in `Landing.jsx`, for logged-out visitors) and `help` (Account page "Need help?" card, for logged-in users). Both submit via `src/lib/submitForm.js`'s `submitForm()` — a JSON POST to `/api/submit-form` (`netlify/functions/submit-form.js`), which emails the fields to `camboapp101@gmail.com` via Resend (`sendFormSubmission` in `netlify/lib/email.js`).
- Replaces the old Netlify Forms setup (a build-time HTML-crawler that captured a hidden `<form data-netlify>` pair in `index.html` and forwarded via a Netlify-dashboard notification rule) — DO has no equivalent mechanism, so this is now a real backend endpoint instead of infrastructure-level form capture.

## Business logic — plan tiers

`netlify/lib/plans.js` is the source of truth; `src/lib/plans.js` is a display-only mirror for the frontend (never import backend-only code into the client bundle).

| Plan | Price | Cap | Grace buffer | Beyond cap+grace |
|---|---|---|---|---|
| Free | $0 forever, no card | 5 captures/mo | — | hard block |
| Starter | $4.99/mo (`STRIPE_PRICE_STARTER`) | 45/mo | 5 | draw down credits, then block |
| Personal | $9.99/mo (`STRIPE_PRICE_PERSONAL`) | 90/mo | 10 | draw down credits, then block |
| Pro | $19.99/mo (`STRIPE_PRICE_PRO`) | 180/mo | 20 | draw down credits, then block |

No Team/Enterprise tier — Free/Starter/Personal/Pro is the whole ladder.

Cap + grace per paid tier is sized so worst-case per-capture cost (~$0.075 at `claude-opus-4-8` rates: large gallery image + hardest reasoning) never exceeds ~75% of the plan price — do the same math before changing any cap or price (see `netlify/lib/plans.js` comment for the derivation).

The legacy `STRIPE_PRICE_ID` (old $15/mo plan) is still honored in `stripe-webhook.js`'s price→plan mapping for existing subscribers, treated as Personal-tier caps — don't remove it.

**Add-on credits replace automatic overage billing.** Once a paid subscriber passes cap + grace, further captures debit `users.credit_balance` (1 credit = 1 capture) instead of triggering a Stripe invoice item. If the balance hits 0, captures are blocked (`analyze-question.js` → `isCapped`) until they buy more via `create-credit-checkout-session.js` (`STRIPE_PRICE_CREDIT_PACK`, `CREDIT_PACK_SIZE` = 100 credits / `CREDIT_PACK_PRICE_CENTS` = $15.00 — deliberately priced above the old $0.12/capture rate since credits are now the profit center). Credits roll over indefinitely while the user stays on a paid plan; `customer.subscription.deleted` resets `credit_balance` to 0 on downgrade to Free. Free-tier users cannot buy credits (`plan.creditsAllowed`). Purchases are recorded in `credit_purchases`, keyed on the Stripe checkout session id for webhook idempotency.

Cancellation (`customer.subscription.deleted`) drops a user back to `plan = 'free'` rather than cutting off access entirely.

Admin bootstrap: `savankong@gmail.com` is the (only) admin, promoted directly in the DB.

## Question analysis model routing

`analyze-question.js` calls Claude (`claude-opus-4-8`, structured JSON-schema output) directly for every capture — no fallback pool. **As of 2026-08-29 this replaced an earlier pool of 4 free-tier OpenRouter accounts** tried in order before falling back to Claude: the free slots proved unreliable in production (timeouts, 429s on shared free-tier quota, unparseable output) enough that the fallback was triggering on nearly every capture, so the pooling was dropped in favor of calling Claude every time. `OPENROUTER_API_KEY`/`_2`/`_3`/`_4` are no longer read anywhere in the codebase — safe to remove from the DO dashboard whenever convenient, not required for anything.

## Required env vars (DO App Platform dashboard — names only, never commit or print actual values)

`DATABASE_URL` (DO Managed PostgreSQL connection string — new as of the DO migration; Netlify DB used to inject this implicitly via `@netlify/database`, DO doesn't), `JWT_SECRET`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (legacy), `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PERSONAL`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_CREDIT_PACK`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY` (password-reset + email-verification + form-submission emails; sends from `noreply@camboapp.com`, domain verified in Resend via DNS records — see "Email (Resend)" above), `ANTHROPIC_API_KEY`. See `.do/app.yaml` for the exact list wired into the App Platform spec, and `.env.example` for local dev.

**`ANTHROPIC_API_KEY`** — read implicitly by the `@anthropic-ai/sdk` default constructor (`new Anthropic()` in `netlify/functions/analyze-question.js:8`, the SDK's standard `process.env.ANTHROPIC_API_KEY` convention). Called on every capture — required, since there's no fallback if it's missing or invalid.

**`APP_SESSION_SECRET`** — confirmed dead/unused as of 2026-07-29 (`grep -rn "APP_SESSION_SECRET" netlify/ src/` returns zero hits); not required, not carried into `.do/app.yaml`.

## Verification patterns that work here

- Local Postgres for a real DB round-trip: `service postgresql start` (or point `DATABASE_URL` at a scratch DO/Neon database), `npm run migrate`, then drive `node server/index.js` directly with `curl`/browser automation against `/api/*` — no more "no direct DB access," this environment can run the real schema locally.
- Camera-dependent UI in a sandboxed browser: monkey-patch `navigator.mediaDevices.getUserMedia` to return a `canvas.captureStream(fps)` synthetic feed. Drives the real app code path, including real Claude calls, with no physical camera.
- Billing-sensitive changes: seed test data + isolated Stripe **test-mode** API calls. Never complete a real Checkout with a real card for testing — creating live Stripe Products/Prices or completing a real payment needs explicit confirmation of the exact numbers first, every time.
- Run `node --check` on every modified file under `netlify/functions/`, `netlify/lib/`, and `server/` before deploying — a syntax error here has broken a deploy before.
- For UI changes, actually drive the feature in the Browser pane (not just build/lint) before calling it done.

## House rules

- **Deploying now means pushing to the remote** (App Platform deploys on push — see "Hosting" above), which is different from the old Netlify-CLI workflow where a local `netlify deploy --prod` could ship a build without touching git. So confirm with the user before a deploy-triggering push, same as any other remote push/PR — this supersedes the old "deploys are automatic" framing. Still verify everything locally first (build passes, `node --check` on modified functions/server files, UI driven in the Browser pane where applicable) so the push you do make is a good one. Creating/editing live Stripe Products or Prices still needs explicit confirmation of exact numbers every time.
- Never enter real payment/financial credentials anywhere, and never complete a real money transaction.
- When something is ambiguous or costly to get wrong (pricing, tier structure, copy), ask before building. If there's no immediate answer, state the assumption clearly and proceed rather than blocking.
