# Plan — P0 One-shot build

> Phase P0 of `refdocs/onlyfinance-PRD.md` §6. Execution doc: `refdocs/execution/2026-11-11-p0-one-shot-build.md`.
> A plan says **what and why**. The execution doc says **how and in what order**.

## Why this exists

The group must submit a poster and a 10-minute video by 2026-11-16 23:59 MYT, both built around a working prototype that demonstrates correct, verified CLO3 finance (interest ↔ inflation ↔ FX). The user asked for the whole app to be built in one shot, tested once at the end, with UI polish deferred (D-11).

## What's already covered (no work needed)

- Every formula, and its expected value on reference inputs, is already worked out: the lecturer's workbook (`context/workbook/W05-06-Excel-Calculation-Workbook.md`, local only, not in the public repo), the Week 10 guide (`context/lectures/W10-…md`, local only, not in the public repo) and the 2026-11-11 verification script. The execution doc copies them as the test oracle.
- Scope is settled (PRD §4, D-05). Architecture is settled (PRD §3, D-02–D-04).
- Toolchain is installed: Node 24.11, npm 11.6, git 2.47.

## Scope

**In:** everything in PRD §4: the engine (F1–F8, F10–F17, F19, F20, F23, presets), all screens in functional form, the AI layer (A0, A1, A3, A5, offline fallback), F24 verification panel, F26 guided tour, F27 limitations, illustrative labelling.

**Out (and why):**
- Visual polish, layout finesse and copy-editing: P1 (D-11).
- Microtests and per-task verification: user instruction (D-11); one end gate instead.
- Deployment: localhost only (D-04).
- Features outside D-05: return only via an ADR.

## Approach

1. Scaffold `app/` (Vite react-ts), add Tailwind, Recharts, Vitest.
2. Write the engine as pure TS modules with one shared `types.ts`; exact formulas primary, approximations alongside; every function returns `{ value(s), workings }` so F23 is free.
3. Write presets (the scenario set from the brainstorm §6 plus the lecturer and Week 10 examples).
4. Build screens as plain functional components reading one global scenario state (A and B slots).
5. Build the AI layer: Vite proxy → client tool loop → guard → tutor UI, practice mode, explain buttons, offline fallback.
6. End gate: build, single test file, manual load.

## Risks & unknowns

| Risk / unknown | Confidence | Mitigation |
|---|---|---|
| Vite proxy can inject the Authorization header | Medium (recalled, not re-read) | Read the Vite `server.proxy` docs first in that task; fallback is a 30-line Node proxy |
| OpenRouter request/tool-calling shape | Medium (OpenAI-compatible, recalled) | Read OpenRouter docs before writing `client.ts`; key and model may not exist at build time, so build against the offline fallback and test live later |
| Tailwind v4 setup steps | Medium | Read the current Tailwind + Vite install docs; don't recall from memory |
| `create-vite` prompting interactively | Medium | Check `npm create vite@latest -- --help`; pass the template flag |
| Number guard false ✗ from rounding/format | Medium | Rounding-aware tolerance (execution doc §AI); known inputs count as verified |
| A bug only found at the end gate (no microtests) | Accepted trade-off (D-11) | Engine is pure and centralised; the end test covers every workbook sheet |

## Definition of done

- `npm --prefix app run build` exits 0.
- `npm --prefix app test` runs `src/verify.test.ts` and every case passes (all reference values in the execution doc, the parity identity on 4 data sets, registry coverage).
- `npm --prefix app run dev` loads; the Baseline preset shows F 4.4354, PPP 4.4563, RM443,541 / RM445,631; the verification panel is all ✓.
- With no API key, the tutor, explain buttons and practice feedback show the offline fallback instead of errors.
