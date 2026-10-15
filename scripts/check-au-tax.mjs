/**
 * Checks tax/tax-au.json against the 2026–27 formulas and the app's parser rules.
 * Run: node scripts/check-au-tax.mjs
 *
 * Schedule 1 b coefficients flagged as odd (scale 1 first row b = 0.1500,
 * scale 1 third row b = 0.1066, scale 3 first row b = 0.3000) are the values
 * published on the ATO coefficients page. This script checks they keep
 * y = a·x − b continuous at each breakpoint, and that b = a on a scale that
 * starts at $0 makes withholding on x = 0.99 round to $0.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  estimate,
  formatMoney,
  helpAmount,
  incomeTax,
  medicareAmount,
  payPeriodWithholding,
  roundDollarHalfUp,
  scheduleWithholding,
  superOnEarnings,
  withholding,
} from "../assets/au-tax.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "tax/tax-au.json"), "utf8"));
const failures = [];

function check(name, ok, detail = "") {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

function close(actual, expected, cents = 0.01) {
  return Math.abs(actual - expected) <= cents + 1e-9;
}

function dateOnly(iso) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// --- schema the Flutter app accepts (main.dart.js aRW / aRE / a5I) ---
check("schemaVersion", data.schemaVersion === 1);
check("country", data.country === "au");
check("taxYear", typeof data.taxYear === "string" && /2026/.test(data.taxYear));
const effective = dateOnly(data.effectiveFrom);
const generated = dateOnly(data.generatedAt);
const bundled = dateOnly("2026-07-01");
const previousGenerated = dateOnly("2026-10-11T08:59:00.770377Z");
const today = new Date();
const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
check("effectiveFrom parses", effective != null);
check(
  "effectiveFrom is after the app's baked-in 2026-07-01 so a remote update applies",
  effective > bundled,
  data.effectiveFrom
);
check(
  "effectiveFrom is not after today (the app rejects a future table)",
  effective <= todayUtc,
  data.effectiveFrom
);
check("income year still starts 2026-07-01", data.incomeYearStart === "2026-07-01");
check("generatedAt is newer than the previous file", generated > previousGenerated);
check("superRate", data.superRate >= 0.09 && data.superRate <= 0.2 && data.superRate === 0.12);
check("superAnnualCap", data.superAnnualCap === 270830);
for (const key of ["weekly", "fortnightly", "monthly"]) {
  const hours = data.ordinaryHoursCaps[key];
  check(`hours ${key}`, hours >= 30 && hours <= 200);
}
for (const name of ["scale1", "scale2", "scale3", "helpWithThreshold", "helpNoThreshold"]) {
  const rows = data.scales[name];
  check(`${name} present`, Array.isArray(rows) && rows.length > 0);
  let prev = null;
  rows.forEach((row, i) => {
    check(`${name}[${i}].a`, typeof row.a === "number" && row.a >= 0 && row.a <= 0.6);
    check(`${name}[${i}].b`, typeof row.b === "number" && Number.isFinite(row.b));
    const last = i === rows.length - 1;
    if (last) check(`${name} last below is null`, row.below === null);
    else {
      check(`${name}[${i}].below`, typeof row.below === "number" && row.below > 0);
      if (prev != null) check(`${name} thresholds increase`, row.below > prev);
      prev = row.below;
    }
  });
}

// --- resident brackets, Medicare, HELP, super ---
const brackets = data.residentBrackets;
check("tax 0", incomeTax(0, brackets) === 0);
check("tax 18200", incomeTax(18200, brackets) === 0);
check("tax 18201", close(incomeTax(18201, brackets), 0.15));
check("tax 45000", incomeTax(45000, brackets) === 4020);
check("tax 45001", close(incomeTax(45001, brackets), 4020.3));
check("tax 135000", incomeTax(135000, brackets) === 31020);
check("tax 190000", incomeTax(190000, brackets) === 51370);
check("tax 190001", close(incomeTax(190001, brackets), 51370.45));
check("tax 85000", incomeTax(85000, brackets) === 16020);
check("tax 78000", incomeTax(78000, brackets) === 13920);
check("tax 72800", incomeTax(72800, brackets) === 12360);

const med = data.medicareLevy;
check("medicare rate", med.rate === 0.02);
check("medicare thresholds have no confirmation flag", med.lowIncomeThresholds.status == null && med.lowIncomeThresholds.carriedOverFrom == null);
check("medicare lower", med.lowIncomeThresholds.singlesLower === 28011);
check("medicare upper", med.lowIncomeThresholds.singlesUpper === 35013);
check("medicare below threshold", medicareAmount(20000, med).amount === 0 && medicareAmount(20000, med).reduced);
check("medicare shade-in", close(medicareAmount(30000, med).amount, 0.1 * (30000 - 28011)) && medicareAmount(30000, med).reduced);
check("medicare full 2%", medicareAmount(85000, med).amount === 1700 && !medicareAmount(85000, med).reduced);

check("help 69528", helpAmount(69528, data.helpRepayment) === 0);
check("help 90000", close(helpAmount(90000, data.helpRepayment), 3070.8));
check("help 140000", close(helpAmount(140000, data.helpRepayment), 10776.11));
check("help 186051", close(helpAmount(186051, data.helpRepayment), 18605.1));

const baseInput = { hoursPerWeek: null, superOnTop: true, hasHelp: false, loanBalance: null };
const hub = estimate(data, { ...baseInput, amount: 85000, frequency: "annual" });
check("hub take-home", formatMoney(hub.takeHome) === "$67,280.00", formatMoney(hub.takeHome));
check("hub fortnight schedule", formatMoney(hub.withholding.takeHome) === "$2,587.23" && hub.withholding.payg === 682, JSON.stringify(hub.withholding));
check("hub super", formatMoney(hub.superAmount) === "$10,200.00");
check("hub super fortnight", formatMoney(hub.superAmount / 26) === "$392.31");

const weekly = estimate(data, { ...baseInput, amount: 1500, frequency: "weekly", hoursPerWeek: 38 });
check("weekly tax", weekly.grossTax === 13920);
check("weekly medicare", weekly.medicare === 1560);
check("weekly take-home year", formatMoney(weekly.takeHome) === "$62,520.00");
check("weekly take-home week", formatMoney(weekly.withholding.takeHome) === "$1,201.00" && weekly.withholding.payg === 299, JSON.stringify(weekly.withholding));
check("weekly super week", formatMoney(weekly.superAmount / 52) === "$180.00");

const fn = estimate(data, { ...baseInput, amount: 2800, frequency: "fortnightly" });
check("fortnightly take-home year", formatMoney(fn.takeHome) === "$58,984.00");
check("fortnightly take-home", formatMoney(fn.withholding.takeHome) === "$2,266.00" && fn.withholding.payg === 534, JSON.stringify(fn.withholding));

const monthly85 = scheduleWithholding(85000 / 12, "monthly", data.scales, true);
check("schedule 1 monthly 85000 payg", monthly85.payg === 1478 && monthly85.x === 1634.99, JSON.stringify(monthly85));
check("schedule 8 monthly 85000 help", monthly85.help === 195, JSON.stringify(monthly85));
const monthlyColumn = payPeriodWithholding(data, { cashAnnual: 85000, frequency: "monthly", hoursPerWeek: null, hasHelp: true });
check("monthly column matches schedule", monthlyColumn.payg === 1478 && monthlyColumn.help === 195, JSON.stringify(monthlyColumn));

const help = estimate(data, { ...baseInput, amount: 90000, frequency: "annual", hasHelp: true, loanBalance: 28000 });
check("help repayment", formatMoney(help.help) === "$3,070.80");
check("help take-home", formatMoney(help.takeHome) === "$67,609.20", formatMoney(help.takeHome));

const sup = superOnEarnings(85000, data.superRate, data.superAnnualCap);
check("super year", formatMoney(sup.amount) === "$10,200.00");
check("super month", formatMoney(sup.amount / 12) === "$850.00");
check("super week", formatMoney(sup.amount / 52) === "$196.15");
const capped = superOnEarnings(300000, data.superRate, data.superAnnualCap);
check("super cap", capped.capped && close(capped.amount, 270830 * 0.12));

const included = estimate(data, { ...baseInput, amount: 85000, frequency: "annual", superOnTop: false });
check("included cash", formatMoney(included.cash) === "$75,892.86", formatMoney(included.cash));
check("included super", formatMoney(included.superAmount) === "$9,107.14", formatMoney(included.superAmount));

// --- Schedule 1 continuity: derive b from y = a·x − b meeting at each breakpoint ---
const flagged = {
  scale1: [
    { below: 188, a: 0.15, b: 0.15 },
    { below: 515, a: 0.179, b: 0.1066 },
  ],
  scale3: [{ below: 2596, a: 0.3, b: 0.3 }],
};
for (const [name, rows] of Object.entries(data.scales)) {
  for (let i = 0; i < rows.length - 1; i++) {
    const current = rows[i];
    const next = rows[i + 1];
    const x = current.below;
    const yCurrent = withholding(current.a, current.b, x);
    const impliedB = next.a * x - yCurrent;
    const yNext = withholding(next.a, next.b, x);
    const gap = Math.abs(yNext - yCurrent);
    check(
      `${name} continuous at ${x}`,
      gap < 0.5,
      `gap $${gap.toFixed(4)} (published b ${next.b}, implied ${impliedB.toFixed(4)})`
    );
    check(
      `${name} nearest dollar agrees at ${x}`,
      roundDollarHalfUp(yCurrent) === roundDollarHalfUp(yNext)
    );
  }
}
for (const [name, expect] of Object.entries(flagged)) {
  for (const want of expect) {
    const row = data.scales[name].find((item) => item.below === want.below);
    check(`${name} below ${want.below} kept`, row && row.a === want.a && row.b === want.b, JSON.stringify(row));
  }
}
const scale1First = data.scales.scale1[0];
const scale3First = data.scales.scale3[0];
check("scale 1 first dollar rounds to 0", roundDollarHalfUp(withholding(scale1First.a, scale1First.b, 0.99)) === 0);
check("scale 3 first dollar rounds to 0", roundDollarHalfUp(withholding(scale3First.a, scale3First.b, 0.99)) === 0);

// --- pages: titles, metas, links, wording ---
const expectedMeta = {
  "pay-calculator": {
    title: "Australian Pay Calculator 2026–27 | Take-Home Pay After Tax · Paycheck Pocket",
    description: "Free 2026–27 Australian pay calculator. See take-home pay after tax, Medicare levy, HELP and 12% super, with ATO-sourced rates and worked examples.",
  },
  "weekly-pay-calculator": {
    title: "Weekly Pay Calculator Australia 2026–27 | Weekly Take-Home Pay · Paycheck Pocket",
    description: "Calculate your weekly take-home pay in Australia for 2026–27. See tax, Medicare levy and 12% super on your weekly wage, with a worked $1,500 example.",
  },
  "fortnightly-pay-calculator": {
    title: "Fortnightly Pay Calculator Australia 2026–27 | After-Tax Pay · Paycheck Pocket",
    description: "Work out your fortnightly take-home pay in Australia for 2026–27, after tax and Medicare levy, plus employer super. Includes a worked $2,800 example.",
  },
  "hecs-help-repayment-calculator": {
    title: "HECS-HELP Repayment Calculator 2026–27 | New Marginal Rates · Paycheck Pocket",
    description: "2026–27 HECS-HELP repayment calculator using the ATO's new marginal rates: nil to $69,528, then 15% and 17%. See a worked example and your take-home pay.",
  },
  "super-calculator": {
    title: "Superannuation Calculator 2026–27 | 12% Super Guarantee · Paycheck Pocket",
    description: "Calculate 12% superannuation guarantee for 2026–27, per pay and per year. Explains Payday Super from 1 July 2026 and the $270,830 maximum contribution base.",
  },
};
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
for (const [slug, meta] of Object.entries(expectedMeta)) {
  const html = readFileSync(join(root, "au", slug, "index.html"), "utf8");
  check(`${slug} title`, html.includes(`<title>${meta.title}</title>`));
  check(`${slug} description`, html.includes(`content="${meta.description}"`));
  check(`${slug} canonical`, html.includes(`https://paycheckpocket.com/au/${slug}/`));
  check(`${slug} play coming soon`, html.includes('class="play-badge-soon"') && html.includes('aria-label="Google Play, coming soon"') && html.includes("Google Play · Coming soon"));
  check(`${slug} play badge`, html.includes("google-play-badge.png"));
  check(`${slug} no live play link`, !html.includes("play.google.com"));
  check(`${slug} iOS coming soon`, html.includes('aria-label="App Store, coming soon"') && html.includes("App Store · Coming soon"));
  check(`${slug} Tun Labs`, html.includes("Tun Labs"));
  check(`${slug} support email`, html.includes("mailto:support@paycheckpocket.com") && html.includes("support@paycheckpocket.com"));
  check(`${slug} no tunlabsapps`, !html.includes("tunlabsapps"));
  check(`${slug} no to be confirmed`, !/to be confirmed|carried over|unconfirmed/i.test(html));
  check(`${slug} no exact`, !/\bexact\b/i.test(html));
  check(`${slug} no personal name`, !/tspheak|pheak|grok/i.test(html));
  check(`${slug} in sitemap`, sitemap.includes(`https://paycheckpocket.com/au/${slug}/`));
}
const payPages = ["pay-calculator", "weekly-pay-calculator", "fortnightly-pay-calculator", "hecs-help-repayment-calculator"];
for (const slug of payPages) {
  const html = readFileSync(join(root, "au", slug, "index.html"), "utf8");
  check(`${slug} medicare thresholds stated`, html.includes("$28,011") && html.includes("$35,013"));
  check(`${slug} names Schedule 1`, html.includes("Schedule 1"));
}
check("nav links Australia", readFileSync(join(root, "index.html"), "utf8").includes('href="au/pay-calculator/"'));
check("no _inputs in au pages", !readdirSync(join(root, "au"), { recursive: true }).some((name) => String(name).includes("_inputs")));

if (failures.length) {
  console.error(`FAILED ${failures.length}`);
  for (const item of failures) console.error(" - " + item);
  process.exit(1);
}
console.log("All Australian tax and page checks passed.");
