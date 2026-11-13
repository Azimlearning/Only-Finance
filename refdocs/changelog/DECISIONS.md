# Architectural Decisions — OnlyFinance

> Record decisions here so they aren't re-debated in future sessions.
> Format: **Decision** → **Why** → **Trade-offs / what was rejected**.
> Canonical one-line list lives in `refdocs/onlyfinance-PRD.md` §7; this file expands the load-bearing ones under the same id.

An ADR is worth writing when the decision (a) is expensive to reverse, (b) will look arbitrary to a future reader, or (c) had a real alternative someone will propose again. Everything else is just a commit message.

---

## D-01 — SME Import/Export Budget Coach, generic SME persona (2026-11-11)
**Decision:** Build the "SME Import/Export Budget Coach" direction from the brief, for a generic Malaysian SME importer/exporter paying or receiving USD. The storyline/persona is left to the group.
**Why:** The earlier session ranked it strongest on real-world problem (15) and marketability (10) with equal accuracy potential (`context/notes/FinBridgeAI-Project-Notes.md` §3.3). The user asked to focus on the app now and discuss the story later.
**Rejected:** International Finance Decision Assistant (more academic, weaker market case); pure learning simulator (weaker problem statement).

## D-02 — React + Vite + TypeScript in `app/` (2026-11-11)
**Decision:** React + Vite (user's choice) with TypeScript; the app lives in `app/`.
**Why:** TS types catch unit and shape mistakes (percent vs decimal, MYR vs USD) in finance code. `app/` avoids `create-vite` prompting over a non-empty root and keeps `context/` and `refdocs/` separate.
**Rejected:** Single HTML file and Streamlit (offered; user chose React + Vite). Plain JS (no type safety for the engine).

## D-03 — Two-track compute with a number guard (2026-11-11)
**Decision:** The rule-based engine is the source of truth for every displayed number. The AI both (1) calls engine functions as tools and (2) drafts its own step-by-step working. The number guard (A0) extracts every number from AI text, matches it against engine results within tolerance, marks ✓/✗, and shows any ✗ value struck through next to the verified value. Headline results are always engine values.
**Why:** The user chose "a mix of" AI-calls-engine and AI-computes-engine-checks. Brief §4: "Check AI-generated answers against independently verified calculations." Brief §1 rejects a chatbot without a correct finance model. Making the check visible turns a compliance requirement into a demo moment.
**Rejected:** AI-only computation (no independent check, so it fails brief §1/§4 and risks the 35 accuracy marks). Engine-only with no AI working (user wanted AI to visibly compute).
**Trade-off:** The guard must handle rounding and formatting (4.4354 vs 4.435406, "RM443,541" vs 443540.67); tolerance rules live in `ai/guard.ts` and are tested.

## D-04 — Localhost only; OpenRouter via Vite dev proxy (2026-11-11)
**Decision:** No deployment. The browser calls same-origin `/api/llm`; the Vite dev server proxies it to OpenRouter and adds `Authorization: Bearer $OPENROUTER_API_KEY` server-side. The key has **no** `VITE_` prefix, so Vite never inlines it into client code. Env files live at the repo root (`envDir: '..'`).
**Why:** User: localhost only, OpenRouter. Any `VITE_*` variable is bundled into public JS; the proxy keeps the key out of the browser with no extra server process.
**Rejected:** `VITE_OPENROUTER_API_KEY` in the client (exposes the key in devtools and screen recordings). A separate Express server (one more process to run). Vercel functions (no deploy).

## D-05 — Scope: 3 per FX group + 3 AI (2026-11-11)
**Decision:** Parity F6 (incl. F1, F3, F4, F5), F2, F7 · Forecasting F11, F10, F8 · Hedging F16 (incl. F13, F14), F15, F12 · Business F17, F19, F20 · Trust F24, F23, F26 · AI A3, A0, A5, plus A1 as a bonus. Also brief-mandated: F27 limitations panel and illustrative-rate labelling.
**Why:** User picked "3 per FX group + 3 AI" and said not to weigh time or effort.
**Rejected (for now):** F9, F18, F21, F22, F25, F28, F29; A2, A4, A6, A7, A8. Any can return with a new ADR.

## D-07 — Day-count ACT/365 default (2026-11-11)
**Decision:** Scale annual rates by days/365 by default; offer ACT/360. One-year cases use t = 1 exactly, matching the workbook.
**Why:** Ringgit money-market convention; the brief asks for correct units. 90-day IRP forward: 4.4835 (ACT/365) vs 4.4833 (ACT/360).
**Rejected:** Silently using one convention without saying which.

## D-08 — Lecturer workbook is the test oracle (2026-11-11)
**Decision:** Every workbook sheet's cached values become Vitest cases; the app's verification panel (F24) shows the same cases with ✓.
**Why:** The marker cannot dispute their own numbers, and the brief rewards "validated outputs".

## D-10 — Lean ops; invariant enforced inside the end-of-build test (2026-11-11)
**Decision:** One subagent (`test-runner`, Haiku) and the secret-guard hook. Every exported engine function must have a workings template and an AI tool-registry entry; a coverage check inside the single `verify.test.ts` fails if one is missing.
**Why:** The A3 tutor can only reach what the registry exposes, and the guard can only verify numbers the engine produced, so an unregistered function silently becomes "AI-only" maths. A test runs anywhere; a hook only runs inside Claude Code.
**Rejected:** doc-keeper subagent (the `/session-end` command covers it, saving per-session context).

## D-11 — One-shot build, test once at the end, polish later (2026-11-11)
**Decision:** Build the whole of PRD §4 in a single pass from one execution doc. No per-task verify steps or microtests. One verification gate at the end: `npm run build`, then `npm test` (a single `verify.test.ts`), then a manual load of the Baseline preset. UI clean-up is a separate later phase (P1) that must not change finance logic.
**Why:** User instruction, to save time and tokens; the marks come from the poster, video and finance output.
**Trade-off:** A bug found at the end may have spread across files. Mitigated by keeping the engine pure and in one folder, and by the end test covering every workbook sheet.

## D-12 — Primary LLM Ultra, fallback Lightning, via OpenRouter `models` fallback (2026-11-12)
**Decision:** `VITE_OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free` (primary) and `VITE_OPENROUTER_FALLBACK_MODEL=nvidia/nemotron-3.5-lightning:free` (fallback). The request sends `model` plus `models: [primary, fallback]`, so OpenRouter moves to the fallback when the primary errors or is rate-limited.
**Why:** Live test on 2026-11-12, 3 demo hedging questions: Ultra got every hedging direction right and obeyed the prompt. Lightning added one wrong direction sentence. Free-model replies take about 10–20 s per tutor question.
**Rejected:** Lightning as primary (wrong direction in the live test). A single model with no fallback (free models have daily caps and can rate-limit on recording day).
**Trade-off:** Free-model latency is high, so the demo must allow for it. The offline fallback still covers full outages.

## D-13 — Direction statements come from code-generated facts; the number guard covers numbers (2026-11-12)
**Decision:** `app/src/ai/facts.ts` holds direction facts generated in code. The AI must take every direction statement from these facts. The number guard (A0) keeps checking numbers as before. Facts cover directions.
**Why:** The number guard only checks numbers. In the live test, Lightning wrote one wrong direction sentence, and the guard does not check direction words. Taking directions from generated facts removes that gap.
**Rejected:** Relying on the number guard for direction errors (it does not check direction words). Trusting the model on directions (Lightning failed the live test).
**Trade-off:** The facts file is generated code, so it must stay in step with the engine.

## D-14 — Light default, dark mode via semantic CSS tokens + class variant, print always light (2026-11-12)
**Decision:** The app opens in light theme. Colours are semantic tokens on `:root`, redefined for dark under a `dark` class on `<html>` (stored in `of_theme`, default `light`). Print and the poster/report captures always use the light tokens.
**Why:** One component set serves both themes without per-component colour branches. Light suits the printed poster and report; print must not pick up dark colours.
**Rejected:** Hard-coded dark and light palettes per component (drifts out of step). Dark as the default (the poster and print screenshots are light).
**Trade-off:** Every new colour needs a token in both themes.

## D-15 — Presets presented as a Scenario selector with a Custom state; lecturer workbook preset hidden (2026-11-12)
**Decision:** The three teaching presets appear in a Scenario selector (A Baseline, B Inflation shock, plus a Custom state once inputs are edited). The lecturer workbook preset is hidden from the UI but kept in the engine and in `verify.test.ts`.
**Why:** Students pick a named case without needing the workbook's raw inputs. The workbook values stay checked by the oracle (D-08), so the marker's numbers are still tested.
**Rejected:** Showing the workbook preset in the UI (exposes raw inputs that confuse non-finance users). Deleting it (loses the oracle inputs).
**Trade-off:** A tester has to know the workbook case exists to reach it through code.

---

## Working assumptions (`ASSUMED:`)

Not decisions — guesses made to keep moving. Each one must be confirmed or killed before anything load-bearing is built on it. When one is resolved, delete it here and write a real ADR above.

- ASSUMED: an offline fallback (canned replies for preset scenarios) is wanted for the demo recording.
- ASSUMED: personal data (member IDs, private messages) stays out of git.
