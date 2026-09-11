#!/usr/bin/env node
// Guardrail 2/6 — regex blocklist over landing/hub page copy, meta text,
// and OG text. Phrases sourced verbatim from the Cambo Instagram Plan /
// brand guide (wiki "Automation Plan — Cambo Autopilot", System 01).
//
// Scoped to content/landing-pages and content/school-hubs JSON only — not
// the site's own JSX chrome (src/pages, src/landing-pages/components).
// The plan's own doc calls the live "Still not an app for cheating"
// footer/hero framing (src/pages/Landing.jsx and 4 other pages, the
// 2026-08-30 positioning pivot) a phrase that "has to go," but Savan's
// call on 2026-09-11 was the opposite: what's already in production is
// the accepted baseline, not a violation to retroactively flag. Rewriting
// the site's primary headline is a brand judgment call — the plan's own
// "What stays human" section says exactly that stays off-limits to
// automate — so this check doesn't touch shipped site chrome at all. It
// still guards the actual risk surface going forward: the hundreds of
// future page-forge-generated landing/hub pages, where nothing like this
// phrase exists yet and none should ship.
//
// Checked only on Cambo's own marketing-copy fields
// (h1/subhead/metaTitle/metaDescription/whyItWorks), not faqs/sampleQuestions
// — those legitimately describe the real exam's real logistics (e.g. a
// food-handler FAQ correctly saying the real test is "non-proctored" isn't
// a banned claim; a bare "proctored"/"live exam" match there is a false
// positive, confirmed against content/landing-pages/epa-608-practice-test.json
// and food-handler-card-practice-test.json during backfill testing).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllContent } from './lib/content-sources.mjs';

const BANNED_PHRASES = [
  'cheat',
  'answers to your exam',
  'beat mylab',
  'pass without studying',
  'guaranteed pass',
  'during your test',
  'proctored',
  'live exam',
  'undetectable',
  'app for cheating',
];

const bannedRegex = new RegExp(BANNED_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const CONTENT_COPY_FIELDS = ['h1', 'subhead', 'metaTitle', 'metaDescription', 'whyItWorks'];

const failures = [];

for (const { relPath, content } of loadAllContent(rootDir)) {
  for (const field of CONTENT_COPY_FIELDS) {
    const value = content[field];
    if (typeof value === 'string' && bannedRegex.test(value)) {
      failures.push(`${relPath} — field "${field}": ${JSON.stringify(value)}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`check-banned-claims: FAIL — ${failures.length} banned-phrase match(es):\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log('check-banned-claims: ok');
