// Pulls yesterday's (UTC) Plausible Stats API v2 data: visitors by entry
// page, goal conversions (Signup, the six Purchase: <tier> goals, the
// Purchase catch-all, Form: Submission), and the CTA Click event broken
// down by its `slug` custom property. See wiki "Automation Plan — Cambo
// Autopilot", System 02, and CLAUDE.md's "Analytics (Plausible)" section
// for what these goals/properties are and why they exist.
//
// REQUIRES a Plausible Business plan (the Stats API is gated to it) and
// PLAUSIBLE_API_KEY (Settings -> API Keys in the Plausible dashboard).
//
// NOT VERIFIED against a live Plausible account or the real API response
// shape — this sandbox's network egress to plausible.io is blocked, so
// this was written from Plausible's public Stats API v2 documentation
// (https://plausible.io/docs/stats-api) rather than a tested round-trip.
// Run this once by hand against the real site (`node scripts/metrics/pull-plausible.mjs`)
// and diff the output against the Plausible dashboard before trusting the
// nightly cron with it — a wrong dimension/filter name here would fail
// loudly (a 4xx from Plausible), but a subtly wrong response-field
// assumption could silently mis-count.
const PLAUSIBLE_API_URL = 'https://plausible.io/api/v2/query';
const SITE_ID = process.env.PLAUSIBLE_SITE_ID || 'camboapp.com';

const PURCHASE_GOALS = [
  'Purchase',
  'Purchase: Starter',
  'Purchase: Personal',
  'Purchase: Pro',
  'Purchase: 24-Hour Cram Pass',
  'Purchase: 7-Day Prep Pass',
  'Purchase: 30-Day Unlimited Pass',
];
const GOALS = ['Signup', 'Form: Submission', ...PURCHASE_GOALS];

async function runQuery(apiKey, body) {
  const res = await fetch(PLAUSIBLE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Plausible query failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// dateStr: 'YYYY-MM-DD', queried as a single-day range.
export async function pullPlausibleDay(dateStr, apiKey = process.env.PLAUSIBLE_API_KEY) {
  if (!apiKey) throw new Error('PLAUSIBLE_API_KEY is not set.');

  const dateRange = [dateStr, dateStr];

  const [entryPages, goals, ctaClicksBySlug] = await Promise.all([
    runQuery(apiKey, {
      site_id: SITE_ID,
      metrics: ['visitors'],
      date_range: dateRange,
      dimensions: ['visit:entry_page'],
    }),
    runQuery(apiKey, {
      site_id: SITE_ID,
      metrics: ['visitors'],
      date_range: dateRange,
      dimensions: ['event:goal'],
      filters: [['is', 'event:goal', GOALS]],
    }),
    runQuery(apiKey, {
      site_id: SITE_ID,
      metrics: ['events'],
      date_range: dateRange,
      dimensions: ['event:props:slug'],
      filters: [['is', 'event:name', ['CTA Click']]],
    }),
  ]);

  return {
    entryPages: (entryPages.results ?? []).map((r) => ({ path: r.dimensions[0], visitors: r.metrics[0] })),
    goals: (goals.results ?? []).map((r) => ({ goal: r.dimensions[0], conversions: r.metrics[0] })),
    ctaClicksBySlug: (ctaClicksBySlug.results ?? []).map((r) => ({ slug: r.dimensions[0], clicks: r.metrics[0] })),
    totalVisitors: (entryPages.results ?? []).reduce((sum, r) => sum + (r.metrics[0] ?? 0), 0),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const date = process.argv[2] ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  pullPlausibleDay(date)
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
