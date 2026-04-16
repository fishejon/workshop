# P4-M2 — Migration discipline (note)

**Milestone:** Phase 4 / engineering hygiene from `docs/plans/pm-roadmap-execution-ladder.md`.

## Current practice

- `Project.version` stays at **1**; forward-compatible parsing lives in `lib/project-utils.ts` (`parseProject`, `normalizeProjectJsonInput`).
- New optional fields should be **omitted** from `createEmptyProject()` until required, and **validated** on parse when persisted (see `geometry` + `isCaseOutlineV0` pattern).

## Verify

- Extend `lib/project-utils.test.ts` whenever storage shape changes.
- Manually import a **saved JSON export** from the prior release after schema edits.

No migration bump required for this roadmap slice.
