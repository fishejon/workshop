# Plan: PM roadmap — execution ladder (Grainline)

## TLDR

- **Ship first:** Trust core (Phase 0) and **joinery on the main path** (Phase 1) in **small vertical slices**—each slice touches `lib/` + UI + print/CSV only when the slice owns exports.
- **Defer:** Full CAD, CNC/toolpaths, structural engineering, production sheet nesting as hero scope, ERP-style inventory (remain positioning per `docs/PRODUCT_STRATEGY.md` / `docs/VISION_TRUSTED_COMPANION_AND_CAD.md`).
- **Doc hygiene:** After each shipped slice, reconcile `docs/PRD.md`, `docs/USER_GUIDE.md`, and `.cursor/rules/agent-ux.mdc` / `agent-frontend.mdc` tab language with **Project → Plan → Materials**.
- **Cadence:** One slice = one mergeable unit with Vitest for math, manual print/CSV when exports change.

## Critical decisions

1. **Decision:** Execute roadmap **phase order** (0 → 1 → 2 …), not parallel “everything at once.” **Because:** trust and provenance are the wedge; depth without correctness erodes the product. **Rejected:** Starting CAD-lite (Phase 5) before joinery + buy trust are boringly solid.

2. **Decision:** Joinery moves from **`/labs` to main path** only behind **explicit feature flags + migration-safe project shape**, with the same validation/export contracts as today unless PRD is updated. **Because:** avoids silent cut-list drift and localStorage surprises. **Rejected:** Big-bang removal of `/labs` before replacement surfaces exist.

3. **Decision:** “Shop mode” and “hardware schedule” wait until **Phase 2–3** unless a Phase-0 bug forces a minimal copy fix. **Because:** roadmap sequencing; prevents scope bleed. **Rejected:** Bundling hardware schedule into the first joinery slice.

## Tasks — Phase 0 (Trust core, ongoing)

- [x] **P0-T1 — Fraction / rounding audit** — Document and reduce ¼″ vs ⅛″ vs 1/16″ inconsistencies called out in `agent-backend.mdc` (parts table, print, buy). Likely: `lib/imperial.ts`, call sites in `components/PartsTable.tsx`, `components/ShopPrintView.tsx`, planners. **Verify:** grep denominators; spot-check one dresser project print vs Materials; Vitest if a pure helper is extracted.

- [x] **P0-T2 — Validation copy passes** — Ensure blocking issues always say **which tab/section** fixes them (`components/` + `lib/validation`). **Verify:** manual: introduce blocking issue per category; eslint on touched files.

- [x] **P0-T3 — Export / print parity** — Any change to `cutListExportCheckpointsReady` / `canExportOrPrintProject` must update **Materials + Project** copy in lock states (`PartsTable`, `ProjectSetupBar`, `ShopPrintView`). **Verify:** `rg "Review"` in `components/` is zero or intentional; `npm test`.

- [x] **P0-T4 — Explainability baseline** — Pick **one** high-traffic derived field (e.g. rough from finished + allowance) and ensure “why” UI exists or is linked from `docs/USER_GUIDE.md`. **Verify:** USER_GUIDE sentence + manual click path.

## Tasks — Phase 1 (Joinery on main path)

- [x] **P1-T0 — Spike: joinery-on-main contract** — Write a short ADR or plan subsection: which `project.joints` / connections rules ship on main path first; what `/labs` keeps. Files: `docs/plans/` or `docs/`. **Verify:** team/founder sign-off in issue or PR description.

- [x] **P1-T1 — Feature flag** — Introduce `NEXT_PUBLIC_*` or internal constant for “main-path joinery” (default off until ready). Files: `lib/` flag module, `lib/cut-list-scope.ts` / consumers as needed. **Verify:** flag off = identical behavior to today; tests.

