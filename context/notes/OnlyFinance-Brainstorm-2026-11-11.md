# OnlyFinance: Deep Brainstorm (2026-11-11)

> Working notes from the project; figures are illustrative.

> Builds on `FinBridgeAI-Project-Notes.md` (the earlier session chose the **SME Import/Export Budget Coach** direction). This file sharpens it into a concept that scores, given one constraint from the user: **the marks come from the presentation, poster and finance output, not the app's engineering.** The app is a rapid prototype whose job is to make the analysis visible and demo-able.
>
> All rates are **illustrative**, not market rates. Every number below was recomputed by script on 2026-11-11.

---

## 1. Where the 100 marks actually are

| Criterion | Marks | What actually earns it | Where it is shown |
|---|---|---|---|
| Analysis & financial accuracy | **35** | Integrated (not three separate) treatment of interest, inflation and FX; verified numbers; direction, assumptions, limitations | Poster CLO3 panel, video 6:30–8:00, app "Why" screen |
| Real-world problem | 15 | One specific user with one specific pain | Video 0:00–3:00, poster top-left |
| Prototype & learning design | 15 | Clear input → formula → output → plain words; guided example; validated outputs | Video 3:00–6:30 demo |
| Marketability | 10 | Credible user, competitors, why us, adoption path | Video 8:00–9:15, poster |
| Poster & references | 10 | Readable, complete member info, traceable sources | Poster |
| Video | 10 | ~10 min, structured, every member speaks | Video |
| Integrity | 5 | AI-use disclosure, verification evidence, contributions | Report + poster footnote |

**Implication:** 70 of 100 marks (35 + 15 + 10 + 10) are decided by *how well the story and the numbers are told*. The prototype carries 15 directly and supports the 35. So: build the smallest app that shows the analysis beautifully and correctly, then put the hours into the story, the poster and the video.

---

## 2. The big idea: one equation that ties all three variables together

Most groups will show IRP, PPP and Fisher as **three separate calculators**. The rubric's top band asks for analysis that is "integrated … and insightful". There is a single identity that does exactly that:

> **IRP forward ÷ PPP expected spot = (1 + real rate Malaysia) ÷ (1 + real rate US)**

Derivation (exact, no approximation):

- IRP (interest): F = S × (1 + i_MY) / (1 + i_US)
- PPP (inflation): E(S) = S × (1 + π_MY) / (1 + π_US)
- Fisher: (1 + i) = (1 + r)(1 + π), so 1 + r = (1 + i)/(1 + π)
- Divide: F / E(S) = [(1 + i_MY)/(1 + π_MY)] / [(1 + i_US)/(1 + π_US)] = (1 + r_MY)/(1 + r_US)

Verified on four data sets (script, 2026-11-11):

| Data set | F (IRP) | E(S) (PPP) | F / E(S) | (1+r_MY)/(1+r_US) |
|---|---|---|---|---|
| Our notes baseline (S 4.50, i 3%/4.5%, π 2%/3%) | 4.4354 | 4.4563 | 0.995309 | 0.995309 ✓ |
| Notes, MY inflation raised to 4% | 4.4354 | 4.5437 | 0.976169 | 0.976169 ✓ |
| Week 10 study guide (S 4.50, i 4%/6%, π 4%/2%) | 4.4151 | 4.5882 | 0.962264 | 0.962264 ✓ |
| Lecturer's workbook (S 4.20, i 3%/5%, π 3%/1%) | 4.1200 | 4.2832 | 0.961905 | 0.961905 ✓ |

**What it means in plain words (the line for the video):**
> "Interest rates set the **price of certainty** (the forward you can lock today). Inflation sets the **expected price of waiting** (where PPP says the rate is heading). The gap between them is the **real-interest-rate gap**, and Fisher tells you where that comes from."

**Why this is the decision an SME owner actually faces:**

