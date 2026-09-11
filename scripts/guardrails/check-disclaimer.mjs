#!/usr/bin/env node
// Guardrail 1/6 — every landing/hub page must carry the "independent study
// tool, not affiliated" disclaimer. See wiki "Automation Plan — Cambo
// Autopilot", System 01. This is the one line of copy with real legal
// exposure if it's missing (a publisher or school reading a page as
// implying endorsement), so it's a hard fail, not a warning.
//
// Checked against the literal phrase already used identically across all
// 105 existing pages (content/landing-pages/*.json, content/school-hubs/*.json)
// rather than a looser "mentions affiliation" regex — a page shouldn't be
// able to satisfy this with a weaker disclaimer a human reviewer wouldn't
// have accepted either.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllContent } from './lib/content-sources.mjs';

const DISCLAIMER_PHRASE = /independent study tool/i;

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rows = loadAllContent(rootDir);

const failures = [];
for (const { relPath, content } of rows) {
  const faqs = Array.isArray(content.faqs) ? content.faqs : [];
  const hasDisclaimer = faqs.some((faq) => typeof faq?.a === 'string' && DISCLAIMER_PHRASE.test(faq.a));
  if (!hasDisclaimer) failures.push(relPath);
}

if (failures.length > 0) {
  console.error(`check-disclaimer: FAIL — ${failures.length} page(s) missing the "independent study tool" disclaimer FAQ:\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`check-disclaimer: ok (${rows.length} pages checked)`);
