# Cambo App

Tutor camera app — snap a photo of any quiz/practice-test/worksheet question, Claude grades it and explains the answer. React + Vite SPA with Netlify Functions backend, Postgres (Netlify DB/Neon), Stripe billing, Google + email/password auth, Resend transactional email, and Netlify Forms.

Production: https://camboapp.com

**Full project context lives in [CLAUDE.md](./CLAUDE.md)** — stack, auth, billing, forms, env vars, deploy commands, known gotchas. Start there for anything beyond local dev setup below.

## Local dev

```
npm install
npm run dev
```

## Build

```
npm run build
```

Builds the SPA, SSR entry, prerenders the public marketing routes, generates OG images, and generates the sitemap — see `package.json` scripts and `scripts/*.mjs`.
