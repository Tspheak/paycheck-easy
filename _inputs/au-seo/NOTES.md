# Paycheck Pocket – Australian SEO pages (mockups)

Built 15 Oct 2026 by Grok Bot for Tun Labs. Generator: `gen.py` (HTML), `render.py` (Playwright PNGs + overview.png).
Styling copied from `../contact-page/contact.html` (same tokens, nav, footer, store badges). Pills use `.plan-pill` (dark #0B2E2A on gold #E0A526). No `.best` class.
Contact: support@tunlabsapps.com · Play: com.tunlabs.paycheckpocket.

## Verified rates (ato.gov.au only)
| Item | 2026–27 value | Source |
|---|---|---|
| Resident tax rates | 0–18,200 nil; 18,201–45,000 15%; 45,001–135,000 $4,020 + 30%; 135,001–190,000 $31,020 + 37%; 190,001+ $51,370 + 45% | https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents (updated 13 Aug 2026) |
| Medicare levy | 2% | same page ("do not include the Medicare levy of 2%") |
| HELP / study loan repayment | nil to $69,528; 15c per $1 over $69,528 to $129,717; $9,028 + 17c per $1 over $129,717 to $186,050; 10% of total RI from $186,051 | https://www.ato.gov.au/tax-rates-and-codes/study-and-training-support-loans-rates-and-repayment-thresholds (updated 13 Oct 2026) |
| Super guarantee | 12.00% (1 Jul 2026 – 30 Jun 2027); Payday Super from 1 Jul 2026; max contribution base $270,830 annual | https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee (updated 17 Apr 2026) |
| LITO | up to $700, cuts out at $66,667 (page not year-labelled) | https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset |

## Rates to be confirmed
- Medicare levy low-income thresholds for 2026–27: the ATO page only gives 2025–26 ($28,011 / $35,013 singles). It's shown on the pages as "rates to be confirmed". Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners
- Concessional contributions cap: not stated as a number on the pages. The super page says "check the ATO".
- The ATO HELP page has typos in its own examples. Example 3 says "above $179,286", which is the 2025–26 figure, and Example 1 sums $60,720 where the text says $60,470. These don't affect Table 1, which we use.

## Example results (computed in gen.py from the verified rates; annualised; resident; no LITO since all > $66,667)
- Hub: $85,000 → tax $16,020, Medicare $1,700, take-home $67,280 ($2,587.69/fn), super $10,200
- Weekly: $1,500/wk ($78,000) → tax $13,920, Medicare $1,560, take-home $62,520 = $1,202.31/wk, super $180/wk
- Fortnightly: $2,800/fn ($72,800) → tax $12,360, Medicare $1,456, take-home $58,984 = $2,268.62/fn
- HELP: $90,000 → repayment $3,070.80; take-home $67,609.20. Also $140,000 → $10,776.11
- Super: $85,000 → $10,200/yr, $850/mo, $392.31/fn, $196.15/wk

## SEO titles / meta / keywords
| File (suggested URL) | Title | Meta description | Target keywords |
|---|---|---|---|
| au-pay-calculator.html (/au/pay-calculator/) | Australian Pay Calculator 2026–27 \| Take-Home Pay After Tax · Paycheck Pocket | Free 2026–27 Australian pay calculator. See take-home pay after tax, Medicare levy, HELP and 12% super, with ATO-sourced rates and worked examples. | pay calculator australia, take home pay calculator 2026-27, salary after tax australia, income tax calculator australia |
| au-weekly-pay.html (/au/weekly-pay-calculator/) | Weekly Pay Calculator Australia 2026–27 \| Weekly Take-Home Pay · Paycheck Pocket | Calculate your weekly take-home pay in Australia for 2026–27. See tax, Medicare levy and 12% super on your weekly wage, with a worked $1,500 example. | weekly pay calculator australia, weekly take home pay, weekly wage after tax, hourly to weekly pay |
| au-fortnightly-pay.html (/au/fortnightly-pay-calculator/) | Fortnightly Pay Calculator Australia 2026–27 \| After-Tax Pay · Paycheck Pocket | Work out your fortnightly take-home pay in Australia for 2026–27, after tax and Medicare levy, plus employer super. Includes a worked $2,800 example. | fortnightly pay calculator, fortnightly tax calculator australia, fortnightly take home pay, salary to fortnightly |
| au-hecs-help.html (/au/hecs-help-repayment-calculator/) | HECS-HELP Repayment Calculator 2026–27 \| New Marginal Rates · Paycheck Pocket | 2026–27 HECS-HELP repayment calculator using the ATO's new marginal rates: nil to $69,528, then 15% and 17%. See a worked example and your take-home pay. | hecs repayment calculator, help repayment thresholds 2026-27, hecs threshold 2026, study loan repayment |
| au-super.html (/au/super-calculator/) | Superannuation Calculator 2026–27 \| 12% Super Guarantee · Paycheck Pocket | Calculate 12% superannuation guarantee for 2026–27, per pay and per year. Explains Payday Super from 1 July 2026 and the $270,830 maximum contribution base. | super calculator australia, super guarantee 12%, payday super, superannuation on salary, maximum contribution base 2026-27 |

## Competitor (paycalculator.com.au), quick look
It's one long single-page tool with many settings (novated lease, FBT, family tax benefit, CCS, inflation, percentiles). These pages cover more ground by giving each high-intent query its own page: weekly, fortnightly, HECS/HELP and super. Each page also has a step-by-step worked example and the 2026–27 changes (15% bracket, marginal HELP, Payday Super, annual max contribution base), plus an FAQ and cross-links. No competitor text was reused.

## Open items
- Medicare low-income thresholds for 2026–27 are still to be confirmed.
- Calculators are static mockups. A live version needs ATO PAYG withholding schedules (Schedule 1 / 8) to match payslips.
- Non-resident and working holiday maker rates are out of scope.
- Hrefs (`./`, `app/`, `features.html`) mirror the contact page. Adjust them to the final /au/ paths when deploying.
