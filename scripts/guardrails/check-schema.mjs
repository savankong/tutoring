#!/usr/bin/env node
// Guardrail 4/6 — structural integrity: required fields, slug uniqueness,
// filename/slug agreement, cross-links resolve, and the shape each page's
// JSON-LD (LpFaq.jsx's faqSchema, HubHead.jsx's itemListSchema) actually
// gets built from is valid. Sitemap inclusion isn't checked separately —
// scripts/generate-sitemap.mjs derives routes straight from these same
// directories, so a page that loads and has a slug is in the sitemap by
// construction; what it can't survive is a bad slug or a JSON parse error,
// both already fatal here.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllContent } from './lib/content-sources.mjs';

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rows = loadAllContent(rootDir);
const failures = [];

const fail = (relPath, msg) => failures.push(`${relPath}: ${msg}`);

const LANDING_REQUIRED_STRINGS = ['slug', 'h1', 'subhead', 'metaTitle', 'metaDescription', 'whyItWorks'];
const HUB_REQUIRED_STRINGS = ['slug', 'schoolKey', 'h1', 'subhead', 'metaTitle', 'metaDescription'];

const catalog = JSON.parse(readFileSync(join(rootDir, 'content', 'course-catalog.json'), 'utf-8'));
const schoolKeys = new Set(catalog.schools.map((s) => s.key));

const slugOwners = new Map(); // slug -> [relPath, ...]
for (const { relPath, content } of rows) {
  if (typeof content.slug === 'string') {
    const owners = slugOwners.get(content.slug) ?? [];
    owners.push(relPath);
    slugOwners.set(content.slug, owners);
  }
}

function checkFaqs(relPath, content) {
  if (!Array.isArray(content.faqs) || content.faqs.length === 0) {
    fail(relPath, 'faqs must be a non-empty array (required for FAQPage JSON-LD)');
    return;
  }
  content.faqs.forEach((faq, i) => {
    if (typeof faq?.q !== 'string' || faq.q.trim() === '') fail(relPath, `faqs[${i}].q must be a non-empty string`);
    if (typeof faq?.a !== 'string' || faq.a.trim() === '') fail(relPath, `faqs[${i}].a must be a non-empty string`);
  });
}

function checkInternalLinks(relPath, content, allSlugs) {
  if (content.internalLinks === undefined) return;
  if (!Array.isArray(content.internalLinks)) {
    fail(relPath, 'internalLinks must be an array when present');
    return;
  }
  content.internalLinks.forEach((link, i) => {
    if (typeof link !== 'string' || !allSlugs.has(link)) {
      fail(relPath, `internalLinks[${i}] "${link}" does not resolve to any existing page slug`);
    }
  });
}

const allSlugs = new Set(rows.map((r) => r.content.slug).filter((s) => typeof s === 'string'));

for (const { file, dir, relPath, content } of rows) {
  const expectedSlug = file.replace(/\.json$/, '');
  if (content.slug !== expectedSlug) {
    fail(relPath, `slug "${content.slug}" does not match filename (expected "${expectedSlug}")`);
  }

  const owners = slugOwners.get(content.slug) ?? [];
  if (owners.length > 1) {
    fail(relPath, `slug "${content.slug}" is also used by ${owners.filter((o) => o !== relPath).join(', ')}`);
  }

  const requiredStrings = dir === 'landing-pages' ? LANDING_REQUIRED_STRINGS : HUB_REQUIRED_STRINGS;
  for (const field of requiredStrings) {
    if (typeof content[field] !== 'string' || content[field].trim() === '') {
      fail(relPath, `"${field}" must be a non-empty string`);
    }
  }

  checkFaqs(relPath, content);
  checkInternalLinks(relPath, content, allSlugs);

  if (dir === 'landing-pages') {
    if (!Array.isArray(content.sampleQuestions) || content.sampleQuestions.length === 0) {
      fail(relPath, 'sampleQuestions must be a non-empty array');
    } else {
      content.sampleQuestions.forEach((sq, i) => {
        if (typeof sq?.q !== 'string' || sq.q.trim() === '') fail(relPath, `sampleQuestions[${i}].q must be a non-empty string`);
        if (!Array.isArray(sq?.options) || sq.options.length < 2) fail(relPath, `sampleQuestions[${i}].options must have at least 2 entries`);
        if (!Number.isInteger(sq?.correct) || sq.correct < 0 || sq.correct >= (sq?.options?.length ?? 0)) {
          fail(relPath, `sampleQuestions[${i}].correct must be a valid index into options`);
        }
        if (typeof sq?.a !== 'string' || sq.a.trim() === '') fail(relPath, `sampleQuestions[${i}].a must be a non-empty string`);
      });
    }
    if (content.officialSource !== undefined) {
      if (typeof content.officialSource?.label !== 'string' || typeof content.officialSource?.url !== 'string') {
        fail(relPath, 'officialSource, when present, must have string "label" and "url"');
      }
    }
  }

  if (dir === 'school-hubs') {
    if (!schoolKeys.has(content.schoolKey)) {
      fail(relPath, `schoolKey "${content.schoolKey}" is not in content/course-catalog.json`);
    }
  }
}

if (failures.length > 0) {
  console.error(`check-schema: FAIL — ${failures.length} issue(s):\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`check-schema: ok (${rows.length} pages checked)`);
