# Plan: Trust hardening (validation, conflict detection, preset confidence)

## TLDR
- Ship a **validation-first safety layer** so impossible geometry and joinery conflicts are surfaced before users print or buy material.
- Upgrade persistence from “exists” to **confidence-grade portability**: reliability checks, explicit restore states, and safer backup/restore UX.
- Resolve the TV console confidence gap by choosing one of two explicit paths: **productionize** it or **hide behind experimental**.
- Keep scope focused on trust and error prevention; do **not** add fully custom preset authoring in this pass.

## Critical decisions
1. **Decision:** Introduce a shared `ValidationIssue` engine used by Build, Shop, and Print gates. **Because:** one source of truth avoids mismatched warnings between UI panels. **Rejected:** ad-hoc inline checks in each component.
2. **Decision:** Treat joinery overlap as a first-class conflict (`dimension-axis touched by >1 incompatible rule`) with visible severity. **Because:** silent stacking is the primary trust failure in rule-based systems. **Rejected:** leaving conflicts as implied deltas in history only.
3. **Decision:** Keep current JSON import/export + local backups, but add **integrity and lifecycle UX** instead of introducing server persistence now. **Because:** fastest risk reduction without backend complexity. **Rejected:** immediate cloud sync/build-vs-buy detour.
4. **Decision:** TV console must either meet minimum production parity or be clearly marked experimental and removed from default preset set. **Because:** half-finished presets reduce confidence in completed planners. **Rejected:** keeping current in-between state.

## Tasks
- [x] **Task 1 — Validation domain model + registry** — Add centralized issue model and rules dispatcher.  
  - **Files / areas:** `lib/` new `validation/` module, `lib/project-types.ts` (issue types if needed), `components/ProjectContext.tsx` (expose computed issues).  
  - **Verify:** unit tests for severity, dedupe, and deterministic ordering; no UI regressions with empty projects.
  - **Rollback / risk:** Low; additive module.

- [x] **Task 2 — Dimension sanity checks** — Geometry and manufacturability checks.  
  - **Files / areas:** `lib/validation/*`, `components/DresserPlanner.tsx`, `components/PartsTable.tsx`, `components/ShopPrintView.tsx`.  
  - **Rules (minimum):** drawer box > opening, tenon length invalid for rail/stile, rough dims thinner/smaller than finished, negative interior/opening budgets.  
  - **Verify:** test fixtures trigger each rule; manual check shows inline warnings in Build and Review/Print lock context.
  - **Rollback / risk:** Medium; false positives can annoy users—start with warning severity unless mathematically impossible.

- [x] **Task 3 — Joinery conflict detection** — Multi-rule overlap and contradiction reporting.  
  - **Files / areas:** `lib/validation/joinery-conflicts.ts`, `lib/part-provenance.ts`, `components/JoineryPanel.tsx`, `components/PartsTable.tsx`.  
  - **Verify:** when two rules modify same part axis incompatibly, conflict appears with affected part/rule ids and recommended action.
  - **Rollback / risk:** Medium; conflict heuristics require clear, narrow definitions to avoid noise.

- [x] **Task 4 — Validation surfaces + print/export gate messaging** — Make issues impossible to miss.  
  - **Files / areas:** `components/GrainlineApp.tsx`, `components/AppShellTabs.tsx`, `components/ProjectSetupBar.tsx`, `components/ShopPrintView.tsx`.  
  - **Verify:** high-severity issues block print/export with explicit reason list; warnings remain visible but non-blocking.
  - **Rollback / risk:** Low-medium; gating can frustrate if thresholds are too strict.

- [x] **Task 5 — Persistence confidence hardening** — Portable and recoverable workflow checks.  
  - **Files / areas:** `lib/project-utils.ts`, `components/ProjectSetupBar.tsx`, `lib/project-utils.test.ts`.  
  - **Scope:** checksum/shape validation on import, clearer restore provenance (timestamp/source), backup retention policy visibility, “restore successful” + what changed summary.
  - **Verify:** corrupted/partial JSON paths fail safely with actionable error; valid imports preserve project fidelity.
  - **Rollback / risk:** Medium; serialization compatibility must remain backward compatible.

- [x] **Task 6 — TV console trust decision implementation** — Finish or hide.  
  - **Files / areas:** `components/GrainlineApp.tsx`, `components/TvConsoleStub.tsx`, optional `docs/USER_GUIDE.md`.  
  - **Path A (recommended if <2 days):** mark experimental and move behind explicit opt-in label.  
  - **Path B:** productionize to minimum parity (parts, assumptions, print confidence).  
  - **Verify:** no ambiguous “stub” language in main preset flow; user can clearly understand support level.
  - **Rollback / risk:** Low.

- [x] **Task 7 — Regression suite expansion** — Protect trust features from drift.  
  - **Files / areas:** `lib/*test.ts`, fixtures under `lib/fixtures/`.  
  - **Verify:** automated coverage for sanity checks, joinery conflicts, import/restore error handling, and print/export gating states.
  - **Rollback / risk:** Low; test-only.

## Risks & rollback
- **Risk:** Over-aggressive validation blocks normal workflows.  
  **Rollback:** downgrade specific rules from blocking to warning via severity map.
- **Risk:** Import hardening rejects older valid saves.  
  **Rollback:** keep parser fallback path and add migration normalization before reject.
- **Risk:** TV console scope expansion delays trust work.  
  **Rollback:** choose experimental/hide path now; schedule parity in dedicated follow-up.


## Implementation notes (executed)
- Validation engine and conflict detection added under `lib/validation/*`; high-severity issues now gate print/export while warnings remain visible.
- Persistence hardening added import integrity/shape checks with actionable failure reasons and richer restore/backup provenance UX.
- TV console moved to explicit experimental opt-in path to avoid default-flow trust erosion.
- Verification: `npm run test` (92), `npm run lint`, `npm run build` all pass on integrated tree.
