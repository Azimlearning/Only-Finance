# OnlyFinance — Claude Context

> Read this file at the start of every session, then run through `.claude/memory/preflight.md`, the six-question gate. OnlyFinance is a localhost React + Vite app for the GFB3043/GEB3043 FinBridge AI challenge: it shows non-finance Malaysian SME importers/exporters how interest rates, inflation and FX move their ringgit budget, with a tested finance engine and an AI tutor whose numbers are verified against that engine.
> The PRD is the source of truth; this file is the short operating brief; preflight is the gate. Keep all three short.

---

## Order of authority (when docs conflict, surface it — don't resolve silently)

- **Above everything: `context/brief/Project-Guidelines-FinBridge-AI.pdf`** (text copy `.md`) (local copy; not in the public repo). This is the assignment brief. Anything that conflicts with it is wrong.

0. `refdocs/STATUS.md` — **where we are right now.** Check this first, every session.
1. `refdocs/onlyfinance-PRD.md` — **what & why.** Owns scope, architecture, roadmap, Decision Log.
2. `refdocs/changelog/DECISIONS.md` — **settled calls.** Read before re-debating an architectural choice.
3. `refdocs/plans/*.md` — **what to build & why.**
4. `refdocs/execution/*.md` — **how & in what order.** The P0 execution doc holds every formula and reference value.
5. `refdocs/guides/` — `env_setup.md`, `checklist.md`.
6. `refdocs/onlyfinance-sources.md` — sources and rejected options.
7. `context/` — raw course material (lectures, workbook, notes, brainstorm). Only `context/notes/` is in the public repo; the rest is local only. Read on demand; don't load it all.

If two docs disagree, stop and ask. Don't pick one and move on.

---

## Mandatory rules

### 1. Update the changelog after every session
After any session that changed code, made a decision, or modified a plan, add an entry to **`refdocs/changelog/CHANGELOG.md`** (format in that file). Run `/session-end`.

### 2. Plan before you build
Non-trivial work needs a plan doc (`refdocs/plans/`) and an execution doc (`refdocs/execution/`). P0 already has both.

### 3. Log decisions as ADRs
New architectural/design decision → ADR in `refdocs/changelog/DECISIONS.md`. Mark unresolved assumptions `ASSUMED:`.

### 4. Keep docs current
If you deviate from a plan during execution, update the execution doc to match reality.

### 5. Work fast and lean (user's standing instruction, D-11)
- Build in one shot from the execution doc; **no microtests or per-task verification.** One end gate: `build` → `verify.test.ts` → manual load.
- UI polish is a later phase; P0 only needs to be functional and correct.
- Save tokens: read `context/` files only when a task needs them; don't re-derive formulas that are in the execution doc; don't re-read files you just wrote.

### 6. Ask before committing
`git init` is done; never commit or push unless the user asks.

---

## The hard constraints (these are mechanism, not preference)

1. **The engine is the source of truth for every displayed number.** The AI may draft working, but every number in AI text goes through the number guard (`ai/guard.ts`) and is ✓-verified or corrected before display. The AI never calculates a headline value (D-03; brief §4).
2. **All rates are illustrative and labelled as such.** No live rate feeds, no claim that a rate is current, no real company or personal data sent to the LLM (brief §2, §9).
3. **The API key never reaches the browser.** `OPENROUTER_API_KEY` has no `VITE_` prefix and is read only in `app/vite.config.ts` for the `/api/llm` proxy. Nothing in `app/src/` references it. Localhost only, no deploy (D-04).
4. **Engine outputs must match the lecturer's workbook.** Quote MYR per 1 USD; rates as decimals internally (D-06, D-08). The reference values are in the P0 execution doc, Task 6.
5. **The app must run with no API key.** AI panels fall back to the offline templates instead of erroring.
6. **Deadline 2026-11-16 23:59 MYT** (IFM test that day, 4–6pm). Marks come from the poster, video and finance output, not the code.

---

## Stack

React + Vite + TypeScript (in `app/`) · Tailwind CSS · Recharts · Vitest · npm · OpenRouter (OpenAI-compatible chat completions with tool calling) via the Vite dev-server proxy. Node 24, npm 11.

## Surfaces

Single app. Everything runnable lives in `app/`; `context/` is read-only course material and `refdocs/` is docs.

## Running it

| What | Command | Notes |
|---|---|---|
| Install | `npm --prefix app install` | After the P0 scaffold exists |
| Dev server | `npm --prefix app run dev` | Localhost; proxy `/api/llm` needs `OPENROUTER_API_KEY` in root `.env.local` (optional) |
| Build + typecheck | `npm --prefix app run build` | `tsc -b && vite build` |
| Verify (end gate) | `npm --prefix app test` | Runs `app/src/verify.test.ts` once |

---

## Build sequence

P0 one-shot build (engine → UI → AI → `verify.test.ts`, then one end gate) → P1 UI clean-up (no finance logic changes) → P2 demo presets, poster screenshots, calculation evidence. See PRD §6.

**Never build the second of anything until the first is green end-to-end.**

---

## When blocked

- **Open question:** check the PRD's Open Questions. If unresolved, write your assumption to `DECISIONS.md` as `ASSUMED:`, proceed, surface it at the next checkpoint.
- **Doc conflict:** stop. Quote both passages and ask.
- **Ambiguous spec:** prefer the option that is **more verifiable and clearer on screen in the demo**. Log the choice.

---

*Companion brief to `refdocs/onlyfinance-PRD.md`. Last updated: 2026-11-11.*
