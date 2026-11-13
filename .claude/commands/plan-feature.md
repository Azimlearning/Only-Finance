---
description: Write the plan + execution doc pair required before building
argument-hint: [what you want to build]
allowed-tools: Read, Write, Glob, Grep, Bash
---

Produce the plan/execution pair CLAUDE.md requires before non-trivial implementation, for: $ARGUMENTS

First read `refdocs/STATUS.md`, PRD §4 and §7, and `refdocs/changelog/DECISIONS.md`. If an existing plan already covers it, say so instead of writing a duplicate.

Write two files, matching the existing docs:
- `refdocs/plans/YYYY-MM-DD-<slug>.md`: what and why, scope in/out, approach, risk table with honest confidence, definition of done as observable facts.
- `refdocs/execution/YYYY-MM-DD-<slug>.md`: ordered tasks naming the files they touch, then **one end gate** (D-11: no per-task verify steps). Any new engine function must be added to the tool registry and `verify.test.ts` (preflight Q5).

Where a task depends on a library's behaviour, its first step is "read the current docs". Do not implement anything. Return both paths.
