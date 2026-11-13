# OnlyFinance — Build Status

> **Read this first to know where we are.** Updated at the end of every build session. Phases and scope come from `refdocs/onlyfinance-PRD.md` §6.

**Build philosophy:** one-shot build from the execution doc, one verification gate at the end, polish later (D-11). The engine is the source of truth for every number.

**Right now (2026-11-12):** P0 and P1 are done. The app builds, 137/137 verification tests pass (run from PowerShell; one Git Bash run failed at suite load, see ledger), and the live tutor was tested against the free OpenRouter models. Work now is demo readiness: rehearse the demo and check free-model rate limits on recording day. The team writes the report, poster, slides and video; this repo covers the app only.

---

## Phase checklist

| Phase | Scope | Status |
|---|---|---|
| P0 — One-shot build | Engine (21 calc functions, 87 oracle cases), all screens, AI layer, `verify.test.ts`, end gate | ✅ Done (built and verified) |
| P1 — UI clean-up | Layout, styling, charts, copy; no finance logic changes | ✅ Done (two design passes) |
| P2 — Demo readiness | Screenshots, demo rehearsal, rate-limit plan for recording day | 🔶 In progress |

Status vocabulary — use these exactly, and never round up:
- ⬜ **Not started**
- 🔶 **In progress** — say precisely what works and what doesn't
- ✅ **Done** — built *and* verified. If it compiles but was never run, it is not done.
- ⛔ **Blocked** — name the blocker and who/what unblocks it

---

## P0 — One-shot build (done)

| Item | Approach | Status |
|---|---|---|
| Task 1 Scaffold | Vite react-ts in `app/`, Tailwind, Recharts, Vitest, proxy config | ✅ |
| Task 2 Engine | parity, arbitrage, budget, hedging, scenarios, tenor, presets, limitations; every fn returns workings (21 functions, 87 oracle cases) | ✅ |
| Task 3 UI | Sidebar + 7 tabs (Budget, Parity Check, Scenarios, Hedging, Arbitrage, Verify, Practice), workings expanders, guided tour | ✅ |
| Task 4 AI | tools registry, client tool loop, guard (A0), tutor (A3), explain (A1), practice (A5), offline fallback, `app/src/ai/facts.ts` (direction facts, see D-13) | ✅ |
| Task 5 Wiring | state, defaults (Baseline in A, Inflation shock in B), footer | ✅ |
| Task 6 `verify.test.ts` | All reference values in the execution doc + registry coverage + guard cases | ✅ (137/137 pass) |
| Task 7 End gate | build → test → live tutor test | ✅ build, test and live tutor test run; manual load of the Baseline preset not logged as a separate check |

---

## P1 — UI clean-up (done)

Two design passes, no finance logic changed:
- Pass 1: Emil Kowalski design-engineering skills (project `.claude/skills/`: emil-design-eng, find-animation-opportunities, animate, break-ui; MIT).
- Pass 2: ui-ux-pro-max design system in `design-system/MASTER.md` (teal `#0f766e` primary, amber `#b45309` for costs, IBM Plex Sans and Mono).
- Fixed a format bug where Scenario rates showed as "RM 4.44".
- Glossary tooltips, tone switch (SME owner / Student), onboarding guided tour (6 steps), unslop copy pass, Scenario selector (A Baseline, B Inflation shock, Custom state), brand icons and logo, dark mode (light default, semantic tokens, print always light). Decisions D-14 and D-15. All done.

---

## Verification ledger

What has actually been run, not what has been written.

| Date | What was verified | How | Result |
|---|---|---|---|
| 2026-11-11 | Reference values used in the execution doc (IRP, PPP, Fisher, parity identity on 4 data sets, CIA, money-market hedge, tenor, spreads, break-evens, tornado) | Python scripts in the scaffold session | All values as listed; the identity F/E_PPP = (1+r_MY)/(1+r_US) held on all 4 data sets |
| 2026-11-12 | App builds | `npm --prefix app run build` (`tsc -b && vite build`) | Passes |
| 2026-11-12 | Engine and guard tests | `npm --prefix app test` (`verify.test.ts`) | 137/137 pass |
| 2026-11-12 (final gate) | Build, test, 14 screenshots (11 light 1920×1080, plus 3 dark) | `npm --prefix app run build` passes (exit 0). `npm --prefix app test` from Git Bash failed at suite load (`TypeError: Cannot read properties of undefined (reading 'config')`, 0 tests run, not yet diagnosed); the same command from PowerShell gave 137/137 pass. Screenshots by a headless Chromium script in the scratchpad; `tour.png`, `tutor.png`, `dark-budget.png` checked by eye | Build passes; tests 137/137 from PowerShell; screenshots saved to `app/screenshots/` |
| 2026-11-12 | Live tutor against OpenRouter | Dev server, 3 demo hedging questions, primary model `nvidia/nemotron-3-ultra-550b-a55b:free` | Ultra got all hedging directions right and obeyed the prompt. Fallback `nvidia/nemotron-3.5-lightning:free` added one wrong direction sentence (now guarded by `facts.ts`). Replies take about 10–20 s per question |

---

## P2 — Demo readiness (in progress)

Done:
- Screenshots in `app/screenshots/`, refreshed 2026-11-12 (light 1920×1080: budget, parity, scenarios, hedging, arbitrage, verify, practice, tooltip, scenario-select, tutor, tour; dark: budget, parity, hedging).
- Report pack done (team). Script and slide plan done (team).
- `SETUP.md` local dev guide.
- Repo pushed to a private GitHub repo (initial commit `796a09b`).

In progress (team):
- Poster and slides.

Remaining:
- Rehearse the demo end to end.
- Check Lightning and Ultra rate limits on recording day (free models have daily caps; the offline fallback covers outages).

---

## Known gaps

- Unused scaffold files `app/src/App.css` and `app/src/assets/` are still present.
- `.env.example` is not yet committed.
- Free-model latency: about 10–20 s per tutor question, so the demo must allow for it.
- Poster details (group number, leader, programmes) and the storyline are open (PRD §8). The team owns the report, poster, slides and video.
