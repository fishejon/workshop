# Post-MVP plan — From dresser app to furniture planning system

This plan turns the `do it.md` direction into a ranked backlog and engineering-ready ticket set aligned with current implementation status in `docs/PLAN.md`.

## Release theme

**From dresser app to furniture planning system.**

## Ranked backlog (P0 / P1 / P2)

### P0 — Core model reuse + construction trust (next 1-2 releases)

1. **Reusable casework archetype (Epic 1)**
2. **Joinery as a construction system (Epic 2)**
3. **Scenario-based purchase planning (Epic 3)**

### P1 — Reuse and workflow acceleration

4. **Reusable projects/templates (Epic 4)**
5. **Guided planning UX (Epic 5)**
6. **Next flagship family: archetype-backed console/sideboard (Epic 6)**

### P2 — Memory, continuity, intelligence

7. **Workshop memory (Epic 7)**
8. **Persistence/continuity (Epic 8)**
9. **Assistive intelligence (Epic 9)**

---

## Milestones

### M1 — Reusable Casework Core

Ship one generalized casework model that powers dresser and TV console.

**Exit criteria**
- Dresser and console use the same archetype engine.
- Assembly definitions are reusable and preset UI is thin.
- No regressions in current dresser outputs, buy list, print, CSV.

### M2 — Construction Logic System

Promote joinery from ad hoc rule use to assembly-level construction logic.

**Exit criteria**
- Connection-level modeling exists (part-to-part relation, not only single-part adjustment).
- Joinery presets apply across assemblies.
- Construction logic is inspectable and explains dimensional deltas.

### M3 — Purchase Planning Decisions

Move from “totals” to “decision support” for buying.

**Exit criteria**
- At least three buy scenarios (waste, board count, transport-fit).
- Stock framing (surfaced vs rough) is explicit in UI/print.
- Purchase-plan summary appears above raw totals.

---

## Engineering-ready tickets

## Epic 1 — Reusable construction archetypes

- [x] **T1.1 Create `CaseworkArchetype` domain model**
  - Scope: abstract carcass + drawers + shelves into reusable assembly definitions.
  - Likely files: `lib/dresser-carcass.ts`, `lib/dresser-engine.ts`, new `lib/archetypes/casework.ts`.
  - Acceptance:
    - Archetype can represent dresser and console without branching logic in UI.
    - Existing dresser regression tests still pass.

- [x] **T1.2 Extract assembly definitions from planner UI**
  - Scope: move assembly defaults/config out of `DresserPlanner`.
  - Likely files: `components/DresserPlanner.tsx`, new `lib/archetypes/assemblies.ts`.
  - Acceptance:
    - Planner consumes assembly definitions via config, not inline constants.

- [x] **T1.3 Refactor TV console stub to archetype-backed planner** *(initial: `buildConsoleShellCasework` in `lib/archetypes/casework.ts`)*
  - Scope: remove stub-specific dimensional logic and wire to shared casework archetype.
  - Likely files: `components/TvConsoleStub.tsx`, `components/GrainlineApp.tsx`, archetype libs.
  - Acceptance:
    - Console parts generation uses same assembly model as dresser.

## Epic 2 — Joinery as construction system

- [x] **T2.1 Add connection-level joinery model**
  - Scope: explicit connection entity (partA, partB, faces/edges, rule, params).
  - Likely files: `lib/project-types.ts`, `components/JoineryPanel.tsx`, `lib/joinery/types.ts`.
  - Acceptance:
    - Joinery can be defined as part-to-part connection and replayed deterministically.

- [x] **T2.2 Add high-value joinery presets by construction type**
  - Scope: presets for frame-and-panel, dovetailed drawer box, grooved back case.
  - Likely files: `lib/joinery/*`, `components/JoineryPanel.tsx`.
  - Acceptance:
    - Preset applies multiple underlying rules with clear explanation text.

