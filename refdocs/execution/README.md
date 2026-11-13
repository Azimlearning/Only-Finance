# Execution Plans

> Every plan in `refdocs/plans/` that moves to implementation has a matching execution document here: ordered tasks, file paths, commands.
> Project override (D-11): tasks do **not** carry individual Verify steps. Each execution doc ends with one verification gate, and a phase is done when that gate passes.

## Naming convention

`YYYY-MM-DD-<slug>.md`, identical to its companion plan in `refdocs/plans/`.

## Required sections

1. Companion plan link · 2. Before starting · 3. Ordered tasks (files + steps) · 4. End gate (real commands, expected results) · 5. Wrap-up checklist

## Keeping these honest

If reality diverges mid-build, edit the doc and note it in the changelog's Deviations line.

## Index

| File | Companion plan | Status |
|---|---|---|
| [2026-11-11-p0-one-shot-build.md](2026-11-11-p0-one-shot-build.md) | [../plans/2026-11-11-p0-one-shot-build.md](../plans/2026-11-11-p0-one-shot-build.md) | Not started |
