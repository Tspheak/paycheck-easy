import {
  estimate,
  formatDollars,
  formatMoney,
  helpAmount,
  parseAmount,
  perFortnight,
  perMonth,
  perWeek,
} from "./au-tax.js";

const FREQUENCIES = ["annual", "monthly", "fortnightly", "weekly", "hourly"];
const FREQ_LABEL = {
  annual: "Annual",
  monthly: "Monthly",
  fortnightly: "Fortnightly",
  weekly: "Weekly",
  hourly: "Hourly",
};

function moneyCell(value) {
  return value < -0.004 ? formatMoney(value) : formatMoney(value);
}

function row(label, annual, period) {
  return `<tr><td>${label}</td><td class="n">${moneyCell(annual)}</td><td class="n">${moneyCell(period)}</td></tr>`;
}

function resultNote(est, data, page) {
  const bits = [];
  bits.push(est.hasHelp ? "Includes a compulsory study-loan repayment." : "No HELP debt.");
  bits.push("Resident, tax-free threshold claimed.");
  if (est.lito <= 0.004 && est.cash > data.lito.cutsOutAt) {
    bits.push(`LITO is nil above ${formatDollars(data.lito.cutsOutAt)}.`);
  } else if (est.lito > 0.004) {
    bits.push("Includes the low income tax offset.");
  }
  if (page !== "super") {
    bits.push("Per-pay withholding is ATO Schedule 1 (tax and Medicare together) and Schedule 8 for HELP. It is not the yearly tax divided by the number of pays.");
  }
  if (est.superCapped) {
    bits.push(
      `Super guarantee uses the ${formatDollars(data.superAnnualCap)} maximum contribution base.`
    );
  }
  if (est.helpCapped) bits.push("The yearly repayment is limited to the loan balance entered.");
  return bits.join(" ");
}

function moneyOrDash(value) {
  return value == null ? "—" : moneyCell(value);
}

function mixedRow(label, annual, period) {
  return `<tr><td>${label}</td><td class="n">${moneyOrDash(annual)}</td><td class="n">${moneyOrDash(period)}</td></tr>`;
}

function payTable(est) {
  const pay = est.withholding;
  const medLabel = est.medicareReduced ? "Medicare levy (low-income reduction)" : "Medicare levy (2%)";
  const rows = [mixedRow("Gross pay", est.cash, pay.gross)];
  if (est.lito > 0.004) {
    rows.push(mixedRow("Income tax (2026–27 resident rates)", -est.grossTax, null));
    rows.push(mixedRow("Low income tax offset", est.lito, null));
  } else {
    rows.push(mixedRow("Income tax (2026–27 resident rates)", -est.taxPayable, null));
  }
  rows.push(mixedRow(medLabel, -est.medicare, null));
  rows.push(mixedRow("PAYG withholding (Schedule 1)", null, -pay.payg));
  if (est.hasHelp) rows.push(mixedRow("HELP (year: repayment, pay: Schedule 8)", -est.help, -pay.help));
  const body = rows.join("");
  const superLabel = est.superOnTop
    ? "Employer super (12%, paid on top)"
    : "Employer super (12%, included in package)";
  const superPeriod = pay.gross > 0 && est.cash > 0 ? est.superAmount * (pay.gross / est.cash) : 0;
  return `<table><tr><th></th><th class="n">Per year</th><th class="n">${pay.label}</th></tr>${body}<tr class="tot"><td>Take-home pay</td><td class="n">${formatMoney(est.takeHome)}</td><td class="n">${formatMoney(pay.takeHome)}</td></tr><tr><td>${superLabel}</td><td class="n">${formatMoney(est.superAmount)}</td><td class="n">${formatMoney(superPeriod)}</td></tr></table>`;
}

function heading(page, input, est) {
  const amt = formatDollars(input.amount);
  if (page === "weekly") return `${amt} a week`;
  if (page === "fortnightly") return `${amt} a fortnight`;
  if (page === "help") return `${amt} with a HELP debt`;
  if (page === "super") return `Super on ${amt}`;
  if (input.frequency === "hourly") return `${amt} an hour`;
  if (input.frequency === "weekly") return `${amt} a week`;
  if (input.frequency === "fortnightly") return `${amt} a fortnight`;
  if (input.frequency === "monthly") return `${amt} a month`;
  return `${amt} salary`;
}

function subtitle(page, est) {
  if (page === "help") return "compulsory repayment for 2026–27";
  if (page === "super") {
    return `employer super per year · ${formatMoney(perFortnight(est.superAmount))} per fortnight`;
  }
  const unit = { weekly: "week", fortnightly: "fortnight", monthly: "month", hourly: "hour" }[est.frequency];
  if (unit) {
    return `Schedule 1 take-home per ${unit} · ${formatMoney(est.takeHome)} assessed per year`;
  }
  return `take-home per year · ${formatMoney(est.withholding.takeHome)} per fortnight after Schedule 1`;
}

function bigAmount(page, est) {
  if (page === "help") return est.help;
  if (page === "super") return est.superAmount;
  if (est.frequency === "annual") return est.takeHome;
  return est.withholding.takeHome;
}

