import re
src=open('../contact-page/contact.html').read()
css=re.search(r'<style>(.*)</style>',src,re.S).group(1)
css+=r"""
.plan-pill{display:inline-block;background:#E0A526;color:#0B2E2A;font-weight:800;font-size:13px;font-variant-caps:all-small-caps;letter-spacing:.06em;line-height:1;padding:6px 12px 7px;border-radius:999px;white-space:nowrap}
.pill-tbc{background:#FEF3C7;color:#92400E;border:1px solid #FCD34D}
.au-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px}
.au-nav a{font-size:14px;font-weight:600;background:#fff;border:1px solid #E5E7EB;border-radius:999px;padding:6px 14px;color:#374151}
.au-nav a[aria-current]{background:var(--teal);border-color:var(--teal);color:#fff}
.grid2{display:grid;gap:20px}
@media(min-width:900px){.grid2{grid-template-columns:1fr 1fr}}
.card h2,section>h2{font-size:22px;font-weight:800;margin-bottom:10px}
section{margin-top:28px}
label{display:block;font-size:14px;font-weight:700;margin:14px 0 6px}
.field,select{width:100%;border:1px solid #D1D5DB;border-radius:10px;padding:12px 14px;font:inherit;background:#fff;color:var(--text)}
.seg{display:flex;flex-wrap:wrap;gap:6px}.seg span{border:1px solid #D1D5DB;border-radius:999px;padding:6px 12px;font-size:14px}.seg span.on{background:var(--teal-soft);border-color:var(--teal);color:var(--teal-dark);font-weight:700}
.check{display:flex;gap:8px;align-items:center;font-size:14px;margin-top:12px}.check i{width:18px;height:18px;border:2px solid var(--teal);border-radius:4px;display:inline-block;flex:none}.check i.on{background:var(--teal)}
.btn.calc{width:100%;display:flex}
.result{border-top:4px solid var(--gold)}
.big{font-size:40px;font-weight:800;color:var(--teal-dark);letter-spacing:-.02em}
table{width:100%;border-collapse:collapse;font-size:15px;margin-top:10px}
td,th{padding:9px 6px;border-bottom:1px solid #E5E7EB;text-align:left}td.n,th.n{white-space:nowrap;text-align:right;font-variant-numeric:tabular-nums}
tr.tot td{font-weight:800;border-bottom:none}
.small{font-size:13px;color:var(--muted);margin-top:10px}
.prose p,.prose li{color:#374151;margin-top:10px}.prose ul{margin-left:20px}
.links{display:grid;gap:12px}@media(min-width:720px){.links{grid-template-columns:repeat(2,1fr)}}
.links a{display:block;background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px;font-weight:700}.links a span{display:block;font-weight:400;color:var(--muted);font-size:14px}
.cta{background:#0B3D3A;color:#ECFDF5;border-radius:var(--radius);padding:28px 22px;text-align:center}
.cta h2{color:#fff}.cta p{color:#A7F3D0;margin-bottom:16px}
.cta .ios{opacity:.85}
@media(max-width:719px){table{font-size:13px}td,th{padding:8px 4px}.big{font-size:34px}}
"""
PLAY="https://play.google.com/store/apps/details?id=com.tunlabs.paycheckpocket"
PAGES=[("au-pay-calculator.html","AU pay calculator"),("au-weekly-pay.html","Weekly pay"),("au-fortnightly-pay.html","Fortnightly pay"),("au-hecs-help.html","HECS/HELP"),("au-super.html","Super")]
def tax(i):
  if i<=18200:return 0
  if i<=45000:return (i-18200)*.15
  if i<=135000:return 4020+(i-45000)*.3
  if i<=190000:return 31020+(i-135000)*.37
  return 51370+(i-190000)*.45
def help_(r):
  if r<=69528:return 0
  if r<=129717:return (r-69528)*.15
  if r<=186050:return 9028+(r-129717)*.17
  return r*.10
