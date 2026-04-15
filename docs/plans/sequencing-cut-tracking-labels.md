# Plan: Sequencing, cut tracking on stick layout, and shop labels

## TLDR

- Ship **clickable 1D stick segments** (cut layout strips) that toggle a **“cut / have piece”** state with clear **green (or success-token) completed styling**, keyboard-friendly where cheap.
- Persist progress on the **Project** (localStorage) keyed by **stable rough-instance ids** (`partId` + `instanceIndex`), not by post-pack `(boardIndex, segmentIndex)` — packing order changes whenever lengths, kerf, or stock length change.
- Introduce a **short shop label** per rough instance (e.g. `A07`, `B-03`) shown on the strip, in tooltips, and in a new **Assembly / shop guide** block on **`/print`** (and optionally the main materials column) mapping label → assembly, part name, rough L, finished T×W×L.
- Wire the same strip behavior into **`RoughStickLayout`**, **`CutListYardSummary`** cut strips, and **`CutPlanner`** (local rows: `row.id` + instance index).
- **Explicitly not in this slice:** milling operation DAG, CNC toolpaths, mobile-only shop mode, multi-user sync, barcode scanning, or “optimal” assembly sequencing beyond a simple default order.

## Critical decisions

1. **Decision:** Track completion by **`roughInstanceId`** (`${partId}:${1-based instance}`), carried on `CutPiece` through `packUniformStock`. **Because:** FFD packing re-sorts pieces; board/segment indices are unstable across replans. **Rejected:** Storing `{ materialGroupKey, boardIndex, cutIndex }` only.

2. **Decision:** Store progress in **`project.cutProgressByRoughInstanceId: Record<string, "none" | "cut">`** (or boolean map + separate phase later). **Because:** One source of truth with CSV/print; survives tab changes; matches “I have this stick off the board” mental model. **Rejected:** Separate `localStorage` key disconnected from export/duplicate project.

3. **Decision:** **Deterministic shop labels** derived from a stable sort of instances (e.g. assembly id → part name → partId → instance) with a compact alphanumeric code, not user-editable in v1. **Because:** Avoids collisions and support burden; still pencil-friendly on boards. **Rejected:** Free-text per-piece labels in v1 (migration + validation cost).

4. **Decision:** When parts change, **orphan progress keys** are ignored in UI; optional small “Reset cut progress” control if mismatches accumulate. **Because:** Cheap resilience without blocking edits. **Rejected:** Hard-blocking part edits when progress exists.

5. **Decision:** Reuse one **shared presentational/interaction component** for strips (`BoardCutStrip` / `InteractiveCutStrip`) fed by packed boards + lookup for `roughInstanceId` + label + progress. **Because:** `CutPlanner`, `RoughStickLayout`, and `CutListYardSummary` currently duplicate strip markup. **Rejected:** Copy-paste styling changes in three files.

## Tasks

- [x] **Schema + migration** — Add `cutProgressByRoughInstanceId` (and optionally `cutProgressVersion: 1` for future) to `Project` in `lib/project-types.ts`; extend `serializeProject` / `parseProject` in `lib/project-utils.ts` with safe defaults for legacy JSON. — Verify: unit test parse round-trip; load old fixture if any exists.

- [x] **Stable rough instances** — Extend `RoughCutPiece` in `lib/rough-sticks.ts` to `{ partId, instanceIndex, lengthInches, label }`; expand from `Part` quantity preserving id. — Verify: `lib/rough-sticks` tests or new test file for expansion counts and ids.

- [x] **CutPiece identity** — Add optional `roughInstanceId: string` to `CutPiece` in `lib/optimize-cuts.ts`; ensure `packUniformStock` preserves fields when copying/sorting pieces. — Verify: `lib/optimize-cuts` tests (or existing) assert ids survive pack.

- [x] **Label map pure helper** — New `lib/shop-labels.ts` (name TBD): `buildRoughInstanceLabelMap(project.parts): Map<string, string>` using deterministic ordering; document format in file header (e.g. `GL-` prefix + base36 index). — Verify: Vitest table-driven cases for stable ordering with reorder parts.

- [x] **ProjectContext API** — Add `toggleCutProgress(roughInstanceId)` / `clearCutProgress()` in `components/ProjectContext.tsx` updating project immutably. — Verify: manual toggle in dev; no extra re-renders beyond state update.

- [x] **Shared interactive strip** — Extract or create component under `components/` (e.g. `PackedStickCutStrip.tsx`) with: segment button/role, `aria-pressed`, completed class (use existing `--gl-*` success or muted green per `agent-ui` tokens if present), shows **shop label** + length, list mirrors state. — Verify: keyboard activate; color contrast in dark theme.

- [x] **Integrate strips** — Replace inline maps in `RoughStickLayout.tsx`, `components/CutListYardSummary.tsx` (`BoardCutStrip`), and `CutPlanner.tsx` with shared component + props for read-only vs interactive. — Verify: dresser + board preset manual pass; yard summary still read-only or interactive per product choice (default: **interactive** so yard matches bench).

- [x] **CutPlanner local progress** — Use `useState` keyed by `rowId:instance` (same strip UX) since no `Project`; document limitation: not in library backup. — Verify: submit + toggle without project.

- [x] **Assembly / shop guide (print)** — In `components/ShopPrintView.tsx`, add section: table columns **Label | Assembly | Part | Rough L | Finished T×W×L | Notes** sorted same as label map; optional one-line “Suggested cut order” copy = **rough pack order** with caveat that assembly order may differ. — Verify: `/print` preview; checkpoint gates unchanged.

- [ ] **Optional: Materials column teaser** — If low cost, link or collapse “Shop labels” under parts / rough layout; otherwise defer. — Verify: none if deferred; checkbox stays `[ ]` with note.

- [x] **Tests sweep** — Update `lib/lumber-vehicle-summary.test.ts` if `CutPiece` shape affects fixtures; add strip helper tests. — Verify: `npm test` green.

## Risks & rollback

- **Risk:** Project JSON size grows slightly with many parts; negligible vs parts array itself. **Rollback:** Remove new fields from type + parser; progress keys become no-ops in old builds.
- **Risk:** Users confused when replan moves a piece to another stick — **mitigation:** labels stay on the *part instance*, not the board; UI copy: “Progress follows the part, not the slot.”
- **Risk:** `CutPlanner` preset parts use ephemeral ids — **mitigation:** document; future could sync to `Project.parts` if board preset writes through.