- [x] **T2.3 Construction logic panel**
  - Scope: replace flat history with structured panel grouped by assembly/connection.
  - Likely files: `components/JoineryPanel.tsx`, `lib/part-provenance.ts`.
  - Acceptance:
    - User can inspect “why this dimension changed” from connection to part output.

## Epic 3 — Scenario-based purchase planning

- [x] **T3.1 Implement buy scenarios engine**
  - Scope: strategy modes: `minWaste`, `minBoardCount`, `fitTransport`, `simpleTrip`.
  - Likely files: `lib/board-feet.ts`, `lib/rough-sticks.ts`, new `lib/purchase-scenarios.ts`.
  - Acceptance:
    - Same project can be evaluated under multiple scenario outputs.

- [x] **T3.2 Add surfaced-vs-rough framing**
  - Scope: make assumption layer explicit in buy list and print calculations/copy.
  - Likely files: `components/BuyListPanel.tsx`, `components/ShopPrintView.tsx`, docs.
  - Acceptance:
    - Assumptions called out with clear labels and influence on totals explained.

- [x] **T3.3 Optional cost model by material group**
  - Scope: cost per BF/LF inputs and scenario cost comparisons.
  - Likely files: `lib/board-feet.ts`, `components/BuyListPanel.tsx`.
  - Acceptance:
    - Purchase summary includes estimated total cost by scenario.

## Epic 4 — Reusable projects and templates

- [x] **T4.1 Duplicate project**
  - Scope: “duplicate current project” flow in Setup.
  - Likely files: `components/ProjectSetupBar.tsx`, `components/ProjectContext.tsx`.
  - Acceptance:
    - Cloned project keeps parts/joints but new id/name.

- [x] **T4.2 Save/load templates**
  - Scope: template serialization and apply template to new project.
  - Likely files: `lib/project-utils.ts`, `components/ProjectSetupBar.tsx`.
  - Acceptance:
    - User can save and reapply template without editing raw JSON.

- [x] **T4.3 Assembly/part-group duplication**
  - Scope: duplicate selected assembly group for iteration.
  - Likely files: `components/PartsTable.tsx`, `components/ProjectContext.tsx`.
  - Acceptance:
    - Group duplication preserves provenance and avoids id collisions.

## Epic 5 — Guided planning UX

- [x] **T5.1 Guided sequence shell**
  - Scope: add step framing over existing tabs (Setup -> Construction -> Materials -> Review).
  - Likely files: `components/AppShellTabs.tsx`, `components/GrainlineApp.tsx`.
  - Acceptance:
    - User always sees current step and remaining steps.

- [x] **T5.2 Checkpoint screens**
  - Scope: explicit checkpoints for material assumptions and joinery review before print/export.
  - Likely files: `components/ShopPrintView.tsx`, `components/BuyListPanel.tsx`.
  - Acceptance:
    - Review step blocks export until critical assumptions acknowledged.

## Epic 6 — Next flagship family

- [x] **T6.1 Archetype-backed sideboard/console planner**
  - Scope: implement one additional family from shared casework model.
  - Likely files: archetype libs + console components.
  - Acceptance:
    - New family reuses joinery/material planning pipeline fully.

## Epic 7/8/9 — Later-phase enablers

- [x] **T7.x Workshop memory**: saved lumber profiles, offcut mode *(starter slice implemented).*
- [x] **T8.x Continuity**: file import/export, local backup/restore, project list/archive *(starter slice implemented).*
- [x] **T9.x Assistive**: geometry warnings, recommendation defaults, change explainers *(starter slice implemented).*

---

## Suggested execution order

1. Epic 1 (T1.1 -> T1.2 -> T1.3)
2. Epic 2 (T2.1 -> T2.2 -> T2.3)
3. Epic 3 (T3.1 -> T3.2 -> T3.3)
4. Epic 4 + Epic 5 in parallel where possible
5. Epic 6
6. Epic 7/8/9

---

## Quality gates per milestone

- `npm run test`
- `npm run lint`
- `npm run build`
- Manual run-through: Setup -> Build -> Shop -> Print for at least one realistic dresser project

