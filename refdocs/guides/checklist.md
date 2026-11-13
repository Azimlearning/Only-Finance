# Pre-Ship Checklist — OnlyFinance

> Run the relevant section before calling a phase done or recording the demo. Per D-11, checks run once at the end of a build pass, not per task.

---

## End of a build pass

- [ ] **It was actually run.** Not "it compiles": the app was opened and the result observed.
- [ ] **Build passes** — `npm --prefix app run build`
- [ ] **Verification passes** — `npm --prefix app test` (single `app/src/verify.test.ts`)
- [ ] **Baseline preset shows the oracle values** — F 4.4354, PPP 4.4563, RM443,541 / RM445,631; Verify tab all ✓
- [ ] **Runs with no API key** — AI panels show the offline fallback
- [ ] **No secrets staged** — `git status` shows no `.env*`; `grep -r OPENROUTER_API_KEY app/src` returns nothing
- [ ] **Changelog entry added** with an honest **Verified** line
- [ ] **STATUS.md reflects reality**; the verification ledger has a row for what you ran

---

## Finance correctness (before the demo or poster)

- [ ] Every rate input shows the "ILLUSTRATIVE — not market rates" label
- [ ] Limitations panel visible (PPP long-run, IRP costs/controls, forecasts ≠ predictions, implied ≠ quoted forward, not advice)
- [ ] Direction words checked: a higher MYR-per-USD number means a **weaker** ringgit
- [ ] Every AI reply in the demo shows "✓ n/n numbers verified"

---

## New dependency

- [ ] Recorded in `refdocs/onlyfinance-sources.md` with its license
- [ ] Its current docs were read, not recalled from memory

---

## New environment variable

- [ ] Added to `refdocs/guides/env_setup.md` and `.env.example`
- [ ] Missing-variable case degrades gracefully (offline fallback), never a crash

---

## Architectural decision

- [ ] ADR in `refdocs/changelog/DECISIONS.md` with the same id in PRD §7
- [ ] Any `ASSUMED:` it resolves is deleted from the assumptions list

---

## Before submission (group, not code)

- [ ] Poster: every member's full name, student ID, programme; group number; references; CLO3 calculation; AI-use disclosure
- [ ] Video 9:30–10:00 (max 10:30), every member speaks or demos
- [ ] Files named `GroupXX_FinBridgeAI_Poster.pdf` / `GroupXX_FinBridgeAI_Video.mp4`; leader submits on ULearn before 2026-11-16 23:59 MYT (aim for Sunday night)