f=lambda x:f"${x:,.2f}"
f0=lambda x:f"${x:,.0f}"
def breakdown(annual,per,label,helpinc=False):
  t,m=tax(annual),annual*.02; h=help_(annual) if helpinc else 0; net=annual-t-m-h; s=annual*.12
  rows=[("Gross pay",annual),("Income tax (2026–27 resident rates)",-t),("Medicare levy (2%)",-m)]
  if helpinc: rows.append(("HELP compulsory repayment",-h))
  out="<table><tr><th></th><th class=n>Per year</th><th class=n>"+label+"</th></tr>"
  for n,v in rows: out+=f"<tr><td>{n}</td><td class=n>{f(v) if v>=0 else '−'+f(-v)}</td><td class=n>{f(v/per) if v>=0 else '−'+f(-v/per)}</td></tr>"
  out+=f"<tr class=tot><td>Take-home pay</td><td class=n>{f(net)}</td><td class=n>{f(net/per)}</td></tr>"
  out+=f"<tr><td>Employer super (12%, paid on top)</td><td class=n>{f(s)}</td><td class=n>{f(s/per)}</td></tr></table>"
  return out,net,s
def form(freq,extra=""):
  segs="".join(f'<span class="{"on" if x==freq else ""}">{x}</span>' for x in ["Annual","Monthly","Fortnightly","Weekly","Hourly"])
  return f"""<div class=card><h2>Calculator</h2><p class=small style="margin:0">Mockup · 2026–27 income year (1 July 2026 – 30 June 2027)</p>
<label>Pay frequency</label><div class=seg>{segs}</div>
{extra}
<label>Residency</label><select class=field><option>Resident, tax-free threshold</option></select>
<div class=check><i class=on></i>Super is paid on top of this amount</div>
<div class=check><i class="{'on' if 'Repayment income' in extra else ''}"></i>I have a HELP / HECS or other study loan</div>
<a class="btn calc" href="#result">Calculate take-home pay</a></div>"""
def inp(lbl,val):return f'<label>{lbl}</label><input class=field value="{val}">'
TBC='<span class="plan-pill pill-tbc">rates to be confirmed</span>'
def page(fn,title,eyebrow,h1,sub,formhtml,resulthtml,explainer,faqs,metadesc):
  nav="".join(f'<a href="{p}"{" aria-current=page" if p==fn else ""}>{n}</a>' for p,n in PAGES)
  links="".join(f'<a href="{p}">{n}<span>{d}</span></a>' for (p,n),d in zip(PAGES,["Annual, monthly, fortnightly and weekly pay","What lands in your account each week","Pay after tax every two weeks","2026–27 compulsory repayment rates","12% super guarantee and Payday Super"]) if p!=fn)
  fq="".join(f"<details{' open' if i==0 else ''}><summary>{q}</summary><p>{a}</p></details>" for i,(q,a) in enumerate(faqs))
  return f"""<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{metadesc}"><link rel="icon" type="image/png" href="icon.png"><style>{css}</style></head><body>
<header><div class="container header-inner"><a class="brand" href="./"><img src="icon.png" alt="Paycheck Pocket icon" width="40" height="40"><span>Paycheck Pocket</span></a>
<nav><a href="./">Home</a><a href="app/" aria-current="page">Calculator</a><a href="features.html">Features</a><a href="pricing.html">Pricing</a><a href="privacy/">Privacy</a><a href="contact.html">Contact</a></nav></div></header>
<main class="container">
<section class=hero style="padding-bottom:16px"><span class=eyebrow>{eyebrow}</span><h1>{h1}</h1><p class=sub>{sub}</p></section>
<div class=au-nav>{nav}</div>
<div class=grid2>{formhtml}<div class="card result" id=result>{resulthtml}</div></div>
<section class="card prose">{explainer}</section>
<section class=faq><h2>FAQ</h2>{fq}</section>
<section><h2>More Australian pay calculators</h2><div class=links>{links}</div></section>
<section class=cta><h2>Check every pay on your phone</h2><p>Paycheck Pocket for Android works out your take-home pay in seconds.</p>
<div class=stores><a href="{PLAY}"><img src="google-play-badge.png" alt="Get it on Google Play"></a><span class=ios aria-disabled=true role=img aria-label="iOS app coming soon"><small>Coming soon</small><b>iOS app</b></span></div></section>
<p class=small>Estimates only, using ATO 2026–27 resident rates. Not tax advice. Your employer's PAYG withholding uses ATO tax tables, so each payslip can differ slightly from these figures; differences are settled when you lodge your tax return. Questions: <a href="mailto:support@tunlabsapps.com">support@tunlabsapps.com</a></p>
</main>
<footer><div class="container footer-inner"><span>© 2026 Tun Labs</span><div class=footer-links><a href="privacy/">Privacy</a><a href="contact.html">Contact</a></div></div></footer></body></html>"""
RATES="""<table><tr><th>Taxable income</th><th>Tax on this income (2026–27)</th></tr>
<tr><td>$0 – $18,200</td><td>Nil</td></tr><tr><td>$18,201 – $45,000</td><td>15c for each $1 over $18,200</td></tr>
<tr><td>$45,001 – $135,000</td><td>$4,020 plus 30c for each $1 over $45,000</td></tr><tr><td>$135,001 – $190,000</td><td>$31,020 plus 37c for each $1 over $135,000</td></tr>
<tr><td>$190,001 and over</td><td>$51,370 plus 45c for each $1 over $190,000</td></tr></table><p class=small>Source: ATO, Tax rates – Australian resident. Excludes the 2% Medicare levy.</p>"""
MED=f"<p>The Medicare levy is 2% of taxable income. Low-income earners pay a reduced levy or none; the 2026–27 low-income thresholds are {TBC} (ATO has published 2025–26 figures: $28,011 / $35,013 for singles). Our examples are well above those thresholds, so they're not affected.</p>"
P={}
# hub
b,net,s=breakdown(85000,26,"Per fortnight")
P["au-pay-calculator.html"]=page("au-pay-calculator.html","Australian Pay Calculator 2026–27 | Take-Home Pay After Tax · Paycheck Pocket","Australia · 2026–27 rates","Australian pay calculator 2026–27","Work out your take-home pay after income tax, Medicare levy, HELP and super, using the ATO's 2026–27 resident rates.",
 form("Annual",inp("Salary (A$)","85,000")),
 f'<span class=plan-pill>Example result</span><h2 style="margin-top:10px">$85,000 salary</h2><div class=big>{f(net)}</div><p class=small style="margin-top:0">take-home per year · {f(net/26)} per fortnight</p>'+b+'<p class=small>No HELP debt. Resident, tax-free threshold claimed. LITO is nil above $66,667.</p>',
 "<h2>How Australian take-home pay is worked out</h2><p>Your take-home pay is your gross pay minus income tax, the Medicare levy and, if you have one, a compulsory study loan repayment. Superannuation is usually paid by your employer on top of your salary, so it doesn't reduce your pay unless your package is quoted “including super”.</p><h2 style='margin-top:20px'>2026–27 resident tax rates</h2><p>From 1 July 2026 the rate on income between $18,201 and $45,000 drops from 16% to 15%. The other brackets are unchanged.</p>"+RATES+MED+"<p>The low income tax offset (LITO) of up to $700 still applies for incomes up to $66,667 (ATO).</p>",
 [("What changed for 2026–27?","The 16% rate on taxable income from $18,201 to $45,000 is now 15%, so the tax at the top of that bracket falls from $4,288 to $4,020. The higher brackets keep the same rates and thresholds."),
  ("Does this include super?","Our examples treat super as paid on top of your salary at the 12% super guarantee rate. If your salary package includes super, untick the box and we'll split it out."),
  ("Why is my payslip slightly different?","Employers withhold tax using ATO withholding schedules that spread offsets and rounding across the year. Your actual tax is settled when you lodge your return."),
  ("Does it work for non-residents or working holiday makers?","This page covers Australian residents who claim the tax-free threshold. Non-resident and working holiday maker rates are different and aren't shown here.")],
 "Free 2026–27 Australian pay calculator. See take-home pay after tax, Medicare levy, HELP and 12% super, with ATO-sourced rates and worked examples.")