function extraNote(page, input, est, data) {
  if (page === "help") {
    const at140 = helpAmount(140000, data.helpRepayment);
    return `At $140,000 the repayment would be $9,028 + ($140,000 − $129,717) × 17% = ${formatMoney(at140)}. Assumes repayment income equals taxable income.`;
  }
  if (page === "super") {
    if (est.superOnTop) {
      return `Your take-home pay stays ${formatMoney(est.takeHome)} a year, because super is paid on top.`;
    }
    return `If ${formatDollars(input.amount)} includes super: salary ${formatMoney(est.cash)}, super ${formatMoney(est.superAmount)}. Take-home pay on that salary is ${formatMoney(est.takeHome)} a year.`;
  }
  if (input.frequency === "weekly") {
    let text = `${formatDollars(input.amount)} × 52 weeks = ${formatDollars(est.enteredAnnual)} a year.`;
    if (input.hoursPerWeek > 0) {
      text += ` At ${input.hoursPerWeek} hours that is about ${formatMoney(input.amount / input.hoursPerWeek)} an hour before tax.`;
    }
    return text;
  }
  if (input.frequency === "fortnightly") {
    return `${formatDollars(input.amount)} × 26 fortnights = ${formatDollars(est.enteredAnnual)} a year.`;
  }
  return "";
}

function superTable(est) {
  const s = est.superAmount;
  return `<table><tr><th>Pay cycle</th><th class="n">Super guarantee (12%)</th></tr>
<tr><td>Per year</td><td class="n">${formatMoney(s)}</td></tr>
<tr><td>Per month</td><td class="n">${formatMoney(perMonth(s))}</td></tr>
<tr><td>Per fortnight</td><td class="n">${formatMoney(perFortnight(s))}</td></tr>
<tr><td>Per week</td><td class="n">${formatMoney(perWeek(s))}</td></tr></table>`;
}

function render(page, input, est, data) {
  const extra = extraNote(page, input, est, data);
  const table = page === "super" ? superTable(est) : payTable(est);
  return `<span class="plan-pill">Estimate</span>
<h2>${heading(page, input, est)}</h2>
<div class="big">${formatMoney(bigAmount(page, est))}</div>
<p class="small lead">${subtitle(page, est)}</p>
${table}
<p class="small">${extra ? extra + " " : ""}${resultNote(est, data, page)}</p>`;
}

function readInput(form) {
  const freqBtn = form.querySelector('.seg button[aria-checked="true"]');
  const frequency = freqBtn ? freqBtn.dataset.freq : "annual";
  const hoursEl = form.querySelector("[data-hours]");
  const loanEl = form.querySelector("[data-loan]");
  const superMode = form.querySelector("[data-super-mode] button[aria-checked='true']");
  const superCheck = form.querySelector("[data-super-on-top]");
  const helpCheck = form.querySelector("[data-help]");
  let superOnTop = true;
  if (superMode) superOnTop = superMode.dataset.mode !== "included";
  else if (superCheck) superOnTop = superCheck.checked;
  return {
    amount: parseAmount(form.querySelector("[data-amount]").value),
    frequency,
    hoursPerWeek: hoursEl && !hoursEl.closest("[hidden]") ? parseAmount(hoursEl.value) : (hoursEl ? parseAmount(hoursEl.value) : null),
    superOnTop,
    hasHelp: helpCheck ? helpCheck.checked : false,
    loanBalance: loanEl && loanEl.value.trim() !== "" ? parseAmount(loanEl.value) : null,
  };
}

function syncHours(form) {
  const row = form.querySelector("[data-hours-row]");
  if (!row) return;
  const always = row.dataset.hoursAlways === "true";
  const freq = form.querySelector('.seg button[aria-checked="true"]');
  const hourly = freq && freq.dataset.freq === "hourly";
  const show = always || hourly;
  row.hidden = !show;
  const label = row.querySelector("label");
  if (label) {
    label.textContent = hourly ? "Hours per week" : "Hours per week (optional)";
  }
}

function amountLabel(form) {
  const label = form.querySelector("[data-amount-label]");
  if (!label) return;
  const page = form.dataset.page;
  const freq = form.querySelector('.seg button[aria-checked="true"]')?.dataset.freq;
  if (page === "help") {
    label.textContent = "Repayment income (A$)";
    return;
  }
  if (page === "super") {
    label.textContent = "Salary / qualifying earnings (A$)";
    return;
  }
  const map = {
    annual: "Salary (A$)",
    monthly: "Monthly pay before tax (A$)",
    fortnightly: "Fortnightly pay before tax (A$)",
    weekly: "Weekly pay before tax (A$)",
    hourly: "Hourly rate before tax (A$)",
  };
  label.textContent = map[freq] || "Salary (A$)";
}

async function loadData() {
  const res = await fetch(new URL("../tax/tax-au.json", import.meta.url));
  if (!res.ok) throw new Error("Could not load tax rates");
  return res.json();
}

function wire(form, data) {
  const result = document.getElementById("result");
  const page = form.dataset.page;

  function recalc() {
    syncHours(form);
    amountLabel(form);
    const input = readInput(form);
    if (input.loanBalance === null && form.querySelector("[data-loan]") && form.querySelector("[data-loan]").value.trim() !== "") {
      result.innerHTML = `<h2>Check the loan balance</h2><p class="small">Enter the balance as a number, or leave it blank.</p>`;
      return;
    }
    const est = estimate(data, input);
    if (est.error) {
      result.innerHTML = `<span class="plan-pill">Estimate</span><h2>Estimate</h2><p class="small">${est.error}</p>`;
      return;
    }
    result.innerHTML = render(page, input, est, data);
  }

  form.querySelectorAll(".seg button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.parentElement;
      group.querySelectorAll("button").forEach((other) => other.setAttribute("aria-checked", "false"));
      btn.setAttribute("aria-checked", "true");
      recalc();
    });
  });
  form.addEventListener("input", recalc);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    recalc();
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  recalc();
}

const form = document.getElementById("au-form");
if (form) {
  loadData()
    .then((data) => wire(form, data))
    .catch(() => {
      const result = document.getElementById("result");
      if (result) {
        const note = document.createElement("p");
        note.className = "small";
        note.textContent = "Live rates could not be loaded. The figures above are the worked example. Refresh to calculate again.";
        result.appendChild(note);
      }
    });
}

export { FREQUENCIES, FREQ_LABEL };
