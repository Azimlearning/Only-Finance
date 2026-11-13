# Preflight — OnlyFinance Session Start

> Read this at the start of every session, before touching code.
> One page, six questions, then you can build. CLAUDE.md is the reference; this is the gate.

---

## 1. Where are we?

Open `refdocs/STATUS.md`. Find the current phase and the one next action.
If STATUS's claims and the code disagree, **that's the session's first task**.

---

## 2. What am I about to touch?

| Area | Path | Rule |
|---|---|---|
| Finance engine | `app/src/engine/` | Pure TS, no React/I/O; every function returns workings; values must match the execution doc's oracle |
| AI layer | `app/src/ai/` | Never the source of a displayed number; guard every reply |
| UI | `app/src/ui/` | Reads engine results only; P1 polish must not change finance logic |
| Proxy / env | `app/vite.config.ts`, root `.env.local` | The only place the API key may appear |
| Course material | `context/` | Read-only; the brief here is the controlling document (brief, lectures, workbook are local only, not in the public repo) |

---

## 3. Does a plan exist for what I'm about to build?

Non-trivial work → plan in `refdocs/plans/` **and** execution doc in `refdocs/execution/`. P0 has both. If reality has moved, update the doc before building on it.

---

## 4. Has this already been decided?

Skim `refdocs/changelog/DECISIONS.md` (D-01 to D-11) before re-opening a choice. Check the `ASSUMED:` list at the bottom; if today's work rests on one (proxy header, model id, offline fallback), confirm it first.

---

## 5. If I added or changed an engine function, did I update the tool registry and workings?

Every public function exported from `app/src/engine/index.ts` must (a) return `workings`, (b) have an entry in `app/src/ai/tools.ts`, and (c) be covered by a case in `app/src/verify.test.ts` when it produces a reference value. Otherwise the tutor can't reach it, and the number guard can't verify what it produces, so the AI silently becomes the calculator. Enforced by the registry-coverage check in `verify.test.ts` (D-10). And: does any number shown in the UI come from somewhere other than the engine? It must not.

---

## 6. Will I close the session properly?

`/session-end` — changelog entry, STATUS phase table, verification ledger, any new ADR.

---

## Quick links

| Doc | Purpose |
|---|---|
| `context/brief/Project-Guidelines-FinBridge-AI.md` | The brief (controlling; local only, not in the public repo) |
| `refdocs/STATUS.md` | Where the build actually is |
| `CLAUDE.md` | Operating brief: rules, constraints, stack |
| `refdocs/onlyfinance-PRD.md` | Scope, architecture, roadmap, decision log |
| `refdocs/execution/2026-11-11-p0-one-shot-build.md` | Formulas + reference values (oracle) |
| `refdocs/changelog/DECISIONS.md` | Settled calls |
| `refdocs/guides/env_setup.md` | Env vars |
