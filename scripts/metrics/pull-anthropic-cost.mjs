// Pulls yesterday's (UTC) real Anthropic spend via the Cost Report API
// (raw HTTP — this endpoint isn't in the @anthropic-ai/sdk) and divides it
// by that day's capture count (from our own DB) to get a real
// cost-per-capture figure, replacing check-margin.mjs's documented
// ~$0.075/capture estimate with an actual measurement. See
// https://platform.claude.com/docs/en/manage-claude/usage-cost-api and
// https://platform.claude.com/docs/en/api/admin-api/usage-cost/get-cost-report
// (fetched and read directly — this shape IS verified against Anthropic's
// current docs, unlike the Plausible/Stripe pulls in this same directory).
//
// REQUIRES an Admin API key (`sk-ant-admin...`) in ANTHROPIC_ADMIN_KEY —
// deliberately not ANTHROPIC_API_KEY, which is the regular key
// analyze-question.js uses for actual captures and which the cost/usage
// endpoints reject outright. Admin keys are created in the Claude Console
// by an organization admin (Settings -> Organization -> Admin API Keys).
import { connectDb } from './lib/db.mjs';

const COST_REPORT_URL = 'https://api.anthropic.com/v1/organizations/cost_report';

async function fetchDailyCostUsd(dateStr, adminKey) {
  const startingAt = `${dateStr}T00:00:00Z`;
  const endingAt = new Date(new Date(startingAt).getTime() + 86400000).toISOString();

  const url = new URL(COST_REPORT_URL);
  url.searchParams.set('starting_at', startingAt);
  url.searchParams.set('ending_at', endingAt);
  url.searchParams.set('limit', '1');

  const res = await fetch(url, {
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': adminKey,
    },
  });
  if (!res.ok) {
    throw new Error(`Anthropic cost_report failed (${res.status}): ${await res.text()}`);
  }
  const body = await res.json();

  // amount is a decimal string in the lowest currency unit (cents); sum
  // every result across every bucket returned (there should be exactly one
  // 1-day bucket given the range above, but don't assume it).
  let totalCents = 0;
  for (const bucket of body.data ?? []) {
    for (const result of bucket.results ?? []) {
      totalCents += Number(result.amount);
    }
  }
  return totalCents / 100;
}

export async function pullAnthropicCostDay(dateStr, adminKey = process.env.ANTHROPIC_ADMIN_KEY) {
  if (!adminKey) throw new Error('ANTHROPIC_ADMIN_KEY is not set.');

  const costUsd = await fetchDailyCostUsd(dateStr, adminKey);

  const db = await connectDb();
  let capturesCount;
  try {
    const start = new Date(`${dateStr}T00:00:00Z`);
    const end = new Date(start.getTime() + 86400000);
    const { rows } = await db.query('SELECT count(*)::int AS count FROM captures WHERE created_at >= $1 AND created_at < $2', [start, end]);
    capturesCount = rows[0].count;
  } finally {
    await db.end();
  }

  return {
    costUsd,
    capturesCount,
    costPerCaptureUsd: capturesCount > 0 ? costUsd / capturesCount : null,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const date = process.argv[2] ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  pullAnthropicCostDay(date)
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