b,net,s=breakdown(78000,52,"Per week")
P["au-weekly-pay.html"]=page("au-weekly-pay.html","Weekly Pay Calculator Australia 2026–27 | Weekly Take-Home Pay · Paycheck Pocket","Australia · Weekly pay","Weekly take-home pay calculator","Turn your weekly wage into after-tax pay, using 2026–27 ATO rates.",
 form("Weekly",inp("Weekly pay before tax (A$)","1,500")+inp("Hours per week (optional)","38")),
 f'<span class=plan-pill>Example result</span><h2 style="margin-top:10px">$1,500 a week</h2><div class=big>{f(net/52)}</div><p class=small style="margin-top:0">take-home per week · {f(net)} per year</p>'+b+f'<p class=small>$1,500 × 52 weeks = $78,000 a year. At 38 hours that is about {f(1500/38)} an hour before tax.</p>',
 "<h2>How weekly pay is calculated</h2><p>We annualise your weekly pay (× 52), apply the 2026–27 resident tax rates and Medicare levy, then divide the result back into weeks. This shows what your weekly pay is worth over a full year.</p><p>Some years contain 53 paydays for weekly-paid workers. When that happens your employer may withhold slightly more tax each week so the year doesn't end with a shortfall.</p>"+RATES+MED,
 [("How do I convert an hourly rate to weekly pay?","Multiply your hourly rate by the hours you work in a normal week. For example $40 × 38 hours = $1,520 a week before tax."),
  ("Is super taken out of my weekly pay?","No. The 12% super guarantee is paid by your employer on top of your wage. From 1 July 2026 it must be paid each payday under Payday Super."),
  ("What if my hours change every week?","Enter an average week for a yearly picture, or use the Paycheck Pocket app to log each shift."),
  ("Does overtime change my tax rate?","Overtime is taxed as ordinary income. A large week can mean more tax withheld that week, but your final tax is based on your total income for the year.")],
 "Calculate your weekly take-home pay in Australia for 2026–27. See tax, Medicare levy and 12% super on your weekly wage, with a worked $1,500 example.")
