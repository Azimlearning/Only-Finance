# OnlyFinance — Changelog

> Mandatory session log. Add an entry after **every** session where code changed, a decision was made, or a plan was modified. Newest first.

Entry format:
```
### YYYY-MM-DD — [short summary of session goal]
- **Changed:** what files/components were touched and why
- **Decided:** any architectural or design decisions and the reasoning
- **Deviations:** anything that differed from the plan, and why
- **Verified:** what was actually run, and the result (not "should work")
- **Known issues / next steps:** what was left open
```

Optional when earned: **Reported**, **Diagnosed**, **Trade-off**, **Noted, not changed**.

Rules: "Verified" means a command was run, so name it and give the result. Deviations are the most valuable line. Write what you learned, not what you touched. Don't rewrite history.

---

## [Unreleased]

### 2026-11-12 — Final gate, P1 polish round, fresh screenshots, demo docs
- **Changed:** P1 polish round (no finance logic changed): glossary tooltips, Explain tone switch (SME owner / Student), onboarding guided tour (6 steps), unslop copy pass, Scenario selector (A Baseline, B Inflation shock, Custom state), brand icons and logo, dark mode via semantic tokens (`ui/theme.ts`, `ui/ThemeToggle.tsx`, `index.css`). Screenshots re-captured in light theme at 1920×1080 (`app/screenshots/`), plus three dark captures (14 files in total). Docs updated: STATUS, PRD §7 (D-14, D-15), DECISIONS (D-14, D-15).
- **Decided:** D-14 (light default, dark via semantic tokens and a class variant, print always light). D-15 (presets shown as a Scenario selector with a Custom state; the lecturer workbook preset hidden from the UI but kept for verification).
- **Deviations:** Screenshots were taken with a separate headless Chromium script in the scratchpad, not the shared Playwright MCP browser (another agent was using it). The tutor screenshot shows the offline template reply, not a live model reply.
- **Verified:**
  - `npm --prefix app run build` (`tsc -b && vite build`): passed, exit 0. Output: `dist/index.html`, CSS 38.23 kB, JS 862.24 kB (warning: chunk over 500 kB, not a failure).
  - `npm --prefix app test`, run from Git Bash: failed at suite load, 0 tests run. Error: `TypeError: Cannot read properties of undefined (reading 'config')` at `src/verify.test.ts:7:1` (`Test Files 1 failed (1)`, `Tests no tests`). Not yet diagnosed.
  - Same command rerun from PowerShell (`npm --prefix C:\Users\User\Documents\Coding\Hackathon\OnlyFinance\app test`): `Test Files 1 passed (1)`, `Tests 137 passed (137)`.
  - Screenshots: 14 captured (11 light, 3 dark) with Playwright headless Chromium at 1920×1080. Read back and checked: `tour.png` (Guided tour, 3 of 6), `tutor.png` (offline reply, 18/18 numbers match), `dark-budget.png` (dark theme rendered, no welcome modal).
- **Known issues / next steps:** The Git Bash test failure needs a diagnosis before the next gate. It did not reproduce from PowerShell, so the cause is probably the shell or path, but that is not confirmed. Free-model tutor latency is still 10–20 s. Poster and slides are in progress with the team; the report pack and the script and slide plan are done.

### 2026-11-12 — P0 built, P1 design passes, live tutor tested, pushed to GitHub
- **Changed:** Built the P0 app in `app/`: engine (21 calc functions, 87 oracle cases), 7 tabs with workings and guided tour, AI layer (tutor with tool calling, number guard A0, offline fallback, practice A5, explain A1). Added `app/src/ai/facts.ts` (code-generated direction facts). Two design passes: Emil Kowalski design-engineering skills (project `.claude/skills/`, MIT) and ui-ux-pro-max (`design-system/MASTER.md`: teal primary, amber for costs, IBM Plex). Fixed a format bug where Scenario rates showed as "RM 4.44". Added `SETUP.md`. Screenshots in `app/screenshots/`. Model config: primary `nvidia/nemotron-3-ultra-550b-a55b:free`, fallback `nvidia/nemotron-3.5-lightning:free`, sent as OpenRouter `models` fallbacks.
- **Decided:** D-12 (primary Ultra, fallback Lightning, via OpenRouter `models` fallback) and D-13 (direction statements come from `facts.ts`; the number guard covers numbers). Resolved the proxy header injection, model id and Tailwind/Recharts/Vitest ASSUMED items.
- **Deviations:** Orchestrated the build with parallel subagents (Haiku and Sonnet). Report drafts were written, then the user narrowed scope to the app only. A poster draft was produced; submission deliverables are kept outside the public repo. The team owns the report, poster, slides and video. Repo pushed to a private GitHub repo (`Azimlearning/Only-Finance`, initial commit `796a09b`).
- **Verified:** `npm --prefix app run build` passes. `npm --prefix app test` runs 137/137 pass. Live tutor test against OpenRouter, 3 demo hedging questions: Ultra got all directions right and obeyed the prompt. Lightning added one wrong direction sentence, which is why `facts.ts` exists.
- **Known issues / next steps:** Free-model replies take about 10–20 s per tutor question. Free models have daily caps; check on recording day. Unused scaffold files `app/src/App.css` and `app/src/assets/` remain. `.env.example` is not committed yet. Demo rehearsal is still to do.

### 2026-11-11 — Project cleaned up, brainstormed and scaffolded
- **Changed:** Reorganised the loose files into `context/` (brief, lectures, tutorials, workbook, notes; the course material is local only, not in the public repo) with readable names; added UTF-8 `.md` text copies of every PDF, a hand transcription of the image-only Week 10 guide, and a formula-by-formula export of the lecturer's workbook. Removed exact duplicates (a second copy of the guidelines PDF, the empty `IFM DOCS` folder, an exported chat archive after extraction). Wrote `context/notes/OnlyFinance-Brainstorm-2026-11-11.md`. Created the doc system: `refdocs/` (PRD, STATUS, sources, guides, changelog/DECISIONS, P0 plan + execution), `CLAUDE.md`, `README.md`, `.gitignore`, `.env.example`, `.claude/` (settings, secret-guard hook, test-runner agent, three commands, preflight). No application code yet.
- **Decided:** D-01 to D-11 (see DECISIONS.md): SME Budget Coach with a generic persona; React + Vite + TS in `app/`; two-track compute with a number guard; OpenRouter via a localhost Vite proxy; scope of 3 features per FX group + A0/A3/A5 (+A1); MYR per USD and decimals; ACT/365 default; workbook as oracle; npm/Tailwind/Recharts/Vitest; lean ops; one-shot build with one end test.
- **Learned:** The Week 10 guide and the workbook combine inputs where PPP and IRP point in opposite directions. The identity forward ÷ PPP = (1+r_MY)/(1+r_US) explains why (the real-rate gap), and became the F6 Parity Check concept.
- **Verified:** Python scripts recomputed every reference value in the P0 execution doc; the parity identity held on 4 data sets. No app code to verify.
- **Known issues / next steps:** OpenRouter key and model pending; proxy header injection, Tailwind v4 setup and offline fallback are `ASSUMED:`; group details and storyline open. Next session starts from `refdocs/plans/2026-11-11-p0-one-shot-build.md`.