| If… | Then… | Importer reading |
|---|---|---|
| Real rates equal (r_MY = r_US) | F = E(S): International Fisher holds, parities agree | Hedging costs nothing *on expectation*; you are only buying certainty |
| r_MY < r_US (our baseline) | F < E(S): the forward is cheaper than the expected future spot | Forward looks attractive: locks a rate **below** where inflation says the rate is heading |
| r_MY > r_US | F > E(S) | Forward costs more than the expected spot; waiting is cheaper on expectation, but riskier |

This is the **"Parity Check"** screen: the app's signature feature and the poster's CLO3 centrepiece (a triangle with the three edges lit up, and the gap shown in RM).

> Careful wording: this is an **expectation under PPP**, not a prediction. PPP holds mainly in the long run; the stress case exists because reality deviates. Hedges buy certainty, not profit (Week 10, slide 15).

---

## 3. Problem and user (sharpened)

**Persona (synthetic, labelled as such):** *"Kopi Kita Sdn Bhd"*, a 6-staff Malaysian café roaster that imports green coffee beans priced in USD, paid 90 days after shipment. The owner (no finance background) budgets in ringgit and got burned when the RM weakened between order and payment.

Why this persona:
- The group already researched ZUS Coffee in Week 1 (they import beans, expanded regionally). That is free domain knowledge and a natural hook, but **do not claim ZUS uses the app** and do not use ZUS branding.
- Coffee beans trade in USD, a real and easy-to-grasp exposure.
- Micro and small firms dominate Malaysian MSMEs (70.1% micro, 2024 DOSM via OECD; see notes §5), so "no treasury team" is the norm (label as inference).

