# Execution — P0 One-shot build

> Plan: `refdocs/plans/2026-11-11-p0-one-shot-build.md`. Build tasks 1–6 in one pass, top to bottom, **with no verification between tasks** (D-11). Task 7 is the only verification gate.
> If reality diverges from this doc, edit this doc (CLAUDE.md rule 4).

## Before starting

- Read `CLAUDE.md` hard constraints. Every displayed number comes from `engine/`.
- Library APIs (Vite proxy, Tailwind v4 setup, OpenRouter, Recharts) must be read from current docs (context7 MCP), not recalled.
- No API key is needed to build. `OPENROUTER_API_KEY` is optional at build time; the offline fallback must work without it.
- Commands run from the repo root using `npm --prefix app …`.

---

## Task 1 — Scaffold

- `npm create vite@latest app -- --template react-ts` (check `--help` if it prompts), then `npm --prefix app install`.
- Add: `tailwindcss` + `@tailwindcss/vite` (per current docs), `recharts`, dev `vitest`.
- `app/package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `test` (`vitest run`).
- `app/vite.config.ts`: `envDir: '..'`; `loadEnv(mode, path.resolve(__dirname, '..'), '')`; proxy `/api/llm` → `https://openrouter.ai`, rewrite to `/api/v1/chat/completions`, `changeOrigin: true`, inject headers `Authorization: Bearer ${env.OPENROUTER_API_KEY}`, `HTTP-Referer: http://localhost`, `X-Title: OnlyFinance`. `define: { __LLM_ENABLED__: JSON.stringify(Boolean(env.OPENROUTER_API_KEY)) }`. The key must **never** be referenced from `src/`.
- Move nothing else; `.env.example` stays at the repo root.

## Task 2 — Engine (`app/src/engine/`)

Conventions: S and F are **MYR per 1 USD**; rates are decimals; `t = days / basis` (basis 365 default, 360 option; one-year cases use t = 1). Every function returns its result **plus a `workings: Step[]`** (`{ label, formula, substituted, result }`), which feeds F23 and the AI. Export every public function from `engine/index.ts`.

| File | Functions (exact formulas) |
|---|---|
| `types.ts` | `Mode = 'importer' \| 'exporter'`, `DayBasis = 365 \| 360`, `Deal`, `Assumptions`, `Scenario`, `Step` |
| `tenor.ts` | `periodRate(annual, days, basis) = annual × days / basis` |
| `parity.ts` | `irpForward(S, iMY, iUS, days?, basis?) = S(1+iMY·t)/(1+iUS·t)` plus `premium = F/S − 1`; `pppExpected(S, πMY, πUS, years=1) = S·((1+πMY)/(1+πUS))^years`; `pppApprox = S(1+πMY−πUS)`; `fisherReal(i, π) = (1+i)/(1+π) − 1`, approx `i − π`; `fisherNominal(r, π) = (1+r)(1+π) − 1`, approx `r + π`; `ifeExpected` = same maths as IRP, labelled as an *expected spot*; `parityCheck(...)` returns F, E_PPP, r_MY, r_US, `ratio = F/E_PPP`, `realRatio = (1+r_MY)/(1+r_US)`, gap in RM for the deal amount and a verdict key (`forwardCheaper` \| `forwardDearer` \| `aligned` within 0.05%) |
| `arbitrage.ts` | `ciaCheck({S, Fquoted, iMY, iUS, spread=0})`: IRP F; if Fquoted < F_IRP → borrow USD, convert at S(1−spread), invest MYR, buy USD forward at Fquoted(1+spread); profit per USD = S(1−spread)(1+iMY)/(Fquoted(1+spread)) − (1+iUS); else the mirror route. `ciaCompare(...)` = workbook W5 CIA layout (home deposit vs foreign hedged route) |
| `budget.ts` | `importBudget(usd, rateOld, rateNew)` (workbook W6); `withSpread(rate, spread, side)`: buying USD → rate(1+spread), selling USD → rate(1−spread); `forecastViews(deal, a)` rows: spot, IRP forward, PPP, IFE, stress, user forecast → MYR amount (sign/label by mode) |
| `hedging.ts` | `forwardHedge(usd, F, spotT)` → hedged, unhedged, saving, effective rate; `optionHedge({usd, K, premium, spotT, type})`: call intrinsic = max(S−K, 0), put = max(K−S, 0), net = intrinsic − premium; importer effective = (min(S,K) + p)·usd; exporter (put) effective = (max(S,K) − p)·usd; `optionPayoffs(K, S, p)` (workbook sheet); `moneyMarketHedge(usd, S, iMY, iUS, days, basis, mode)`: importer: deposit USD = usd/(1+iUS·t), borrow MYR = that × S, repay = × (1+iMY·t); exporter: mirror; `hedgeComparison(deal, a, spotRange)` → series for unhedged/forward/option/money-market; `breakEvens(F, K, p)` → fwd vs unhedged = F; call vs unhedged = K + p; call vs fwd = F − p (importer) |
| `scenarios.ts` | `compareScenarios(A, B)` → per-output deltas + which inputs differ; `sensitivity(base, input, values[])` → series; `tornado(base, bumps)` with ±1pp on each rate and ±0.10 on spot → sorted impacts on the RM cost (forward and PPP views) |
| `presets.ts` | *Lecturer workbook* (S 4.20, i 3%/5%, π 3%/1%, USD 100k, forward 4.25, K 4.25, p 0.05, stress 4.40); *Baseline* (S 4.50, i 3%/4.5%, π 2%/3%, USD 100k, 365 days, stress 4.70); *Inflation shock* (Baseline, π_MY 4%); *Rate gap* (Baseline, i_US 5.5%); *Week 10* (S 4.50, i 4%/6%, π 4%/2%, USD 200k, forward 4.55, stress 4.70). All flagged `illustrative: true` |
| `limitations.ts` | Static text: PPP long-run, IRP ignores costs and capital controls, forecasts aren't predictions, implied ≠ bank-quoted forward, not financial advice |