b,net,s=breakdown(72800,26,"Per fortnight")
P["au-fortnightly-pay.html"]=page("au-fortnightly-pay.html","Fortnightly Pay Calculator Australia 2026–27 | After-Tax Pay · Paycheck Pocket","Australia · Fortnightly pay","Fortnightly take-home pay calculator","See what lands in your account every two weeks after tax and Medicare, using 2026–27 ATO rates.",
 form("Fortnightly",inp("Fortnightly pay before tax (A$)","2,800")),
 f'<span class=plan-pill>Example result</span><h2 style="margin-top:10px">$2,800 a fortnight</h2><div class=big>{f(net/26)}</div><p class=small style="margin-top:0">take-home per fortnight · {f(net)} per year</p>'+b+'<p class=small>$2,800 × 26 fortnights = $72,800 a year.</p>',
 "<h2>Fortnightly pay, explained</h2><p>Most Australian employers pay fortnightly. To estimate your after-tax pay we multiply your fortnightly gross by 26, apply the 2026–27 resident tax rates and the 2% Medicare levy, then divide by 26.</p><p>Every 11 years or so there are 27 fortnightly paydays in a financial year. Employers can withhold a little extra tax each fortnight in those years.</p>"+RATES+MED+"<p>Rent and bills are often monthly. A fortnightly amount × 26 ÷ 12 gives the monthly equivalent, not × 2.</p>",
 [("How do I turn an annual salary into fortnightly pay?","Divide the annual figure by 26. A $72,800 salary is $2,800 a fortnight before tax."),
  ("Why isn't fortnightly pay just half of monthly?","There are 26 fortnights in a year but 12 months, so a month is about 2.17 fortnights."),
  ("Does HELP come out of each fortnightly pay?","If you've told your employer you have a study loan, they withhold extra each pay. See our HECS/HELP repayment page for 2026–27 rates."),
  ("Is super included?","No. Super of 12% is paid by your employer on top of your pay.")],
 "Work out your fortnightly take-home pay in Australia for 2026–27, after tax and Medicare levy, plus employer super. Includes a worked $2,800 example.")
