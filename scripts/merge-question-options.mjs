// One-off authoring helper: merges multiple-choice options into the campaign
// page content files. Reads a JSON payload of
//   { "<slug>": [ { "options": [...4 strings], "correct": <index> }, ... ] }
// and splices each entry into the matching sampleQuestions[i], keeping key
// order q → options → correct → a so the content files stay readable.
//
// Safe to re-run: entries already carrying options are overwritten, and any
// slug/index that doesn't line up is reported instead of silently skipped.
import fs from 'node:fs';
import path from 'node:path';

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error('usage: node scripts/merge-question-options.mjs <payload.json>');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const dir = 'content/landing-pages';
let touched = 0;
const problems = [];

for (const [slug, entries] of Object.entries(payload)) {
  const file = path.join(dir, `${slug}.json`);
  if (!fs.existsSync(file)) {
    problems.push(`${slug}: no such content file`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (entries.length !== data.sampleQuestions.length) {
    problems.push(
      `${slug}: ${entries.length} option sets for ${data.sampleQuestions.length} questions`,
    );
    continue;
  }

  data.sampleQuestions = data.sampleQuestions.map((sq, i) => {
    const { options, correct } = entries[i];
    if (!Array.isArray(options) || options.length !== 4) {
      problems.push(`${slug}[${i}]: expected 4 options, got ${options?.length}`);
      return sq;
    }
    if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
      problems.push(`${slug}[${i}]: correct index out of range (${correct})`);
      return sq;
    }
    return { q: sq.q, options, correct, a: sq.a };
  });

  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  touched += 1;
}

if (problems.length) {
  console.error('PROBLEMS:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`merged options into ${touched} file(s)`);
