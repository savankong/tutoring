import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Reports how stale content/course-catalog.json's per-school course-code
// data is. Course numbers drift as schools renumber every academic year, so
// each school row carries its own verifiedAt date rather than trusting the
// file's git history — see the "Course Catalog Freshness Check" scheduled
// Routine (content/course-catalog.json's meta.verificationCadence) for what
// actually keeps this current.
//
// Usage: node scripts/check-course-catalog-freshness.mjs
// Exit code is always 0 (informational) — this isn't a CI gate, just a report.

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(readFileSync(join(rootDir, 'content', 'course-catalog.json'), 'utf-8'));

const staleAfterMonths = catalog.meta?.staleAfterMonths ?? 13;
const now = new Date();

function monthsSince(dateStr) {
  const then = new Date(dateStr);
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth()) - (now.getDate() < then.getDate() ? 1 : 0);
}

console.log(`Course catalog freshness check — run ${now.toISOString().slice(0, 10)}`);
console.log(`Stale threshold: ${staleAfterMonths} months since last verification\n`);

let staleCount = 0;
const rows = catalog.schools
  .map((school) => {
    const months = monthsSince(school.verifiedAt);
    const stale = months >= staleAfterMonths;
    if (stale) staleCount += 1;
    return { school, months, stale };
  })
  .sort((a, b) => b.months - a.months);

for (const { school, months, stale } of rows) {
  const flag = stale ? 'STALE' : 'ok';
  console.log(`  [${flag.padEnd(5)}] ${school.name.padEnd(32)} verified ${school.verifiedAt} (${months} mo ago)`);
}

console.log(`\n${staleCount} of ${catalog.schools.length} schools need re-verification.`);
if (staleCount > 0) {
  console.log('Re-verify against each stale school\'s catalogUrl (see content/course-catalog.json), update codes/titles that changed, and bump verifiedAt.');
}