## Task 3 — UI (`app/src/ui/`), functional styling only

One page. Left sidebar: mode toggle, deal inputs (USD amount, days, spot), assumptions (% inputs with units), day-basis toggle, spread input, preset buttons, the **"ILLUSTRATIVE — not market rates"** badge, slot switch A/B. Main tabs:

| Tab | Content |
|---|---|
| Budget | F8 forecast views table + bar chart; F17 mode wording; F20 spread effect; F27 limitations footer |
| Parity Check | F6 triangle (simple SVG), F1/F3/F4/F5 values, ratio = real-rate ratio, RM gap, verdict sentence; F7 approx/exact toggle |
| Scenarios | F11 A vs B side by side + deltas; F10 slider (choose an input) with a line chart; tornado bar chart |
| Hedging | F16 payoff chart (unhedged/forward/option/money-market vs future spot); F13/F14/F15 numbers; F12 break-even markers |
| Arbitrage | F2: quoted forward input → direction, steps, profit before/after spread |
| Verify | F24: table of workbook cases → engine value vs Excel value, ✓/✗ (reads the same oracle list as the test) |
| Practice | A5 (below) |

Every number has a "show workings" expander (F23) rendering `workings[]`. Tutor (A3) is a right-side drawer available on every tab; each result card has an **Explain** button (A1). F26 guided tour: 5-step overlay on the Baseline preset (deal → assumptions → budget → parity check → hedge).

## Task 4 — AI layer (`app/src/ai/`)

- `tools.ts`: registry `{ name, description, parameters (JSON schema), run(args) }` for every public engine function. Export `ENGINE_TOOL_NAMES`.
- `client.ts`: `chat(messages)` POSTs to `/api/llm` with `{ model: import.meta.env.VITE_OPENROUTER_MODEL, messages, tools }`; loops while the model returns `tool_calls`, running them locally through the registry and appending results (max 5 rounds). If `!__LLM_ENABLED__` or the fetch fails → `offline.ts`.
- `prompts.ts` system rules: you are a CLO3 tutor for non-finance SME users; **always call a tool for any figure**; you may also show your own working in a "Working:" section; state assumptions, direction and limits; label rates illustrative; never give financial advice; answer in the user's tone setting.
- `guard.ts` (A0, two-track): collect `known` = every numeric input and output of the tool calls in this turn, plus the scenario's inputs. Extract numbers from the reply (handle `RM`, `USD`, commas, `%`). A number is ✓ if some known value k matches with the number rounded to the decimals the AI showed: `|x − round(k, dp(x))| ≤ 0.5·10^(−dp(x))`, also trying k×100 for percentages. Otherwise ✗ and, if a known value lies within 5%, render it as a correction: ~~x~~ → **k ✓ verified**. Badge: "✓ n/m numbers verified". Years, days and step numbers (1–5) are ignored.
- `offline.ts`: template explanations built from engine results (same sentence patterns as A1), labelled "offline explanation (template)".
- A5 Practice: question generator picks a preset and a perturbation (e.g. π_MY +2pp), asks for direction (↑/↓) and a value; the engine computes the answer; scoring = direction correct + within 1%; the AI (or offline template) gets the question, the learner's answer, the engine answer and workings, and gives feedback.

## Task 5 — Wiring and copy

- Global state (React context or Zustand-free `useReducer`): scenario slots A/B, active tab, tone (student / SME owner).
- Default load: Baseline preset in slot A, Inflation shock in slot B.
- Footer: "Educational tool. Illustrative rates, not market data. Not financial advice." Sources link list (BNM, workbook, lectures).

## Task 6 — `app/src/verify.test.ts` (the single test file)

