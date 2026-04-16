# Plan: Three-tab IA + export/print checkpoint cohesion

## TLDR

- Restore a **visible, reachable** path to set `project.checkpoints.materialAssumptionsReviewed` after the **Review** tab was removed (CSV + print still gate on it via `cutListExportCheckpointsReady`).
- Fix **stale UX copy** that still tells users to use “Review” (`components/PartsTable.tsx` and any siblings).
- Fix **`/print`** navigation that points at a removed anchor (`components/ShopPrintView.tsx`).
- Align **internal PM/docs** with the shipped **Project → Plan → Materials** flow (`.cursor/rules/agent-pm.mdc`, `docs/plans/woodworker-gaps.md` release slice).
- **Explicitly not included:** new joinery-on-main-path behavior, hardware schedule, dresser asymmetry, or reintroducing the full Review tab.

## Critical decisions

1. **Decision:** Add a **single primary** “Material assumptions” acknowledgment control on the **Materials** tab (top of the tab panel, above yard list), wired to existing `setCheckpointReviewed("materialAssumptionsReviewed", …)` in `ProjectContext`. **Because:** users should confirm numbers *after* seeing yard list + parts—the trust bar from strategy. **Rejected:** only on Project (easy to miss before export); auto-unlock with no checkbox (removes deliberate pause and weakens export gate).

2. **Decision:** Replace `ShopPrintView`’s `/#review-checkpoints-section` link with a **working destination**: `href="/"` plus copy that says to open **Materials** and check the assumption box (until a proper deep-link exists). **Because:** removes a dead link immediately without adding URL routing for tabs. **Rejected:** re-add a hidden Review section solely for anchors (confusing IA).

3. **Decision:** Keep `cutListExportCheckpointsReady` = `materialAssumptionsReviewed` only (no change to `lib/cut-list-scope.ts` logic). **Because:** matches existing `canExportOrPrintProject` contract and tests. **Rejected:** removing the checkpoint entirely in this slice (would need product sign-off + doc sweep + migration default for old saved projects).

## Tasks

- [x] **Task 1 — Materials assumptions surface** — Add a compact panel at the top of the Materials column (inside `components/AppShellTabs.tsx` shop branch, or a tiny dedicated component imported there) with: short explanation, checkbox, link to `docs/USER_GUIDE.md` anchor optional. Wire `useProject().setCheckpointReviewed`. **Verify:** with blocking issues cleared, toggling checkbox enables/disables **Export CSV** in `PartsTable`; print button in `ProjectSetupBar` follows same `canPrint` logic.

- [x] **Task 2 — PartsTable export lock copy** — Update `components/PartsTable.tsx` disabled title + `#parts-export-lock-reason` text to reference **Materials** (not Review). **Verify:** eslint on file; manual: lock message matches UI.

- [x] **Task 3 — Shop print dead link** — Update `components/ShopPrintView.tsx` link + surrounding copy so nothing references `#review-checkpoints-section`. **Verify:** open `/print` in dev, click link lands on app root without 404; no broken hash.

- [x] **Task 4 — Project print affordance copy** — Scan `components/ProjectSetupBar.tsx` for any “Review” / checkpoint strings tied to print lock; align with Materials acknowledgment. **Verify:** grep `Review` in file is gone or accurate.

- [x] **Task 5 — Workshop flow guide (if still mounted)** — If `WorkshopFlowGuide` is used anywhere, pass props / adjust checklist rows so “Review tab” is not required language (`components/WorkshopFlowGuide.tsx`). If unused, skip with note in PR. **Verify:** `rg "Review tab" components`.

- [x] **Task 6 — Docs + PM rule hygiene** — Update `.cursor/rules/agent-pm.mdc` tab description to **Project / Plan / Materials**; update `docs/plans/woodworker-gaps.md` release slice step that still says “Review”. Optionally add one sentence to `docs/USER_GUIDE.md` under Materials describing the checkbox. **Verify:** links in edited docs resolve; prose matches code.

- [x] **Task 7 — Automated checks** — Run `npm test`, `npx tsc --noEmit`, and `npx eslint` on touched files. **Verify:** all green.

## Risks & rollback

- **Risk:** Saved projects in `localStorage` still have `materialAssumptionsReviewed: false` — users may not notice the new checkbox and think export is “broken.” Mitigation: prominent copy on first Materials visit or one-time banner until checked. **Rollback:** revert UI files; checkpoint schema unchanged so data stays compatible.
