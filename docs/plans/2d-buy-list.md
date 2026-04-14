# Plan: 2D buy list (width × length stock model)

## TLDR

- **Goal:** Move from **length-only stick packing** (`roughCutsFromParts` / `purchase-scenarios`) toward a **2D purchasing model**: demand in **width and length** against **buyable board sizes**, with explicit **rips**, **glue-ups**, and **labeled estimates** (not silent “final yard truth”).
- **Ship in phases:** **v1** = 2D **board-count bounds + rip/glue narrative** per material group using project **max purchasable width** and optional **stock width presets**; keep existing BF/LF and 1D scenario as **companion** lines. **v2** = user-defined **stock SKUs** (W×L pairs or width bins × length list). **v3+** = optional **nesting / yield** heuristics only if v1–v2 prove valuable.
- **Explicitly not in v1:** Optimal 2D nesting, grain-matching, defect cutting, multi-thickness from one board, sheet goods optimization.
- **Depends on:** Current `Project.maxPurchasableBoardWidthInches`, `part-assumptions` glue-up copy, and `groupPartsByMaterial` — extend, don’t fork duplicate totals.

## Critical decisions

1. **Decision:** Treat **rough W and rough L** (with clear rules per part status) as **cut dimensions on the truck**, not finished-only. **Because:** buy list must match what you pay for before milling. **Rejected:** Using finished dims only for width (understates rips).

2. **Decision:** **Stock representation v1** = one **effective purchasable width** per material group (default from project field) plus **standard length list** (reuse `COMMON_STOCK_INCHES` pattern from `purchase-scenarios.ts`). **Because:** smallest lift that fixes “3 boards” without full SKU editor. **Rejected:** Full free-form SKU matrix in v1 (too much UI before we validate math).

3. **Decision:** **2D “board estimate”** is a **lower bound or conservative upper bound** stated in UI (“at least N boards if every board is ≤ W″ wide” / “plan for rips”), not a guarantee. **Because:** yards vary; avoids false precision. **Rejected:** Single number with no disclaimer.

4. **Decision:** **Panels / glue-ups:** either treat as **target panel width** with **strip count** from `planPanelGlueUp` feeding 2D demand (strips × strip width × length), or keep **one line per finished panel** plus **assumption callout** — pick one in implementation and mirror in print. **Because:** avoids double-counting strips vs panel BF. **Rejected:** Counting both full panel BF and every strip as separate boards without reconciliation.

5. **Decision:** Keep **1D scenario modes** (`minWaste`, `minBoardCount`, etc.) as **length-axis** optimizers; add a **parallel 2D summary object** (`twoDimensionalBoardEstimate`) rather than overloading stick count silently. **Because:** traceability and safer migration. **Rejected:** Replacing 1D output entirely before 2D is trusted.

## Tasks

- [x] **Task 1 — Current pipeline map** — Document data flow  
  - **Files / areas:** `lib/rough-sticks.ts`, `lib/purchase-scenarios.ts`, `lib/board-feet.ts`, `lib/panel-glueup.ts`, `components/BuyListPanel.tsx`.  
  - **Verify:** Short internal comment or diagram in plan appendix (optional) listing inputs/outputs per stage.  
  - **Rollback / risk:** None (docs only).

- [x] **Task 2 — 2D demand model (types + extraction)** — Parts → rectangles  
  - **Files / areas:** new `lib/buy-2d/types.ts` (or under `lib/purchase-2d/`), functions `partsToWidthLengthDemand(parts: Part[], opts): DemandPiece[]` with rules: solid vs `panel` status, quantity expansion, min dimension > 0.  
  - **Verify:** Unit tests: single part, quantity > 1, panel vs solid, skip invalid rough.  
  - **Rollback / risk:** Low (new module).

