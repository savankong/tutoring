#!/usr/bin/env node
// Guardrail 3/6 — shingle similarity against every other existing page.
// This is what stops the ~400-page state-by-state expansion (see wiki
// "Automation Plan — Cambo Autopilot", System 03) from reading to Google
// as a doorway farm: fifty pages that only ever swap one state name are
// exactly the shape this is meant to catch before they ship.
//
// Method: normalize each page's prose (h1 + subhead + whyItWorks + FAQ
// answers) to lowercase word tokens, build the set of contiguous 8-word
// shingles, and compare every pair with Jaccard similarity
// (|intersection| / |union|). Above the threshold, the pair fails —
// legitimately near-identical content (a proven template applied to a new
// state) is exactly the case that's supposed to force a human look before
// it ships, not slip through as "expected."
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllContent } from './lib/content-sources.mjs';

const SHINGLE_SIZE = 8;
const SIMILARITY_THRESHOLD = 0.9;

function pageText(content) {
  const parts = [content.h1, content.subhead, content.whyItWorks, ...(content.faqs ?? []).map((f) => f.a)];
  return parts.filter((p) => typeof p === 'string').join(' ');
}

function shingles(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set();
  for (let i = 0; i + SHINGLE_SIZE <= words.length; i++) {
    set.add(words.slice(i, i + SHINGLE_SIZE).join(' '));
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const shingle of small) {
    if (large.has(shingle)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rows = loadAllContent(rootDir).map((row) => ({ ...row, shingles: shingles(pageText(row.content)) }));

const failures = [];
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const similarity = jaccard(rows[i].shingles, rows[j].shingles);
    if (similarity >= SIMILARITY_THRESHOLD) {
      failures.push(`${rows[i].relPath} <-> ${rows[j].relPath}: ${(similarity * 100).toFixed(1)}% similar`);
    }
  }
}

if (failures.length > 0) {
  console.error(`check-duplicate: FAIL — ${failures.length} page pair(s) at or above ${SIMILARITY_THRESHOLD * 100}% shingle similarity:\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`check-duplicate: ok (${rows.length} pages compared)`);
