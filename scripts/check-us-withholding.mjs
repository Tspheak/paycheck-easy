// Checks US federal withholding (2026 Pub. 15-T percentage method) against
// pay stubs, using the tables in tax/tax-us.json that /app loads at runtime.
// Same steps as federalWithholding in Tspheak/paycheck_easy lib/tax_data.dart
// (compiled into app/main.dart.js): annualize, subtract the Worksheet 1A
// amount, apply the annual table, divide by pay periods.
// Run: node scripts/check-us-withholding.mjs
import { readFileSync } from 'node:fs';

const tax = JSON.parse(
  readFileSync(new URL('../tax/tax-us.json', import.meta.url), 'utf8'),
);

/**
 * @param {number} taxableWages federal taxable wages this paycheck
 * @param {number} periods pay periods per year (26 = biweekly)
 * @param {'single'|'married'|'headOfHousehold'} status
 * @param {boolean} twoJobs W-4 Step 2 checkbox
 * @param {number} [adjustment] override for the Worksheet 1A amount
 *   (for example 0 for a pre-2020 W-4 with 0 allowances)
 */
export function federalWithholding(taxableWages, periods, status, twoJobs = false, adjustment) {
  if (periods <= 0) return 0;
  const adj = adjustment ?? (twoJobs
    ? 0
    : status === 'married'
      ? tax.withholdingAdjustment.marriedFilingJointly
      : tax.withholdingAdjustment.otherFilers);
  const annual = Math.max(0, taxableWages * periods - adj);
  if (annual <= 0) return 0;
  const bands = tax.federal[twoJobs ? 'step2' : 'standard'][status];
  let chosen = bands[0];
  for (const band of bands) {
    if (annual >= band.atLeast) chosen = band;
    else break;
  }
  return (chosen.base + chosen.rate * (annual - chosen.atLeast)) / periods;
}

let failed = 0;
const check = (label, got, want) => {
  const ok = Math.abs(got - want) <= 0.01;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${got.toFixed(2)} (stub ${want.toFixed(2)}, diff ${(got - want).toFixed(2)})`);
};

// Single, standard table, $0 subtracted (old W-4, 0 allowances), biweekly.
const singleStubs = [
  [2707.28, 328.76], [2578.55, 300.44], [2439.40, 269.83], [2000.77, 195.95],
  [2090.93, 206.77], [1910.87, 185.16], [2039.55, 200.60], [1890.95, 182.77],
];
for (const [wages, want] of singleStubs) {
  check(`Single, $0 adjustment, ${wages}`, federalWithholding(wages, 26, 'single', false, 0), want);
}

// MFJ default path ($12,900 subtracted), biweekly. Informational only.
const mfj = federalWithholding(2450.19, 26, 'married');
console.log(`INFO MFJ default, 2450.19: ${mfj.toFixed(2)} (stub 126.33, diff ${(mfj - 126.33).toFixed(2)})`);

process.exit(failed ? 1 : 0);
