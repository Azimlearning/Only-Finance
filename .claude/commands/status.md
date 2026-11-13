---
description: Where is this project actually at?
allowed-tools: Read, Glob, Grep, Bash
---

Tell me where OnlyFinance actually stands.

Read `refdocs/STATUS.md`, the latest `refdocs/changelog/CHANGELOG.md` entry, and the in-progress execution doc. Then check reality: `git status`, `git log --oneline -10` (if any commits), and the code for the current phase.

Report briefly:
- Current phase; what's genuinely done vs claimed done
- Anything STATUS says is ✅ that the code or verification ledger doesn't support (flag loudly)
- Open `ASSUMED:` items and blockers
- Days left to the 2026-11-16 23:59 MYT deadline
- The single next action
