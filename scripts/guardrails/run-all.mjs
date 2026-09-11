#!/usr/bin/env node
// Runs all six System 01 guardrail checks and reports a single pass/fail.
// Used by `npm run guardrails` locally and by .github/workflows/guard.yml
// on every PR — see wiki "Automation Plan — Cambo Autopilot".
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const guardrailsDir = join(rootDir, 'scripts', 'guardrails');

const checks = [
  { name: 'check-disclaimer', script: join(guardrailsDir, 'check-disclaimer.mjs') },
  { name: 'check-banned-claims', script: join(guardrailsDir, 'check-banned-claims.mjs') },
  { name: 'check-duplicate', script: join(guardrailsDir, 'check-duplicate.mjs') },
  { name: 'check-schema', script: join(guardrailsDir, 'check-schema.mjs') },
  { name: 'check-margin', script: join(guardrailsDir, 'check-margin.mjs') },
  { name: 'catalog:check --strict', script: join(rootDir, 'scripts', 'check-course-catalog-freshness.mjs'), args: ['--strict'] },
];

let failed = false;
for (const { name, script, args = [] } of checks) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

console.log(`\n${failed ? 'GUARDRAILS FAILED' : 'guardrails: all checks passed'}`);
process.exit(failed ? 1 : 0);