- [x] **Task 3 — Width feasibility + rip count heuristic** — Against `maxPurchasableBoardWidthInches`  
  - **Files / areas:** new `lib/buy-2d/width-fit.ts`; consume `maxPurchasableBoardWidthInches` + optional per-group override later.  
  - **Verify:** Tests: demand W ≤ stock W → 1 rip wide; demand W > stock W → ceil(W/stockW) rips or “cannot single board” flag; document integer vs fractional rip policy (integer rips + kerf between rips v2).  
  - **Rollback / risk:** Medium (wording must not imply exact yard count).

- [x] **Task 4 — Glue-up strip demand integration** — Align with `planPanelGlueUp`  
  - **Files / areas:** `lib/panel-glueup.ts`, `lib/buy-2d/glue-up-demand.ts`, wire from `Part` grain notes or `status === "panel"` + project max width.  
  - **Verify:** One regression case: wide panel → multiple strip widths sum to target; no double BF inflation (cross-check `boardFeetForPart`).  
  - **Rollback / risk:** Medium (must reconcile with assumptions column).

- [x] **Task 5 — Length packing on 2D “lanes”** — v1 simplified  
  - **Files / areas:** `lib/buy-2d/pack-boards-v1.ts`: for each material group, after rip grouping, run **existing** `packUniformStock` per **(rip bundle × rough L)** or per group max L — document chosen simplification.  
  - **Verify:** Test compares to current 1D stick count when all parts fit in one rip width (should be same order of magnitude).  
  - **Rollback / risk:** Medium.

- [x] **Task 6 — Wire into `PurchaseScenarioResult`** — Parallel summary  
  - **Files / areas:** `lib/purchase-scenarios.ts`, types in `purchase-scenarios.ts` or `buy-2d`.  
  - **Verify:** `evaluatePurchaseScenario` returns `twoDimensional?: { headline, detail, estimatedBoardsMin?, flags[] }` without breaking existing consumers.  
  - **Rollback / risk:** Low if optional field.

- [x] **Task 7 — Buy list + print UI** — Honest labeling  
  - **Files / areas:** `components/BuyListPanel.tsx`, `components/ShopPrintView.tsx`.  
  - **Verify:** Visible **“2D estimate”** section: assumptions (stock width, kerf policy), **not** merged into single “boards” line without label; mobile readable.  
  - **Rollback / risk:** Low.

- [x] **Task 8 — v2 hook: optional stock width presets per material group** — Without full SKU UI  
  - **Files / areas:** `lib/project-types.ts` (optional `stockWidthByMaterialGroup?: Record<string, number>`), `parseProject`, Setup or Materials UI.  
  - **Verify:** Override project default width for one species; 2D result changes predictably; legacy projects omit field → fallback.  
  - **Rollback / risk:** Medium (schema).

## Risks & rollback

- **Risk:** Users treat **estimated board count** as exact — mitigate with persistent **assumptions** and print copy.  
- **Risk:** **Double counting** panels vs strips — mitigate with one canonical demand path and tests against BF subtotals.  
- **Risk:** **Performance** on large part lists — mitigate with group-by-material early.  
- **Rollback:** Feature-flag 2D section in UI or omit `twoDimensional` from API until stable; 1D path remains default.

## Appendix (optional sketch)

**v1 flow:** `Part[]` → `DemandPiece[]` (W,L,qty,meta) → group by `materialGroupKey` → per group: rip lanes from stock width → per lane: 1D pack on L → aggregate board estimate + flags → UI next to existing scenario selector.

## Implementation notes (executed)

- **Modules:** `lib/buy-2d/*` (types, demand, width-fit, pack-boards-v1, estimate), `lib/purchase-pack.ts` (shared FFD packing extracted from `purchase-scenarios`).
- **`PurchaseScenarioResult.twoDimensional`:** always present; mirrors selected scenario’s length packing mode.
- **Project:** optional `stockWidthByMaterialGroup`; `BuyListPanel` per-group override input + `setMaterialGroupStockWidth` in `ProjectContext`.
- **Verify:** `npm run test` (78+), `npm run lint`, `npm run build`; Materials buy list shows 2D block; print view includes 2D summary when checkpoints pass.
