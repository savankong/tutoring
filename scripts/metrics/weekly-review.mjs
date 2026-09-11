#!/usr/bin/env node
// Monday "Decide" + "Act" job (System 02 of the Cambo Autopilot plan):
// reads the last 8 weeks of data/metrics/*.json, asks Claude to turn that
// into a written analysis (which entry pages convert, actual vs. the
// financial-model targets, margin drift, anomalies) plus a short list of
// candidate next pages, writes the analysis to a file for
// .github/workflows/metrics-review.yml to open as a GitHub Issue, and
// appends the candidate pages straight into content/topic-queue.json (the
// workflow commits that on a branch and opens a PR — this script never
// pushes or opens anything itself, it only edits the working tree).
//
// Usage: node scripts/metrics/weekly-review.mjs --issue-out <path>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { loadAllContent } from '../guardrails/lib/content-sources.mjs';
import { MONTHLY_TARGETS, WEEKLY_TARGETS } from './targets.mjs';

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const metricsDir = join(rootDir, 'data', 'metrics');
const topicQueuePath = join(rootDir, 'content', 'topic-queue.json');

const WEEKS_OF_HISTORY = 8;

function loadRecentWeeks() {
  if (!readdirSync(rootDir).includes('data')) return [];
  const files = readdirSync(metricsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .slice(-WEEKS_OF_HISTORY);
  return files.map((f) => JSON.parse(readFileSync(join(metricsDir, f), 'utf-8')));
}

// Deterministic aggregation in plain JS — Claude gets these numbers as
// facts to narrate and reason over, not asked to re-derive arithmetic from
// raw daily rows (cheaper, and removes a class of "the model added wrong"
// mistakes from the output).
function aggregate(weeks) {
  const days = weeks.flatMap((w) => Object.entries(w.days ?? {}).map(([date, d]) => ({ date, ...d })));

  const entryPageVisitors = new Map();
  let totalVisitors = 0;
  const goalTotals = new Map();
  let totalCostUsd = 0;
  let totalCaptures = 0;
  let mrrSamples = [];
  const anomalies = [];

  for (const day of days) {
    if (day.plausible?.error) {
      anomalies.push(`${day.date}: Plausible pull failed — ${day.plausible.error}`);
    } else if (day.plausible) {
      totalVisitors += day.plausible.totalVisitors ?? 0;
      for (const { path, visitors } of day.plausible.entryPages ?? []) {
        entryPageVisitors.set(path, (entryPageVisitors.get(path) ?? 0) + visitors);
      }
      for (const { goal, conversions } of day.plausible.goals ?? []) {
        goalTotals.set(goal, (goalTotals.get(goal) ?? 0) + conversions);
      }
    }

    if (day.stripe?.error) {
      anomalies.push(`${day.date}: Stripe pull failed — ${day.stripe.error}`);
    } else if (day.stripe) {
      mrrSamples.push({ date: day.date, mrrUsd: day.stripe.mrrUsd });
      totalCaptures += day.stripe.capturesCount ?? 0;
      if (day.stripe.failedPaymentsCount > 0) {
        anomalies.push(`${day.date}: ${day.stripe.failedPaymentsCount} failed payment(s)`);
      }
    }

    if (day.anthropicCost?.error) {
      anomalies.push(`${day.date}: Anthropic cost pull failed — ${day.anthropicCost.error}`);
    } else if (day.anthropicCost) {
      totalCostUsd += day.anthropicCost.costUsd ?? 0;
    }
  }

  const topEntryPages = [...entryPageVisitors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const bottomEntryPages = [...entryPageVisitors.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 10);
  const latestMrr = mrrSamples.at(-1)?.mrrUsd ?? null;
  const realCostPerCapture = totalCaptures > 0 ? totalCostUsd / totalCaptures : null;

  return {
    daysCovered: days.length,
    totalVisitors,
    goalTotals: Object.fromEntries(goalTotals),
    topEntryPages,
    bottomEntryPages,
    latestMrr,
    totalCaptures,
    totalCostUsd,
    realCostPerCapture,
    anomalies,
  };
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    issueBody: {
      type: 'string',
      description: 'A GitHub issue body in Markdown: which entry pages convert vs. don\'t, actual vs. target pacing, margin/cost drift, anomalies worth a look. Written for Savan to read in under 2 minutes.',
    },
    queueAdditions: {
      type: 'array',
      description: '3-5 candidate next pages, each a plausible sibling of a page that is actually converting (same vertical/audience, a different specific exam/course/cert) — not guesses at brand-new verticals.',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'kebab-case URL slug, following the naming pattern of existing pages in the same vertical' },
          vertical: { type: 'string' },
          sourceUrl: { type: 'string', description: 'Best-guess official source URL — a starting point for page forge to verify, not a verified fact.' },
          riskClass: { type: 'string', enum: ['low', 'high'], description: '"low" only for a proven vertical this codebase already has multiple pages in; "high" for anything else (new vertical, publisher, school/institution).' },
          reason: { type: 'string' },
        },
        required: ['slug', 'vertical', 'sourceUrl', 'riskClass', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['issueBody', 'queueAdditions'],
  additionalProperties: false,
};

async function runAnalysis(facts, existingSlugs) {
  const client = new Anthropic();
  const prompt = `You are the weekly growth-metrics analyst for Cambo, an AI camera-capture study tool. Here is the last ${facts.daysCovered} days of real, already-computed metrics (do not re-derive arithmetic, just reason over these numbers):

${JSON.stringify(facts, null, 2)}

Monthly targets from the financial model (the sheet behind the "$20K/mo Plan" — treat as ground truth, don't second-guess the numbers themselves): ${JSON.stringify(MONTHLY_TARGETS)}
This week's pro-rated share of those targets: ${JSON.stringify(WEEKLY_TARGETS)}

Existing landing/hub page slugs already live (don't suggest duplicates of these): ${JSON.stringify(existingSlugs)}

Write the GitHub issue body and the queue-addition suggestions per the schema. Be specific and numeric in the issue body — name actual entry pages and actual numbers, don't write generic filler. If a metric pull failed on some days (see "anomalies"), say so plainly rather than silently working around the gap.`;

  const response = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 8000,
    output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text block in Claude response.');
  return JSON.parse(textBlock.text);
}

async function main() {
  const issueOutIdx = process.argv.indexOf('--issue-out');
  const issueOutPath = issueOutIdx !== -1 ? process.argv[issueOutIdx + 1] : join(rootDir, 'weekly-review-issue.md');

  const weeks = loadRecentWeeks();
  if (weeks.length === 0) {
    writeFileSync(issueOutPath, '## Weekly metrics review\n\nNo data/metrics/*.json files exist yet — metrics-pull.yml needs to have run at least once before this review has anything to analyze.\n');
    console.log('No metrics data yet; wrote a placeholder issue body.');
    return;
  }

  const facts = aggregate(weeks);
  const existingSlugs = loadAllContent(rootDir).map((r) => r.content.slug);

  const { issueBody, queueAdditions } = await runAnalysis(facts, existingSlugs);

  writeFileSync(issueOutPath, issueBody);
  console.log(`Wrote issue body to ${issueOutPath}`);

  const topicQueue = JSON.parse(readFileSync(topicQueuePath, 'utf-8'));
  const existingQueueSlugs = new Set(topicQueue.queue.map((e) => e.slug));
  const now = new Date().toISOString();
  let added = 0;
  for (const suggestion of queueAdditions) {
    if (existingSlugs.includes(suggestion.slug) || existingQueueSlugs.has(suggestion.slug)) continue; // already live or already queued
    topicQueue.queue.push({ ...suggestion, addedAt: now, addedBy: 'weekly-review' });
    added += 1;
  }
  writeFileSync(topicQueuePath, JSON.stringify(topicQueue, null, 2) + '\n');
  console.log(`Appended ${added} new entr${added === 1 ? 'y' : 'ies'} to content/topic-queue.json.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
