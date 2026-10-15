/**
 * 2026–27 Australian pay estimates driven by tax/tax-au.json.
 * Yearly figures use resident income tax, the Medicare levy, HELP and super.
 * Per-pay figures use Schedule 1 (scale 2, tax and Medicare together) and
 * Schedule 8 (helpWithThreshold) from the same file.
 */

export function roundMoney(n) {
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(n) * 100 + 1e-8)) / 100;
}

export function formatMoney(amount) {
  const negative = amount < -0.004;
  const rounded = roundMoney(Math.abs(amount));
  const [whole, frac] = rounded.toFixed(2).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "−$" : "$") + withCommas + "." + frac;
}

export function formatDollars(amount) {
  const negative = amount < -0.004;
  const rounded = roundMoney(Math.abs(amount));
  const whole = Math.abs(rounded - Math.round(rounded)) < 0.001
    ? String(Math.round(rounded))
    : rounded.toFixed(2);
  const [dollars, frac] = whole.split(".");
  const withCommas = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "−$" : "$") + withCommas + (frac ? "." + frac : "");
}

export function parseAmount(raw) {
  if (raw == null) return null;
  const s = String(raw).replace(/[$,\s]/g, "");
  if (s === "" || s === ".") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function incomeTax(income, brackets) {
  for (const band of brackets) {
    if (band.upTo == null || income <= band.upTo) {
      const over = band.excessOver ?? 0;
      return (band.base || 0) + Math.max(0, income - over) * band.rate;
    }
  }
  return 0;
}

export function litoAmount(income, lito) {
  if (!lito || income >= lito.cutsOutAt) return 0;
  for (const tier of lito.tiers) {
    if (income <= tier.upTo) {
      const raw = tier.base - tier.reduction * Math.max(0, income - tier.excessOver);
      return Math.max(0, raw);
    }
  }
  return 0;
}

export function medicareAmount(income, medicare) {
  const full = income * medicare.rate;
  const low = medicare.lowIncomeThresholds;
  if (income <= low.singlesLower) {
    return { amount: 0, reduced: true };
  }
  const shade = medicare.shadeInRate * (income - low.singlesLower);
  const amount = Math.min(full, shade);
  return { amount, reduced: amount + 1e-6 < full };
}

export function helpAmount(income, help) {
  for (const band of help.bands) {
    if (band.upTo == null || income <= band.upTo) {
      if (band.method === "nil") return 0;
      if (band.method === "total") return income * band.rate;
      const over = band.excessOver ?? 0;
      return (band.base || 0) + Math.max(0, income - over) * band.rate;
    }
  }
  return 0;
}

export function superOnEarnings(qualifying, rate, cap) {
  const base = Math.min(Math.max(qualifying, 0), cap);
  return { amount: base * rate, base, capped: qualifying > cap + 1e-9 };
}

export function splitIncludedPackage(packageAnnual, rate, cap) {
  const maxSuper = cap * rate;
  const cashIfUncapped = packageAnnual / (1 + rate);
  if (cashIfUncapped <= cap + 1e-9) {
    return {
      cash: cashIfUncapped,
      super: packageAnnual - cashIfUncapped,
      capped: false,
      qualifying: cashIfUncapped,
    };
  }
  return {
    cash: packageAnnual - maxSuper,
    super: maxSuper,
    capped: true,
    qualifying: cap,
  };
}

export function annualise(amount, frequency, hoursPerWeek) {
  if (frequency === "hourly") {
    if (!(hoursPerWeek > 0)) return null;
    return amount * hoursPerWeek * 52;
  }
  const factor = { annual: 1, monthly: 12, fortnightly: 26, weekly: 52 }[frequency];
  if (!factor) return null;
  return amount * factor;
}

/**
 * @param {object} data parsed tax-au.json
 * @param {object} input { amount, frequency, hoursPerWeek, superOnTop, hasHelp, loanBalance }
 */
export function estimate(data, input) {
  if (input.amount == null) return { error: "Enter an amount to see an estimate." };
  if (input.frequency === "hourly" && !(input.hoursPerWeek > 0)) {
    return { error: "Enter hours per week to estimate hourly pay." };
  }
  const annualEntered = annualise(input.amount, input.frequency, input.hoursPerWeek);
  if (annualEntered == null) return { error: "Choose a pay frequency to see an estimate." };

  let cash;
  let superAmount;
  let superCapped;
  if (input.superOnTop) {
    const sg = superOnEarnings(annualEntered, data.superRate, data.superAnnualCap);
    cash = annualEntered;
    superAmount = sg.amount;
    superCapped = sg.capped;
  } else {
    const split = splitIncludedPackage(annualEntered, data.superRate, data.superAnnualCap);
    cash = split.cash;
    superAmount = split.super;
    superCapped = split.capped;
  }

  const grossTax = incomeTax(cash, data.residentBrackets);
  const offset = Math.min(litoAmount(cash, data.lito), grossTax);
  const taxPayable = grossTax - offset;
  const medicare = medicareAmount(cash, data.medicareLevy);
  let help = input.hasHelp ? helpAmount(cash, data.helpRepayment) : 0;
  let helpCapped = false;
  if (input.hasHelp && input.loanBalance != null) {
    if (help > input.loanBalance) {
      help = input.loanBalance;
      helpCapped = true;
    }
  }
  const takeHome = cash - taxPayable - medicare.amount - help;

  return {
    error: null,
    enteredAnnual: annualEntered,
    cash,
    packageAnnual: input.superOnTop ? cash + superAmount : annualEntered,
    grossTax,
    lito: offset,
    taxPayable,
    medicare: medicare.amount,
    medicareReduced: medicare.reduced,
    withholding: payPeriodWithholding(data, {
      cashAnnual: cash,
      frequency: input.frequency,
      hoursPerWeek: input.hoursPerWeek,
      hasHelp: input.hasHelp,
    }),
    help,
    helpCapped,
    takeHome,
    superAmount,
    superCapped,
    superOnTop: input.superOnTop,
    hasHelp: input.hasHelp,
    frequency: input.frequency,
    hoursPerWeek: input.hoursPerWeek,
    entered: input.amount,
  };
}

export function perWeek(annual) {
  return annual / 52;
}
export function perFortnight(annual) {
  return annual / 26;
}
export function perMonth(annual) {
  return annual / 12;
}

/** Nearest dollar, halves away from zero. Used to check Schedule 1 continuity. */
export function roundDollarHalfUp(amount) {
  if (amount <= 0) return 0;
  return Math.floor(amount + 0.5);
}

export function withholding(a, b, x) {
  return a * x - b;
}

function moneyCents(amount) {
  return Math.round(roundMoney(amount) * 100);
}

/** Weekly earnings factor x: whole dollars plus 99 cents. */
export function weeklyFactor(weeklyEarnings) {
  return Math.floor(moneyCents(weeklyEarnings) / 100) + 0.99;
}

function coefficientRow(scale, x) {
  for (const row of scale) {
    if (row.below == null || x < row.below) return row;
  }
  return scale[scale.length - 1];
}

/** Rounded weekly withholding from a Schedule 1 or Schedule 8 scale. */
export function weeklyWithholding(scale, x) {
  const row = coefficientRow(scale, x);
  return roundDollarHalfUp(row.a * x - row.b);
}

/**
 * PAYG withholding for one pay.
 * Weekly: x = whole dollars + 0.99, y = a·x − b, nearest dollar.
 * Fortnightly: half the pay, ignore cents, add 0.99, then double the rounded week.
 * Monthly: if the pay ends in 33 cents, add one cent; × 3/13, ignore cents, add 0.99;
 * then round(week × 13/3).
 * Scale 2 already includes the Medicare levy. HELP is the Schedule 8 component.
 */
export function scheduleWithholding(periodGross, period, scales, hasHelp) {
  const gross = roundMoney(periodGross);
  let x;
  let toPeriod;
  if (period === "weekly") {
    x = weeklyFactor(gross);
    toPeriod = (week) => week;
  } else if (period === "fortnightly") {
    const halfDollars = Math.floor(moneyCents(gross) / 200);
    x = halfDollars + 0.99;
    toPeriod = (week) => week * 2;
  } else if (period === "monthly") {
    let cents = moneyCents(gross);
    if (cents % 100 === 33) cents += 1;
    const weeklyCents = (cents * 3) / 13;
    x = Math.floor(weeklyCents / 100 + 1e-9) + 0.99;
    toPeriod = (week) => roundDollarHalfUp((week * 13) / 3);
  } else {
    return null;
  }
  const payg = toPeriod(weeklyWithholding(scales.scale2, x));
  const help = hasHelp ? toPeriod(weeklyWithholding(scales.helpWithThreshold, x)) : 0;
  return { x, payg, help };
}

/** Column shown next to the yearly assessment. Hourly pays are withheld on the week, then spread across the hours. */
export function payPeriodWithholding(data, { cashAnnual, frequency, hoursPerWeek, hasHelp }) {
  const weeklyLike = frequency === "weekly" || frequency === "hourly";
  const kind = frequency === "monthly" ? "monthly" : weeklyLike ? "weekly" : "fortnightly";
  const labels = { weekly: "Per week", fortnightly: "Per fortnight", monthly: "Per month", hourly: "Per hour" };
  const divisor = kind === "monthly" ? 12 : kind === "weekly" ? 52 : 26;
  const hours = hoursPerWeek > 0 ? hoursPerWeek : 0;
  const gross = frequency === "hourly"
    ? roundMoney(cashAnnual / (hours * 52))
    : roundMoney(cashAnnual / divisor);
  const basis = frequency === "hourly" ? roundMoney(gross * hours) : gross;
  const withheld = scheduleWithholding(basis, kind, data.scales, hasHelp);
  const spread = frequency === "hourly" && hours > 0 ? hours : 1;
  const payg = withheld.payg / spread;
  const help = withheld.help / spread;
  return {
    label: labels[frequency === "hourly" ? "hourly" : kind],
    gross,
    payg,
    help,
    takeHome: roundMoney(gross - payg - help),
  };
}
