# OnlyFinance — Product Requirements Document (PRD)

> OnlyFinance is a localhost web app (React + Vite + TypeScript) built for the GFB3043/GEB3043 FinBridge AI Innovation Challenge. It helps non-finance Malaysian SME importers and exporters understand and apply how **interest rates, inflation and exchange-rate movement** relate (CLO3), by turning a USD invoice and a handful of assumptions into a ringgit budget, hedge comparisons and a plain-language "why". A rule-based TypeScript engine computes every number; an AI layer (OpenRouter) tutors, drafts its own working, and gives feedback, and every number the AI writes is checked against the engine before it is shown. The app is a rapid prototype: marks come from the poster, the video and the correctness of the finance output, not from engineering depth.

- **Owner:** Group 3, UTP
- **Users:** demo audience (lecturer) and, as the product story, non-finance Malaysian SME owners/staff who import or export in USD. Single local user, no login.
- **Status:** Scaffolded 2026-11-11 — pre-implementation
- **Last updated:** 2026-11-11
- **Source of record:** [onlyfinance-sources.md](onlyfinance-sources.md)
- **Founding context:**
  - **Controlling document:** `context/brief/Project-Guidelines-FinBridge-AI.pdf` (text copy `.md` alongside; local only, not in the public repo). Where anything here conflicts with the brief, the brief wins.
  - `context/notes/OnlyFinance-Brainstorm-2026-11-11.md` (concept, parity identity, scenarios, video/poster plan)
  - `context/notes/FinBridgeAI-Project-Notes.md` (earlier session: direction choice, SME evidence, BNM/MOF research, verified worked example)
  - `context/workbook/W05-06-Excel-Calculation-Workbook.md` (lecturer's calculation model, which is the test oracle; local only, not in the public repo)
  - `context/lectures/W05-06-…md` and `context/lectures/W10-…md` (formulas and worked examples as taught; local only, not in the public repo)

---

## 1. Context & Hard Constraints

These are confirmed from the brief, the user's answers in the 2026-11-11 session, and the workbook.

| Constraint | Value | Consequence |
|---|---|---|
| Controlling brief | FinBridge AI Project Guidelines (UTP, Sep 2026) | Every feature must trace to a brief requirement or a confirmed user choice |
| Deadline | Mon 2026-11-16, before 23:59 MYT; IFM test the same day 4–6pm | Build must finish by Sat 2026-11-14 so Sun can go to video/poster; submit Sun night |
| What is marked | Poster, video, finance accuracy (35/100), not the code | Optimise for a clear, correct, demo-able app; no engineering for its own sake |
| Finance model required | Brief §1: "a generic chatbot … without a correct finance model will not satisfy the brief" | A real calculation engine exists and is tested |
| AI output must be verified | Brief §4: "Check AI-generated answers against independently verified calculations" | Two-track compute + number guard (D-03) |
| Three variables, explicitly | Brief §2: interest, inflation, FX, with direction, assumptions, limitations | Parity Check screen (F6) and a limitations panel (F27) |
| ≥2 scenarios + 1 sensitivity | Brief §2 | Scenario A/B and presets (F11), sensitivity slider + tornado (F10) |
| Illustrative data only | Brief §2, §9: label hypothetical rates, never claim market rates; synthetic data only | Every rate input carries an "ILLUSTRATIVE, not market rates" badge; no live feeds; no real company or personal data sent to the LLM |
| Runs on localhost only | User, 2026-11-11 | No deploy, no hosting; the demo is screen-recorded |
| LLM provider | OpenRouter; key supplied later by the user | Key read server-side by the Vite dev proxy; app must still run (engine-only) with no key |
| Quoting convention | MYR per 1 USD (higher = weaker ringgit); rates entered as decimals internally | Matches the workbook and lectures; UI shows % but engine takes decimals |
| Course reference model | Lecturer's W05-06 workbook | Engine outputs must equal the workbook's cached values (tests) |

---

## 2. Product Principles

1. **The engine is the source of truth.** Every headline number on screen comes from tested engine code. The AI may draft working, but its numbers are checked and corrected before display.
2. **Show the working.** Every output can expand to formula → substitution → result. If a lecturer can't verify it by hand, it isn't finished.
3. **Integrated, not three calculators.** The signature view ties interest, inflation and FX together (F6: forward ÷ PPP = (1+r_MY)/(1+r_US)).
4. **Honest about limits.** Illustrative rates are labelled; PPP is long-run; IRP ignores costs and capital controls; forecasts are not predictions; nothing is financial advice.
5. **Demo-first.** Presets make every video scenario one click; nothing in the demo depends on typing numbers live or on the network.

---

## 3. Architecture

```
Browser (React UI)
  ├─ engine/ (pure TS)  ──► numbers + workings     ◄── single source of truth
  ├─ ai/ client ──► POST /api/llm (same origin)
  │                     │  Vite dev-server proxy adds Authorization header
  │                     ▼  from OPENROUTER_API_KEY (server-side env, never bundled)
  │                OpenRouter chat/completions (tool calling)
  │                     │  tool calls are executed IN THE BROWSER by engine/
  │                     ▼
  └─ ai/guard  ── compares every number in AI text with engine results → ✓ / ✗ + correction
```

### 3.1 Components

| Component | Responsibility | Notes |
|---|---|---|
| `app/src/engine/` | Pure functions: parity, arbitrage, hedging, budget/business, scenarios/sensitivity, tenor, workings strings, presets | No React, no I/O |
| `app/src/verify.test.ts` | The single end-of-build test: reference cases from the workbook, Week 10 guide and the 2026-11-11 script, plus registry coverage | Tolerance 1e-4 on rates, RM1 on amounts. Run once at the end (D-11) |
| `app/src/ai/tools.ts` | Registry mapping engine functions to JSON-schema tools for the LLM | The coverage check in `verify.test.ts` asserts every exported engine function is registered (invariant, see preflight Q5) |
| `app/src/ai/client.ts` | OpenRouter chat call via `/api/llm`, tool-call loop, offline fallback | Model id from env (ASSUMED until the user picks) |
| `app/src/ai/guard.ts` | Number guard (A0): extract numbers from AI text, match against engine outputs within tolerance, mark ✓/✗, substitute verified values | Runs on every AI reply |
| `app/src/ui/` | Screens listed in §4 | Tailwind CSS; Recharts for charts |
| `app/vite.config.ts` | Dev server + `/api/llm` proxy that injects the key | `envDir` = repo root |

### 3.2 Data & state

No backend, no database, no persistence beyond the browser session (optionally `localStorage` for the last scenario). State: one `Deal` (mode, USD amounts, tenor, spot) + one `Assumptions` set (i_MY, i_US, π_MY, π_US, spreads, stress spot, user forecast, quoted forward, option strike/premium) per scenario slot (A, B). Presets are static data in `engine/presets.ts`.

---

## 4. Modules / Feature Areas

Scope confirmed by the user on 2026-11-11: **3 best features per FX group + 3 AI features** (plus A1 as a bonus and the brief-mandated items marked ★). IDs match `context/notes/` and the session catalogue.

### 4.1 Parity engine (CLO3 core)
| ID | Feature | Includes |
|---|---|---|
| F6 | **Parity Check** (signature): forward ÷ PPP = (1+r_MY)/(1+r_US); verdict in RM | F1 IRP forward (+ premium/discount %), F3 relative PPP (exact + approx), F4 Fisher real rates, F5 International Fisher Effect |
| F2 | Covered interest arbitrage check: quoted forward vs IRP, direction and profit before/after spreads | |
| F7 | Approximate vs exact toggle (PPP, Fisher) | |

### 4.2 Forecasting & scenarios
| ID | Feature |
|---|---|
| F11 | Scenario A vs B side by side + presets (*Lecturer workbook*, *Baseline*, *Inflation shock*, *Rate gap*, *Week 10 example*) |
| F10 | Sensitivity slider + tornado chart (which input moves the RM cost most) |
| F8 | Forecast views table: MYR cost at spot, IRP forward, PPP, IFE, stress, user forecast |

### 4.3 Hedging
| ID | Feature | Includes |
|---|---|---|
| F16 | Hedge comparison payoff chart across future spots | F13 forward hedge, F14 option hedge (USD call for importer, USD put for exporter) |
| F15 | Money-market hedge (equals the forward under IRP) | |
| F12 | Break-even rates between strategies | |

### 4.4 Business realism
| ID | Feature |
|---|---|
| F17 | Importer/exporter mode (direction of exposure; exporter "convert now vs hold"; 6-month repatriation note) |
| F19 | Tenor & day-count (30–360 days; ACT/365 default, ACT/360 toggle) |
| F20 | Bank spread and fees on conversion |

### 4.5 Trust & learning
| ID | Feature |
|---|---|
| F24 | Verified against the lecturer's workbook (panel of reference cases with ✓) |
| F23 | Show workings for every output |
| F26 | Guided tour (5 steps on a preset) |
| F27 ★ | Limitations panel: brief §2 requires "direction, assumptions and limitations"; not a feature pick, a requirement |
| — ★ | "ILLUSTRATIVE, not market rates" labelling on all rate inputs (brief §2, §9) |

### 4.6 AI layer (OpenRouter)
| ID | Feature |
|---|---|
| A3 | **AI tutor chat with tools**: the AI chooses and calls engine functions, drafts its own working, explains |
| A0 | **Number guard** (always on): every AI number checked against engine output; ✗ values struck through and replaced by the verified value; "✓ n/n numbers verified" badge |
| A5 | **Practice mode with AI feedback**: learner predicts first (the workbook's "predict, then compare" task); engine marks; AI explains the error |
| A1 | *Bonus:* "Explain my result" button on each result (reuses A3's prompt) |
| — | Offline fallback: canned replies for the preset scenarios when no key or no network, so the demo recording never depends on the API (ASSUMED useful; see §8) |

---

## 5. Non-Goals

Explicitly out of scope. Revisit only by adding an ADR that says why.

- Deployment or hosting of any kind (localhost only, D-04).
- Live market-rate feeds, or presenting any rate as current.
- The AI computing a number that is displayed without engine verification.
- User accounts, persistence across devices, a backend database.
- Multi-country mode / Regulator Tally, landed cost (duty, SST), Incoterms (roadmap slide only).
- Features not picked in the 2026-11-11 scope: F9 multi-year PPP path, F18 net exposure, F21 budget buffer, F22 borrowing comparison, F25 cause-effect chain, F28 glossary, F29 export; A2, A4, A6, A7, A8. (Each can return via an ADR.)
- Financial advice. Every decision view carries a "not financial advice" note.

---

## 6. Build Roadmap

Working mode (user, 2026-11-11): **build everything in one shot, test once at the end, polish UI later** (D-11). There are no per-task microtests; the single end-of-build check is the verification gate.

| Phase | Scope | Exit criteria |
|---|---|---|
| P0 — One-shot build (Thu 2026-11-12) | Everything in §4 in one pass: `app/` scaffold (Vite + React + TS, Tailwind, Recharts, Vitest); full engine (F1–F8, F10–F17, F19, F20, F23 workings, presets); all screens functional (plain styling is fine); AI layer (`/api/llm` proxy, tool loop, A3 tutor, A0 guard + two-track display, A1, A5, offline fallback); verification panel (F24), limitations (F27), guided tour (F26) | **One end-of-build check:** `npm run build` passes, then `npm test` runs a single `verify.test.ts` (all workbook sheets, Week 10 cases, parity identity, 90-day tenor, registry coverage) and passes; `npm run dev` loads with the Baseline preset showing the test values |
| P1 — UI clean-up (Fri 2026-11-13) | Layout, visual hierarchy, chart styling, responsive tweaks, copy; no finance logic changes | App looks presentation-ready; re-run the end check once |
| P2 — Demo & evidence (Sat 2026-11-14) | Demo presets for the video script; poster screenshots; calculation-evidence table for the report; AI-use disclosure notes | Screenshots saved; one full demo run-through recorded |

---

## 7. Decision Log

Canonical one-line list. Load-bearing entries are expanded as ADRs in `changelog/DECISIONS.md` under the same id.

| # | Decision | Why |
|---|---|---|
| D-01 | Direction: SME Import/Export Budget Coach; generic Malaysian SME importer/exporter persona; storyline decided later by the group | Strongest real-world problem and marketability case (notes §3.3); user wants app focus now |
| D-02 | React + Vite + TypeScript; app lives in `app/` | User chose React + Vite; TS catches unit/shape errors in finance code; `app/` keeps context and docs separate |
| D-03 | Two-track compute: engine is the source of truth; the AI calls engine tools **and** drafts its own working, and the number guard verifies every AI number | User chose "a mix of 1 and 2"; brief §4 demands verification of AI answers |
| D-04 | Localhost only; OpenRouter called via a Vite dev-server proxy that injects `OPENROUTER_API_KEY` server-side; env files at repo root | User: no deploy, OpenRouter; keeps the key out of the browser bundle without a separate server |
| D-05 | Scope = 3 best per FX group (15) + A0, A3, A5 (+A1 bonus) + brief-mandated F27 and illustrative labelling | User, 2026-11-11 |
| D-06 | Quote MYR per 1 USD; rates as decimals; exact formulas primary, approximations shown alongside | Matches the workbook and lectures |
| D-07 | Day-count default ACT/365, ACT/360 selectable; one-year cases use t = 1 | Ringgit money-market convention is ACT/365; difference is tiny (4.4835 vs 4.4833 at 90 days) but stating it shows rigour |
| D-08 | The lecturer's W05-06 workbook is the test oracle | The marker can't dispute their own numbers; satisfies "validated outputs" |
| D-09 | npm, Tailwind CSS, Recharts, Vitest | Fastest common path; npm already installed; Recharts covers line/bar/payoff charts |
| D-10 | Lean ops: 1 subagent (test-runner on Haiku), secret-guard hook; the engine↔tools invariant is enforced by a check inside the single end-of-build test, not a hook | Rapid prototype, token-saving; a test runs without the harness |
| D-11 | One-shot build, single verification run at the end, UI clean-up as a later phase; one plan/execution pair | User, 2026-11-11: save time and tokens; marks come from output, not process |
| D-12 | Primary LLM `nvidia/nemotron-3-ultra-550b-a55b:free`, fallback `nvidia/nemotron-3.5-lightning:free`, sent as OpenRouter `models` fallback list | Live test 2026-11-12: Ultra got all hedging directions right on 3 demo questions and obeyed the prompt; Lightning added one wrong direction sentence |
| D-13 | Direction statements come from code-generated facts (`app/src/ai/facts.ts`); the AI must take every direction statement from them. The number guard covers numbers, facts cover directions | Lightning's wrong direction sentence showed that the number guard alone does not catch direction errors |
| D-14 | Light is the default theme. Dark mode uses semantic CSS tokens with a `dark` class variant. Print is always light | Tokens keep one component set for both themes; a light default suits the printed poster and report; print must not inherit dark colours |
| D-15 | Presets are presented as a Scenario selector with a Custom state. The lecturer workbook preset is hidden from the UI but kept for verification | Students see the three teaching cases without the workbook's raw inputs; the workbook stays as the oracle in `verify.test.ts` (D-08) |

---

## 8. Open Questions

Unresolved. Anything marked `ASSUMED:` is a working assumption, not a confirmed fact — it may be wrong, and it must be confirmed before anything load-bearing is built on it.

1. **OpenRouter model id.** ASSUMED: a tool-calling-capable model chosen by the user; stored in `OPENROUTER_MODEL`. Needed before P4.
2. **Vite proxy header injection.** ASSUMED: `server.proxy` with a `headers` option (or `configure` hook) can add `Authorization` per request. Verify against the Vite docs at the start of P4.
3. **Offline fallback.** ASSUMED useful so the recording doesn't depend on the network. Confirm with the user.
4. **Storyline / persona** (e.g. the Kopi Kita café idea in the brainstorm §3). Group decides later; app uses generic SME wording until then.
5. **Poster details:** group number, group leader, each member's programme (IT/IS/CS), speaking roles. Not an app blocker.
6. **ASSUMED:** npm, Tailwind CSS, Recharts and Vitest are acceptable (D-09, Claude's call).
7. **ASSUMED:** ACT/365 default (D-07, Claude's call).
8. **ASSUMED:** personal data (member IDs, private messages) is kept out of git.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| S | Spot rate, MYR per 1 USD |
| F | Forward rate, MYR per 1 USD for delivery at the tenor |
| i_MY, i_US | Nominal annual interest rates (decimals) |
| π_MY, π_US | Expected annual inflation (decimals) |
| r | Real interest rate: (1+i)/(1+π) − 1 (exact Fisher) |
| IRP / CIRP | (Covered) interest rate parity: F = S(1+i_MY)/(1+i_US) |
| PPP | Relative purchasing power parity: E(S₁) = S(1+π_MY)/(1+π_US) |
| IFE | International Fisher Effect: expected spot from the interest differential (same formula as IRP, different meaning: expectation, not a contract) |
| CIA | Covered interest arbitrage |
| Parity Check | F ÷ E_PPP(S) = (1+r_MY)/(1+r_US); the gap between the forward and the PPP forecast is the real-rate gap |
| Number guard | Check of every number in AI text against engine outputs |
| Two-track compute | AI drafts working; engine computes independently; guard reconciles |
| Tenor | Days until payment; annual rates scaled by days/basis |
