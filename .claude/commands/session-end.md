---
description: Close out the session — changelog entry, STATUS update, ADRs, doc reconciliation
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Close out this session per CLAUDE.md's mandatory rules. Keep it brief.

1. `git status` and `git diff --stat`: establish what actually changed.
2. Add an entry to `refdocs/changelog/CHANGELOG.md` (newest first). **Verified** names a command actually run and its result, or says "nothing verified this session".
3. Update `refdocs/STATUS.md`: phase table and verification ledger. Never round up: code that compiles but was never run is 🔶, not ✅.
4. New architectural decision → ADR in `refdocs/changelog/DECISIONS.md` with an id matching PRD §7. Resolved `ASSUMED:` items get promoted or deleted.
5. If the work diverged from its execution doc, edit that doc and note it under Deviations.
6. Update the plans/execution index tables if a doc changed status. New env var → `refdocs/guides/env_setup.md` and `.env.example`.

Then show me the changelog entry and list anything unresolved.
