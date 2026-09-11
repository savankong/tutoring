#!/usr/bin/env node
// Guardrail 5/6 — margin floor check. The whole pricing model rests on
// worst-case cost-per-capture staying at ~75% of a paid plan's cap-alone
// price (see netlify/lib/plans.js's derivation comment); nothing currently
// re-verifies that after a price or cap edit, or after Anthropic changes
// model pricing.
//
// Anthropic doesn't publish a queryable pricing API, so "live Anthropic
// pricing" here means the same worst-case-per-capture estimate this
// codebase already documents (~$0.075/capture at claude-opus-4-8 rates:
// a large gallery image plus the hardest reasoning path) — not a live
// fetch. Override ANTHROPIC_COST_PER_CAPTURE_USD when Anthropic's actual
// pricing changes enough to move that estimate; this check is only honest
// as its input is kept current.
import { PLANS, PLAN_ORDER, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_CENTS } from '../../netlify/lib/plans.js';

const COST_PER_CAPTURE_USD = Number(process.env.ANTHROPIC_COST_PER_CAPTURE_USD ?? 0.075);
// Ceiling on (captureCap * cost) / price at cap alone, before the grace
// buffer. The documented target is ~75%; the ceiling has a little headroom
// above that so a check doesn't fire on rounding, but still catches a real
// drift (a price cut, a cap increase, or a cost increase that erodes margin).
const MARGIN_CEILING = Number(process.env.MARGIN_CEILING ?? 0.8);
// Per-credit margin floor for the add-on credit pack, per its own
// ">=50% even at worst-case" comment in netlify/lib/plans.js.
const CREDIT_MARGIN_FLOOR = Number(process.env.CREDIT_MARGIN_FLOOR ?? 0.5);

function priceLabelToDollars(label) {
  const n = Number(String(label).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

const failures = [];

for (const key of PLAN_ORDER) {
  const plan = PLANS[key];
  if (!plan.priceEnvVar) continue; // Free tier has no per-capture revenue to check margin against.
  const priceDollars = priceLabelToDollars(plan.priceLabel);
  if (!Number.isFinite(priceDollars) || priceDollars <= 0) {
    failures.push(`plan "${key}": could not parse priceLabel "${plan.priceLabel}"`);
    continue;
  }
  const capCost = plan.captureCap * COST_PER_CAPTURE_USD;
  const ratio = capCost / priceDollars;
  const status = ratio > MARGIN_CEILING ? 'FAIL' : 'ok';
  console.log(`  [${status}] ${key.padEnd(10)} cap=${plan.captureCap} cost=$${capCost.toFixed(2)} price=$${priceDollars.toFixed(2)} -> ${(ratio * 100).toFixed(1)}% of price (ceiling ${(MARGIN_CEILING * 100).toFixed(0)}%)`);
  if (ratio > MARGIN_CEILING) {
    failures.push(`plan "${key}": worst-case cost at cap is ${(ratio * 100).toFixed(1)}% of price, above the ${(MARGIN_CEILING * 100).toFixed(0)}% ceiling`);
  }
}

const perCreditPrice = CREDIT_PACK_PRICE_CENTS / 100 / CREDIT_PACK_SIZE;
const creditMargin = (perCreditPrice - COST_PER_CAPTURE_USD) / perCreditPrice;
console.log(`  [${creditMargin < CREDIT_MARGIN_FLOOR ? 'FAIL' : 'ok'}] credit pack  per-credit=$${perCreditPrice.toFixed(4)} cost=$${COST_PER_CAPTURE_USD.toFixed(4)} -> ${(creditMargin * 100).toFixed(1)}% margin (floor ${(CREDIT_MARGIN_FLOOR * 100).toFixed(0)}%)`);
if (creditMargin < CREDIT_MARGIN_FLOOR) {
  failures.push(`credit pack: margin is ${(creditMargin * 100).toFixed(1)}%, below the ${(CREDIT_MARGIN_FLOOR * 100).toFixed(0)}% floor`);
}

if (failures.length > 0) {
  console.error(`\ncheck-margin: FAIL — ${failures.length} issue(s):\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log('\ncheck-margin: ok');
