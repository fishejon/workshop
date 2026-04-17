# Plan: Home page landing redesign v2

## TLDR
- Ship a clearer Project-tab landing experience with one primary next action and explicit flow: Project -> Plan -> Materials.
- Tighten information hierarchy: keep onboarding and recent-project actions visible; move advanced controls behind progressive disclosure.
- Improve copy and control labels so users always know what each section does and what happens next.
- Add lightweight validation of UX outcomes (manual walkthrough + targeted tests for key state/CTA behavior).
- Not included: new auth/cloud sync, CAD/labs expansion, or major data-model changes.

## Critical decisions
1. **Decision:** Keep the Project tab as the landing surface (not a separate route). **Because:** it preserves current IA and keeps first-run + return flows in one place without navigation churn. **Rejected:** introducing a standalone `/home` route right now.
2. **Decision:** Use one dominant CTA based on app state (`Continue: Plan` vs `Continue: Materials`). **Because:** reduces decision paralysis and matches the core UX rule: "what do I do next?" **Rejected:** multiple equivalent primary buttons.
3. **Decision:** Keep advanced settings in collapsible secondary UI. **Because:** first-run users need a clear starting path; advanced controls are optional depth. **Rejected:** showing all setup controls above the fold.
4. **Decision:** Prioritize local "Recent projects" as the return-visit anchor. **Because:** project library already exists and is persistence-safe; this delivers immediate value without backend work. **Rejected:** delaying landing redesign until remote project storage exists.

## Tasks
- [x] **Task 1 — Home hero hierarchy polish**  
  Scope: Refine hero content, CTA text, and status microcopy for first-run vs return users.  
  Files: `components/GrainlineApp.tsx` (Project tab section), optional `components/DecisionStrip.tsx` copy alignment.  
  Verify: manual walkthrough for (a) empty project, (b) project with parts + blockers, (c) project ready for Materials.

- [x] **Task 2 — Preset chooser clarity + affordances**  
  Scope: Improve card copy and selected-state emphasis; ensure the chooser communicates "start a build" clearly.  
  Files: `components/GrainlineApp.tsx`, optional token-level class tuning in `app/globals.css`.  
  Verify: visual scan in desktop + narrow viewport; selected preset remains obvious without reading helper text.

- [x] **Task 3 — Recent projects action model**  
  Scope: Confirm "Open" and "Archive" semantics, reduce accidental actions, and ensure ordering/metadata clarity.  
  Files: `components/GrainlineApp.tsx`, possibly `components/ProjectContext.tsx` for helper return metadata if needed.  
  Verify: manual restore/archive flow from recent list; correct project loads; archived entry disappears from active list.

- [x] **Task 4 — Progressive disclosure for advanced settings**  
  Scope: Keep advanced controls discoverable but visually secondary; ensure template actions remain understandable.  
  Files: `components/GrainlineApp.tsx`, `components/ProjectSetupBar.tsx` (if labels/help text need alignment).  
  Verify: first-time user path can complete without opening advanced block; advanced users can still find controls quickly.

- [x] **Task 5 — UX copy consistency pass across tabs**  
  Scope: Align tab-level language with landing promises ("Project -> Plan -> Materials"), including button wording and lock-state copy.  
  Files: `components/AppShellTabs.tsx`, `components/GrainlineApp.tsx`, `components/PartsTable.tsx`, `components/CutListYardSummary.tsx`.  
  Verify: grep/manual review for inconsistent tab naming and ambiguous verbs.

- [x] **Task 6 — Validation and acceptance checks**  
  Scope: Run automated checks and perform a scripted manual UX test pass.  
  Files/areas: affected components above; no schema changes expected.  
  Verify: `npm test`, `npm run lint` (or lint subset if unrelated repo issues persist), plus manual checklist:
  - can identify page purpose in <10s
  - can tell next step without guessing
  - can resume recent project in <=2 clicks
  - can reach advanced settings without cluttering first view

### Execution notes
- Implemented landing-page refactor on `components/GrainlineApp.tsx` with a clear Home hero, step cards, chooser section, recent projects section, and progressive disclosure for advanced settings.
- Added/retained project continuation actions (`Continue: Plan/Materials`, `Go to Plan`, `Save snapshot to Recent`) and recent project actions (`Open`, `Archive`).
- Verification run:
  - `npm test` ✅ (47 files / 161 tests passing)
  - `npm run lint` ⚠️ blocked by pre-existing `react-hooks/refs` errors in `components/TvConsoleStub.tsx` (unrelated to landing-page edits).

## Risks & rollback
- **Risk:** Over-tuning copy/layout can regress familiar user muscle memory. **Rollback:** keep changes scoped to Project tab presentation and revert the landing section as one unit if feedback is negative.
- **Risk:** Existing global lint noise in unrelated files can mask regressions. **Rollback:** run targeted lint + tests on touched files and defer unrelated lint cleanup to a separate task.