One `describe` per source; each `it` asserts engine output against the values below (rates to 1e-4, MYR to ±1). Also: registry coverage (every name exported from `engine/index.ts` that is a function appears in `ENGINE_TOOL_NAMES`), and the guard on two strings (one all-✓, one with a planted wrong number → ✗ with correction).

| Source | Inputs | Expected |
|---|---|---|
| Workbook W5 IRP | S 4.20, i 3%/5% | F 4.12; F−S −0.08; premium −0.0190476 |
| Workbook W5 CIA | USD 1,000,000; US 5%; UK 8%; spot 1.80 USD/GBP; fwd 1.78 | US 1,050,000; GBP 555,555.56; GBP 600,000; hedged USD 1,068,000; extra 18,000 (1.8%) |
| Workbook W5 PPP | S 4.20, π 3%/1% | approx change 0.02, approx 4.284; exact 4.283168; exact change 0.019802 |
| Workbook W5 Fisher | r 2%, π 3% | approx 5.00%; exact 5.06%; diff 0.0006 |
| Workbook W6 Import Budget | USD 100k; 4.20 → 4.40 | 420,000 → 440,000; +20,000; +4.7619% |
| Workbook W6 Forward Hedge | USD 100k; F 4.25; spot 4.50 | hedged 425,000; unhedged 450,000; saving 25,000; eff 4.25 |
| Workbook W6 USD Call | USD 100k; K 4.25; p 0.05; spot 4.40 | intrinsic 0.15; net 0.10/USD; gross 15,000; premium 5,000; net 10,000; effective 430,000; unhedged 440,000 |
| Workbook W6 Option Payoffs | K 4.25; spot 4.40; p 0.05 | call 0.15, put 0; call net 0.10; put net −0.05 |
| Week 10 slide 4 | S 4.50, i 4%/6% | F 4.4151 |
| Week 10 slide 6 | S 4.50, π 4%/2% | E 4.5882 |
| Week 10 slide 8 | r 3%, π 4% | approx 7.00%; exact 7.12% |
| Week 10 slide 11 | USD 200k; spot 4.50; forecast 4.70; forward 4.55 | 900,000; 940,000; 910,000; saving vs forecast 30,000 |
| Baseline | S 4.50, i 3%/4.5%, π 2%/3%, USD 100k | F 4.435406; premium −1.435%; PPP 4.456311 (approx 4.455); r_MY 0.9804%; r_US 1.4563%; RM spot 450,000 / fwd 443,541 / PPP 445,631 / stress 4.70 470,000 |
| Inflation shock | Baseline, π_MY 4% | PPP 4.5437; RM 454,369; F unchanged 4.4354; gap 10,828; r_MY −0.9615% |
| Rate gap | Baseline, i_US 5.5% | F 4.3934; RM 439,336 |
| Parity identity | the 4 data sets: Baseline; Inflation shock; Week 10 (4.50, 4%/6%, 4%/2%); Workbook (4.20, 3%/5%, 3%/1%) | F/E_PPP = (1+r_MY)/(1+r_US) = 0.995309; 0.976169; 0.962264; 0.961905 |
| CIA, quoted forward | Baseline, Fquoted 4.40 | +0.0084 USD per USD (0.008409); with 0.3% spread 0.0021 |
| Money-market hedge | Baseline importer, 365 days | USD deposit 95,693.78; MYR borrowed 430,622.01; repay 443,540.67 (= forward cost) |
| Tenor | Baseline, 90 days | F 4.4835 (ACT/365); 4.4833 (ACT/360) |
| Spread | S 4.50, 0.5%, buying USD 100k | 4.5225; +RM2,250 |
| Break-evens | F 4.25, K 4.25, p 0.05 | fwd vs unhedged 4.25; call vs unhedged 4.30; call vs forward 4.20 |
| Tornado (+1pp / +0.10) | Baseline | i_MY +4,306 (fwd); i_US −4,204 (fwd); π_MY +4,369 (PPP); π_US −4,285 (PPP); spot +0.10 ≈ +9,856 (fwd) / +9,903 (PPP) |

---

## Task 7 — End gate (the only verification)

1. `npm --prefix app run build` → exits 0.
2. `npm --prefix app test` → all cases in `verify.test.ts` pass. On failure, fix and re-run this gate only.
3. `npm --prefix app run dev` → open the app; Baseline shows the values above; the Verify tab is all ✓; the tutor answers with the offline fallback when no key is set.

---

## Wrap-up (do not skip)

- [ ] `refdocs/STATUS.md` — phase table + verification ledger (the three gate commands and their results)
- [ ] `refdocs/changelog/CHANGELOG.md` — session entry
- [ ] `refdocs/changelog/DECISIONS.md` — resolve the Vite-proxy and Tailwind assumptions
- [ ] This doc updated to match what actually happened