b,net,s=breakdown(90000,26,"Per fortnight",True)
HT="""<table><tr><th>Repayment income (2026–27)</th><th>Repayment</th></tr><tr><td>$0 – $69,528</td><td>Nil</td></tr><tr><td>$69,529 – $129,717</td><td>15c for each $1 over $69,528</td></tr><tr><td>$129,718 – $186,050</td><td>$9,028 plus 17c for each $1 over $129,717</td></tr><tr><td>$186,051 and over</td><td>10% of total repayment income</td></tr></table><p class=small>Source: ATO, Study and training loan minimum repayment income and rates.</p>"""
P["au-hecs-help.html"]=page("au-hecs-help.html","HECS-HELP Repayment Calculator 2026–27 | New Marginal Rates · Paycheck Pocket","Australia · Study loans","HECS/HELP repayment calculator 2026–27","See your compulsory study loan repayment under the new marginal system and how it affects your take-home pay.",
 form("Annual",inp("Repayment income (A$)","90,000")+inp("Loan balance (optional)","28,000")),
 f'<span class=plan-pill>Example result</span><h2 style="margin-top:10px">$90,000 with a HELP debt</h2><div class=big>{f(help_(90000))}</div><p class=small style="margin-top:0">compulsory repayment for 2026–27 · ($90,000 − $69,528) × 15%</p>'+b+f'<p class=small>At $140,000 the repayment would be $9,028 + ($140,000 − $129,717) × 17% = {f(help_(140000))}. Assumes repayment income equals taxable income.</p>',
 "<h2>How HELP repayments work from 2026–27</h2><p>Since 2025–26, compulsory repayments are marginal: you repay only on the part of your income above the minimum repayment income, rather than a percentage of your whole income. For 2026–27 that minimum is $69,528.</p>"+HT+"<p>Repayment income is more than your salary. It adds reportable fringe benefits, net investment losses, reportable super contributions and exempt foreign employment income to your taxable income.</p><p>The same thresholds apply to HELP, VET Student Loans, SFSS, Student Start-up Loans, ABSTUDY SSL and Australian Apprenticeship Support Loans.</p>",
 [("Is HECS the same as HELP?","Yes. HECS-HELP is the HELP loan most university students have. People still call it HECS."),
  ("When do I start repaying?","Compulsory repayments start once your 2026–27 repayment income is more than $69,528."),
  ("Why is my employer withholding more than this estimate?","Employers withhold for study loans each pay using ATO schedules. Any over- or under-withholding is settled on your notice of assessment."),
  ("Can I pay extra?","Yes, you can make voluntary repayments to the ATO at any time. They count on top of your compulsory repayment.")],
 "2026–27 HECS-HELP repayment calculator using the ATO's new marginal rates: nil to $69,528, then 15% and 17%. See a worked example and your take-home pay.")
b,net,s=breakdown(85000,26,"Per fortnight")
P["au-super.html"]=page("au-super.html","Superannuation Calculator 2026–27 | 12% Super Guarantee · Paycheck Pocket","Australia · Super","Superannuation guarantee calculator","Work out the 12% super your employer must pay, and when it's due under Payday Super.",
 form("Annual",inp("Salary / qualifying earnings (A$)","85,000")+'<label>Super</label><div class=seg><span class=on>Paid on top</span><span>Included in package</span></div>'),
 f'<span class=plan-pill>Example result</span><h2 style="margin-top:10px">Super on $85,000</h2><div class=big>{f(s)}</div><p class=small style="margin-top:0">employer super per year · {f(s/26)} per fortnight</p><table><tr><th>Pay cycle</th><th class=n>Super guarantee (12%)</th></tr><tr><td>Per year</td><td class=n>{f(s)}</td></tr><tr><td>Per month</td><td class=n>{f(s/12)}</td></tr><tr><td>Per fortnight</td><td class=n>{f(s/26)}</td></tr><tr><td>Per week</td><td class=n>{f(s/52)}</td></tr></table><p class=small>Your take-home pay stays {f(net)} a year, because super is paid on top.</p>'
 +f'<p class=small>If $85,000 <em>includes</em> super: salary {f(85000/1.12)}, super {f(85000-85000/1.12)}.</p>',
 "<h2>Super guarantee in 2026–27</h2><p>The super guarantee rate is 12% for 2026–27 and stays at 12% from 1 July 2027 (ATO).</p><h2 style='margin-top:20px'>What Payday Super changes</h2><p>From 1 July 2026, employers must pay super for each payday instead of quarterly, calculated on <strong>qualifying earnings</strong>. Previously super could be paid up to 28 days after the end of each quarter.</p><h2 style='margin-top:20px'>Maximum contribution base</h2><p>From 2026–27 the maximum contribution base is an annual amount: <strong>$270,830</strong>. Once your qualifying earnings for the year reach it, your employer can stop paying the minimum super guarantee for that year.</p><p>Salary sacrifice and personal contributions count towards your concessional contributions cap. Check the ATO for the current cap before contributing extra.</p>",
 [("Is super 12% in 2026–27?","Yes. The ATO lists the general super guarantee at 12.00% for 1 July 2026 – 30 June 2027."),
  ("How often must my employer pay super now?","Under Payday Super, from 1 July 2026 super is due for each payday."),
  ("Does super reduce my take-home pay?","Not if it's paid on top of your salary, which is the usual arrangement. If your package includes super, your cash salary is the package divided by 1.12."),
  ("What if I earn more than $270,830?","Your employer doesn't have to pay super guarantee on qualifying earnings above the 2026–27 maximum contribution base of $270,830.")],
 "Calculate 12% superannuation guarantee for 2026–27, per pay and per year. Explains Payday Super from 1 July 2026 and the $270,830 maximum contribution base.")
for k,v in P.items(): open(k,'w').write(v)
