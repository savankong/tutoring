#!/usr/bin/env node
// Nightly orchestrator (System 02 of the Cambo Autopilot plan): pulls
// yesterday's Plausible, Stripe/DB, and Anthropic-cost figures and upserts
// them into data/metrics/<ISO-week>.json, one file per week, one entry per
// day. Run by .github/workflows/metrics-pull.yml at 08:00 UTC daily; the
// workflow commits whatever this writes.
//
// Any single pull failing doesn't block the other two — a Plausible outage
// shouldn't mean losing the day's Stripe/cost numbers too. Missing sections
// are recorded as `{ error: "..." }` rather than silently omitted, so a gap
// in the week's data is visible in the file itself, not just in a build log
// nobody reads a week later.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pullPlausibleDay } from './pull-plausible.mjs';
import { pullStripeDay } from './pull-stripe.mjs';
import { pullAnthropicCostDay } from './pull-anthropic-cost.mjs';
import { isoWeekOf, weekFileName } from './lib/iso-week.mjs';

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const metricsDir = join(rootDir, 'data', 'metrics');

async function settle(label, promise) {
  try {
    return await promise;
  } catch (err) {
    console.error(`[${label}] failed: ${err.message}`);
    return { error: err.message };
  }
}

async function main() {
  const dateStr = process.argv[2] ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  console.log(`Pulling metrics for ${dateStr}...`);

  const [plausible, stripe, anthropicCost] = await Promise.all([
    settle('plausible', pullPlausibleDay(dateStr)),
    settle('stripe', pullStripeDay(dateStr)),
    settle('anthropic-cost', pullAnthropicCostDay(dateStr)),
  ]);

  const { year, week } = isoWeekOf(new Date(`${dateStr}T00:00:00Z`));
  const fileName = weekFileName({ year, week });
  const filePath = join(metricsDir, fileName);

  mkdirSync(metricsDir, { recursive: true });
  const weekFile = existsSync(filePath) ? JSON.parse(readFileSync(filePath, 'utf-8')) : { isoYear: year, isoWeek: week, days: {} };

  weekFile.days[dateStr] = { plausible, stripe, anthropicCost, pulledAt: new Date().toISOString() };

  writeFileSync(filePath, JSON.stringify(weekFile, null, 2) + '\n');
  console.log(`Wrote ${fileName} (day ${dateStr}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