**Problem statement (draft):**
> Malaysian micro and small importers pay suppliers in USD but plan in ringgit. Owners without finance training cannot tell whether the RM will weaken, why interest and inflation matter, or whether a bank forward is worth it, so budgets overrun. OnlyFinance turns three numbers they can look up (interest rates, inflation, today's rate) into a ringgit budget with a plain-language "why".

**Secondary mode (cheap to add):** Exporter toggle. The same formulas, but a weaker RM becomes a gain, and the decision is "convert now vs hold USD" (BNM repatriation within 6 months; notes §7.2).

---

## 4. Name and tagline

"OnlyFinance" is memorable, and the pun will get noticed. With a lecturer audience, let the tagline steer the reading toward "the only finance you need":

- **"OnlyFinance: only the finance you need before you pay in dollars."**
- "OnlyFinance: your ringgit, explained."
- "OnlyFinance: three numbers, one ringgit budget."

Submission filenames still follow the brief: `GroupXX_FinBridgeAI_Poster.pdf`, `GroupXX_FinBridgeAI_Video.mp4`.

---

## 5. The prototype: smallest thing that demos the whole story

### Screens (one page, top to bottom, or four tabs)

| # | Screen | Shows | Rubric hook |
|---|---|---|---|
| 1 | **Your deal** | Importer/exporter toggle, USD amount, days to payment, today's spot | Specific user (15) |
| 2 | **Assumptions** | i_MY, i_US, π_MY, π_US with units and an "ILLUSTRATIVE, not market rates" badge; preset buttons: *Lecturer example*, *Baseline*, *Inflation shock*, *Rate gap* | Transparency (35) |
| 3 | **Your ringgit budget** | Table + bar chart: spot / IRP forward / PPP expected / stress case, in RM; budget-buffer line | The output the user came for |
| 4 | **Parity Check** (signature) | Triangle diagram; real rates via Fisher; F vs E(S) gap in RM; the plain-language verdict from §2 | Integrated analysis (35) |
| 5 | **Show workings** | Every formula → substitution → result, exact and approximate | Verifiable (35, 15) |
| 6 | **What-if slider** | Drag MY inflation (or the rate gap); the RM cost line moves; Scenario A vs B side by side | Sensitivity requirement |
| 7 | **Guided tour** | 5-step walkthrough using the Kopi Kita story | Learning value (15) |
| 8 | **Limitations** | PPP long-run, IRP ignores costs and controls, forecasts are not predictions, not financial advice | Limitations (35) |
| 9 | **Verified against the course workbook** | Table: app output vs lecturer's Excel cell, with ticks | Accuracy (35) + integrity (5) |

### Tenor
Invoices are 90 days, not one year. Scale rates by a stated convention: **(1 + i × days/360)** for money-market rates (state it; ACT/365 for MYR is also defensible, so pick one and say so). The workbook is one-year; run the verification panel at 365 days to match it exactly.

### Verification panel test cases (from the lecturer's own workbook, so marking cannot dispute them)

| Workbook sheet | Inputs | Expected output |
|---|---|---|
| W5 IRP | S 4.20, i_MY 3%, i_US 5% | F = 4.1200; forward discount −1.905% |
| W5 PPP | S 4.20, π_MY 3%, π_US 1% | exact 4.2832 (approx 4.284) |
| W5 Fisher | r 2%, π 3% | exact 5.06% (approx 5.00%) |
| W6 Import Budget | USD 100,000 at 4.20 vs 4.40 | RM420,000 → RM440,000 (+RM20,000, +4.76%) |
| W6 Forward Hedge | forward 4.25, spot 4.50 | hedged RM425,000; saving RM25,000 |
| W6 USD Call (extension) | strike 4.25, premium 0.05, spot 4.40 | effective RM430,000 vs unhedged RM440,000 |

### AI: where it goes and where it doesn't
The brief says "AI-enabled **or** digitally interactive", so AI is optional. Options, in order of risk:
1. **No live AI.** Template explanations generated from the numbers ("Because Malaysian inflation (4%) is above US inflation (3%), PPP expects the ringgit to weaken by about 0.97%…"). Zero risk, fully verifiable. AI is used only in development, and disclosed.
2. **AI explains, engine calculates.** An "Explain like I run a café" button sends the *already computed* numbers to an LLM for rewording, with a visible note: "numbers from the engine, wording by AI". Adds the "AI" word to the pitch; needs an API key and a fallback.
3. AI computing numbers: **never** (the brief warns about exactly this).

### Cut list (move to the "Future improvements" slide, don't build)
Multi-country / Regulator Tally, landed cost (duty/SST), Incoterms, live rate feeds, BM toggle, PDF export, login. Each one is one sentence on the poster's roadmap and shows ambition without risk.

---

## 6. Scenario set (meets "≥2 scenarios + 1 sensitivity")

Invoice USD 100,000, one-year horizon for clean numbers (show the 90-day version in the app too).

| Scenario | Inputs | F (IRP) | E(S) (PPP) | Real rates MY / US | RM at F | RM at PPP | Story |
|---|---|---|---|---|---|---|---|
| A. Baseline | S 4.50; i 3% / 4.5%; π 2% / 3% | 4.4354 | 4.4563 | 0.98% / 1.46% | 443,541 | 445,631 | Parities roughly agree; forward slightly cheaper |
| B. MY inflation shock | π_MY 2% → 4% | 4.4354 | 4.5437 | −0.96% / 1.46% | 443,541 | 454,369 | Inflation pushes the expected rate up, but the forward doesn't move (interest unchanged) → gap widens to RM10,828: the case for hedging |
| C. Rate gap widens | i_US 4.5% → 5.5% | 4.3934 | 4.4563 | 0.98% / 2.43% | 439,336 | 445,631 | Higher US rate cheapens the forward |
| Stress | S at payment 4.70 | n/a | n/a | n/a | 470,000 | n/a | Budget buffer: +RM20,000 over today's spot |

B is the strongest teaching moment: **change one input (inflation) and see which outputs move and which don't**. That *is* CLO3.

> B's real rate for Malaysia goes negative (−0.96%). Say so: negative real rates happen when inflation outruns nominal rates, and Fisher says nominal rates should eventually rise. That is a natural "next scenario" line for the video.

---

## 7. Marketability (10 marks): honest version

| Element | Content |
|---|---|
| Target users | Owners and admin/finance staff at Malaysian micro and small importers/exporters; secondary: non-finance university students (it doubles as a teaching tool) |
| Value | Bank-neutral, free, explains **why**, not just "what rate"; turns three public numbers into an RM budget and a hedge-or-wait insight |
| Competitors | Bank FX desks and trade specialists (UOB etc.: execution-focused, need a relationship); fintech multi-currency accounts (WorldFirst, Wise, XTransfer: execution and transfers, not explanation); generic currency converters (today's rate only, no forecast logic); spreadsheets (need finance knowledge) |
| Differentiation | Only tool here that shows the interest–inflation–FX chain with worked formulas and a plain-language verdict |
| Adoption path | Pilot via SME workshops (SME Corp / MATRADE export-readiness sessions); university entrepreneurship centres; free tier, then a bank-partner or premium "multi-invoice" tier. Label as **proposed**, not validated |
| Feasibility | Static web app, no backend, no user data stored, near-zero hosting cost |

Do **not** invent user-testing results or market-size numbers beyond the cited SME statistics (brief §9).

---

## 8. Video plan (10:00 target, 5 speakers)

| Time | Segment | Speaker (suggested) | On screen |
|---|---|---|---|
| 0:00–1:30 | Hook: Kopi Kita's RM20,000 surprise; who we are | Member 1 | Story slide, persona |
| 1:30–3:00 | Problem, target users, objectives, SME evidence | Member 2 | Stats with citations |
| 3:00–6:30 | Live demo: Scenario A → B (slider) → C; show workings; verification panel | Members 3 and 4 (split) | App screen recording |
| 6:30–8:00 | CLO3: the Parity Triangle and the one equation; assumptions and limits | Member 5 | Triangle animation |
| 8:00–9:15 | Market: users, competitors, why us, adoption | Member 1 or 2 | Comparison table |
| 9:15–10:00 | Limitations, future work, credits, AI-use disclosure | All | Credits slide |

Record the demo once, cleanly, with the preset buttons so nobody types numbers live.

---

## 9. Poster layout (A3 landscape)

```
┌──────────────────────────────────────────────────────────────────────┐
│ OnlyFinance  · tagline · GFB3043/GEB3043 · Group XX · 5 members+IDs  │
├────────────────┬──────────────────────────────┬──────────────────────┤
│ 1 Problem      │ 3 CLO3: the Parity Triangle  │ 5 Prototype          │
│  Kopi Kita     │   (big diagram, 3 edges)     │  2–3 screenshots     │
│  SME evidence  │   F ÷ E(S) = (1+r_MY)/(1+r_US)│  workflow arrows     │
│ 2 Users &      │ 4 Worked scenarios A/B/C     │ 6 Market & roadmap   │
│  objectives    │   table + one bar chart      │  competitor table    │
├────────────────┴──────────────────────────────┴──────────────────────┤
│ Findings · Learning benefits · Limitations · References · AI-use note │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Timeline (deadline Mon 16 Nov 23:59; IFM test the same day, 4–6pm)

| Day | Goal |
|---|---|
| Wed 11 Nov (tonight's meeting) | Lock concept, persona, roles; finalise scenario numbers |
| Thu 12 Nov | Prototype core (screens 1–5, 9) + poster draft + script draft |
| Fri 13 Nov | Prototype polish (slider, guided tour, limitations); poster v2; references checked |
| Sat 14 Nov | Record demo + voice segments; rehearse |
| Sun 15 Nov | Edit video; final poster PDF; **group leader submits Sunday night** |
| Mon 16 Nov | Buffer only (test 4–6pm). Do not plan to submit on test day |

---

## 11. Decisions

**Made by the user on 2026-11-11 (after this brainstorm):**
1. **Stack: React + Vite.**
2. **AI: "AI explains, engine calculates".** The user will supply an LLM API key. The engine stays rule-based; the LLM only rewords numbers the engine already computed.
3. **Persona: generic Malaysian SME importer/exporter for now.** The storyline (e.g. the Kopi Kita café idea in §3) is to be discussed later by the group. Focus now is app development.

**Still open:**
4. Group number, group leader, each member's programme (IT/IS/CS), and who speaks which segment.
5. Day-count convention for tenors (ACT/360 vs ACT/365).
6. Exporter mode: in or out of the MVP.
7. Which LLM provider/model the API key is for.
