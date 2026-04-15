# Plan: Dresser smarter labels, row-height UX, and output simplification

## TLDR
- Replace `GL-*` labels with **grouped shorthand labels** like **`A-1`, `A-2`** where the **prefix identifies a build group** (drawer box / glued panel / component) and the suffix is the piece index within that group.
- Make **row opening heights auto-balance** so edits keep the set summing to the available drawer-zone height (with a clear “lock this row” affordance and a predictable rule for which rows adjust).
- Reorder Dresser inputs so **layout/back/slides** are entered **before** row-opening heights; remove “joinery style” controls that no longer drive calculations.
- Fix “back-solve overall height” clarity by making the **visual preview reflect row openings** (not an alternate hidden set) and by renaming/rewriting copy around “what is being solved.”
- Move “Calculated outputs” off the Dresser panel and into **Materials**, with **way less text** (numbers first; assumptions collapsed).

**Explicitly not included:** changing the underlying dresser engine geometry, new joinery calculations, or altering the Parts table / CSV schema beyond label fields.

## Critical decisions
1. **Decision:** Introduce a **`shopLabelGroupId`** concept (derived, not user-entered) and generate labels as `<groupPrefix>-<index>`. **Because:** prefix must encode “goes together” (drawer box / glue-up component), which a flat sequence cannot. **Rejected:** keeping global `GL-<seq>` and hoping users infer grouping.
2. **Decision:** Keep **label generation deterministic** and stable across pack reorder; labels key off **instance ids** but *group prefix* keys off **group id**. **Because:** pack order changes; grouping shouldn’t. **Rejected:** prefix from board index.
3. **Decision:** Row-height auto-balance uses a **single source of truth**: “drawer zone budget” from kick/top/bottom/rails and row count. **Because:** avoids backsolve confusion and ensures preview is consistent. **Rejected:** maintaining separate “backsolve heights” state.
4. **Decision:** Remove joinery UI only where it’s not driving the engine; keep any remaining allowances as hidden constants (or move to Materials “advanced”). **Because:** users asked to remove joinery style; we must not silently change drawer box sizing without an explicit alternative. **Rejected:** deleting allowances while calculations still depend on them.
5. **Decision:** “Calculated outputs” becomes a **Materials-first artifact** with terse cards + collapsible assumptions. **Because:** Dresser tab should feel like intent entry, not a wall of derivation text. **Rejected:** sprinkling more copy on the Dresser tab.

## Tasks
- [x] **Task 1 — Smarter grouped labels (data + helpers)** — Add a pure grouping/labeling layer that produces:
  - `roughInstanceId -> shopLabel` where `shopLabel` is `A-1`, `A-2`, …
  - `roughInstanceId -> shopLabelGroupId` (for debug + future UI)
  - **Files/areas:** `lib/shop-labels.ts`, `lib/rough-sticks.ts`, `lib/rough-instance-id.ts`
  - **Grouping rules (v1):**
    - **Drawer box:** group by a derived drawer identifier (e.g. `Drawer R{row}C{col}`) so each drawer’s parts share a prefix (expect 5-ish pieces per drawer depending on model).
    - **Panel/glue-up:** group by `part.id` (or a dedicated `panelGroupKey` if the engine emits strips) so glue-up strips share a prefix.
    - **Everything else:** group by `part.id` so multiple instances of the same component share a prefix.
  - **Verify:** unit tests for label determinism; prefixes differ across groups; `A-*` group count matches expected drawer pieces in a sample dresser project.

- [x] **Task 2 — Thread grouping through pack visuals** — Replace the current `shopLabelByRoughInstanceId` maps in stick visuals to use the new grouped labels.
  - **Files/areas:** `components/PackedStickCutStrip.tsx`, `components/RoughStickLayout.tsx`, `components/CutListYardSummary.tsx`, `components/CutPlanner.tsx`
  - **Verify:** stick segments show only `A-1` style labels; assembly guide uses same label values.

- [x] **Task 3 — Assembly guide matches grouped labels** — Update `/print` “Shop labels & assembly guide” so it sorts by group prefix then index, and uses the grouped shorthand format.
  - **Files/areas:** `components/ShopPrintView.tsx`, `lib/shop-labels.ts`
  - **Verify:** print view shows grouped order; labels match stick layout exactly.

- [x] **Task 4 — Dresser row heights auto-balance** — Implement a controlled update function:
  - When editing row \(i\), adjust **unlocked** rows to keep \(\sum heights = budget\) (within rounding tolerance).
  - Add “lock row” toggles (per row) and a “distribute remainder” fallback.
  - **Files/areas:** `components/DresserPlanner.tsx`, `lib/dresser-engine` helpers if needed
  - **Verify:** editing one row preserves total; no negative heights; row count changes still produce sane defaults.

- [x] **Task 5 — Reorder inputs + remove joinery style UI** — Move “layout/back/slides” above row-opening heights, because they constrain budget. Remove the “joinery style” UI surface (case joinery reference + drawer joinery preset UI) or relocate any still-active numeric allowances into Materials “Advanced (drawer fit)”.
  - **Files/areas:** `components/DresserPlanner.tsx`
  - **Verify:** budget hint is computed from the earlier inputs; no dead joinery section; engine output unchanged (or explicitly adjusted) with a regression test.

- [x] **Task 6 — Fix back-solve clarity + preview consistency** — Replace the parallel “backsolve” inputs with one of:
  - **Option A (recommended):** delete backsolve panel and add a small inline “Suggested overall height” helper when row heights + constraints are set.
  - **Option B:** keep a backsolve mode but make it **the same row heights** the preview uses, and explain it as “solve outer height from these openings.”
  - **Files/areas:** `components/DresserPlanner.tsx`, `components/DresserPreview.tsx` (labels/copy only)
  - **Verify:** no second hidden heights; preview always reflects the row inputs shown above.

- [x] **Task 7 — Move calculated outputs to Materials, reduce text** — Remove/condense Dresser tab “Calculated outputs” and surface only what’s needed in Materials:
  - A small “Dresser outputs” card with 2–4 key numbers (interior width/height budget, drawer box deductions).
  - Collapsible assumptions (1–2 lines) instead of long paragraphs.
  - **Files/areas:** `components/DresserPlanner.tsx`, `components/BuyListPanel.tsx` (and/or a new `components/DresserOutputsCard.tsx`)
  - **Verify:** Dresser tab is intent-first; Materials shows the computed numbers; `/print` remains the shop artifact.

- [x] **Task 8 — QA + regression coverage** — Add/extend tests so changes don’t shift geometry silently.
  - **Files/areas:** `lib/dresser-regression.test.ts`, new tests for label grouping + row balancing helpers
  - **Verify:** `npm test` green; manual run through one dresser config.

## Risks & rollback
- **Risk:** Removing joinery UI could unintentionally change drawer box sizing if the engine still depends on allowances.  
  **Rollback:** keep allowances as advanced numeric inputs in Materials and default them to 0 (or previous defaults) with explicit labeling.
- **Risk:** Auto-balancing row heights can feel “fighty” if rules aren’t clear.  
  **Rollback:** add an “Auto-balance” toggle (off by default) and keep the old strict-sum validation.
- **Risk:** Grouped labels could confuse users if groups aren’t intuitive.  
  **Rollback:** show a tiny legend header per group in the assembly guide (e.g. “Drawer R2C1”) without adding it back onto the stick strips.