- [x] **P1-T2 — Apply path** — Wire **one** joinery rule family from labs into the same pipeline that feeds `PartsTable` / export (per spike), with provenance row in UI. Files: `lib/joinery/*`, `components/ProjectContext.tsx` or planners, `PartsTable` / modals. **Verify:** Vitest for delta math; golden project fixture; no new blocking issues on default dresser fixture.

- [x] **P1-T3 — Labs coexistence** — Until parity: `/labs` remains; add UI copy that states which joinery affects **Materials vs labs-only**. Files: `components/` labs entry, `docs/USER_GUIDE.md`. **Verify:** manual navigation; no contradictory headers.

- [x] **P1-T4 — Print / CSV** — If joinery changes finished dimensions on main path, extend `ShopPrintView` / CSV columns only as needed for **trust** (not duplicate entire labs UI). **Verify:** print preview + CSV spot-check on fixture project.

## Tasks — Phase 2 (Buy + cut intelligence) — milestone

- [x] **P2-M1 — Purchase scenarios UX** — Deepen `lib/purchase-scenarios.ts` outcomes in **Materials / buy** surfaces (copy + layout), not new algorithms unless PRD adds them. **Verify:** `npm test` (`purchase-scenarios.test.ts`); manual one transport-cap scenario.

- [x] **P2-M2 — Hardware schedule v0** — Consolidated drawer/slide **quantities + “confirm manufacturer”** block in print and/or Materials (no fake SKU DB). **Verify:** print once; USER_GUIDE update.

## Tasks — Phase 3 (Shop execution) — milestone

- [x] **P3-M1 — Shop mode shell** — Read-only or checkoff-first route/variant: large type, hide planner chrome; reuses `ProjectContext`. **Verify:** manual on phone or narrow viewport; a11y spot-check.

- [x] **P3-M2 — Build packet narrative** — Single ordered “build story” section (parts → rough → buy) linking existing surfaces before new data. **Verify:** USER_GUIDE + one user test.

## Tasks — Phase 4 (Project memory & templates) — milestone

- [x] **P4-M1 — Template UX review** — Audit `localStorage` template flows in `lib/project-utils.ts` + UI; gaps → issues list. **Verify:** duplicate project, rename, restore from template.

- [x] **P4-M2 — Migration discipline** — Any `Project` shape change: version bump + tests in `project-utils.test.ts`. **Verify:** old fixture JSON still parses.

## Tasks — Phase 5 (Spatial / CAD-lite) — milestone

- [ ] **P5-M1 — Geometry SSOT** — **Deferred:** persist `Project.geometry` from CAD-lite plan until a dedicated slice; current code remains derive-only from parts + `parseProject` validation.

- [ ] **P5-M2 — Views tab / split** — **Deferred** until P5-M1.

## Tasks — Phase 6 (Intelligent workshop) — milestone

- [x] **P6-M1 — Offcut / inventory discovery** — PRD-aligned spike doc; no persistence until data model ADR. **Verify:** doc + non-goal check with `PRODUCT_STRATEGY.md`.

## Tasks — Cross-phase hygiene (parallel, low risk)

- [x] **X-T1 — Canonical docs** — When Phases 0–1 move: update `docs/PRD.md` non-goals vs CAD-lite roadmap pointer; link `docs/VISION_TRUSTED_COMPANION_AND_CAD.md` from `PRODUCT_STRATEGY.md` if not already.

- [x] **X-T2 — Cursor rules** — Align `agent-ux.mdc` / `agent-frontend.mdc` flows with **Materials** (no Review / Cut list confusion).

## Risks & rollback

- **Joinery on main path:** Highest risk is **silent dimension drift** and broken saves — mitigate with **flags**, **Vitest**, **migration tests**, and **print/CSV** checks each slice. **Rollback:** flip flag off; revert slice PR.

- **localStorage limits / schema churn:** Large joinery or geometry payloads — monitor size; prune optional fields. **Rollback:** migration that strips new keys (forward-compatible parse already preferred).

- **Scope creep:** Each PR must name which **phase + task id** it satisfies (e.g. “P1-T2”); otherwise defer.
