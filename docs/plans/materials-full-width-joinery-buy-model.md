# Plan: Materials full width, smarter joinery defaults, purchasable board width in buy math

## TLDR

- **Materials tab** uses a narrow centered column today (`max-w-[min(100%,480px)]` in `AppShellTabs`); change layout so shop content can use the full viewport width (with sensible internal grids, not one endless column of text).
- **Joinery flow** today asks the user to type groove depth, panel thickness, dado depth, tenon length, etc. (`JoineryPanel`); shift to **defaults computed from stock** (part finished thickness, rule presets, construction type) with **optional advanced override**, plus clearer copy that explains what was inferred.
- **Board count / “3 boards”** comes from **1D stick packing on rough length only** (`lib/purchase-scenarios.ts` + `rough-sticks`); it does **not** know how wide boards are at the yard. Add an explicit **purchasable board width** (project- or material-group–scoped) and surface **width-direction assumptions** in Materials (and print) so counts are not read as universal truth.
- **Glue-up messaging** in `lib/part-assumptions.ts` still references a **hardcoded** `PANEL_GLUE_UP_MAX_BOARD_WIDTH_IN` (20") in user-facing copy, while the dresser path can pass `maxPurchasableBoardWidth` into the carcass—**unify** so assumptions and planner use the same source of truth.

## Critical decisions

1. **Decision:** Treat **purchasable board width** as a **first-class project input** (Setup or Materials), not only inside Dresser glue-up fields. **Because:** buy-list and assumptions should stay consistent across presets (dresser, sideboard, board cuts). **Rejected:** Duplicating separate width fields per planner only (drifts and confuses).

2. **Decision:** Keep **stick-count heuristics** as **length-oriented** but add a **separate explicit line** for width/glue-up/rip narrative (even if v1 is conservative text + strip counts, not a full 2D optimizer). **Because:** pretending one number answers both dimensions misleads users. **Rejected:** Silently inflating stick count without explaining the model.

3. **Decision:** Joinery params default from **geometry + rule tables** (e.g. groove depth from nominal “¼ back” and stock thickness caps; tenon length from thickness scale). **Because:** matches shop mental model (“tell me what joint, I’ll size it”). **Rejected:** Removing overrides entirely (pros still need edge cases).

4. **Decision:** Full-width Materials layout = **remove artificial `max-w` shell**; use responsive **multi-column grid** on large screens (e.g. parts table + buy/joinery/rough sticks) similar to **Construction** tab’s two-column pattern. **Because:** uses screen real estate without unreadable line length. **Rejected:** Single ultra-wide single column of cards.

## Tasks

- [x] **Task 1 — Materials tab layout** — Unblock full-width shop panel  
  - **Files / areas:** `components/AppShellTabs.tsx` (shop branch ~`max-w-[min(100%,480px)]`), possibly `components/GrainlineApp.tsx` if `shopAside` order/grid needs tweaking.  
  - **Verify:** At desktop width, Materials tab content spans available width; mobile still stacks cleanly; no horizontal scroll regressions.  
  - **Rollback / risk:** Low (CSS/layout only).

- [x] **Task 2 — Project-level purchasable board width** — Single source of truth  
  - **Files / areas:** `lib/project-types.ts`, `lib/project-utils.ts` (`createEmptyProject`, `parseProject`), `components/ProjectSetupBar.tsx` (input + help text), optionally `components/BuyListPanel.tsx` (show current value in assumptions).  
  - **Verify:** New/legacy projects load; dresser/sideboard glue-up and buy copy can read the same field; tests in `lib/project-utils.test.ts` for parse defaults.  
  - **Rollback / risk:** Medium (schema-ish field); keep optional with safe default and legacy backfill.

- [x] **Task 3 — Unify glue-up assumptions with project width** — Fix 20" hardcode drift  
  - **Files / areas:** `lib/part-assumptions.ts` (replace `PANEL_GLUE_UP_MAX_BOARD_WIDTH_IN` usage in messages with project value), `lib/part-assumptions.test.ts`, `components/DresserPlanner.tsx` (wire to project field or remove duplicate local state if redundant).  
  - **Verify:** Regression fixture glue-up strings mention the configured width; dresser still validates glue-up planning.  
  - **Rollback / risk:** Low–medium (copy + one dependency on `Project` in assumption helpers—thread carefully).

- [x] **Task 4 — Buy list / scenarios: disclose 1D model + width caveat** — Honest “board count”  
  - **Files / areas:** `lib/purchase-scenarios.ts` (headline/detail strings or structured flags), `components/BuyListPanel.tsx`, `components/ShopPrintView.tsx`.  
  - **Verify:** UI states that stick count assumes **width already available** on purchased boards (or similar plain language); optional line like “wide panels may need extra boards / glue-ups per X″ max width.”  
  - **Rollback / risk:** Low (mostly copy + scenario metadata).

- [x] **Task 5 — Optional v1 width multiplier heuristic** — Narrow boards ⇒ more “effective” boards (conservative)  
  - **Files / areas:** `lib/purchase-scenarios.ts`, `lib/purchase-scenarios.test.ts`.  
  - **Verify:** With a narrow `purchasableBoardWidth`, groups whose rough **W** (or panel glue-up strip model) exceed width show **warning** or **adjusted narrative**, not a silent stick count; tests cover at least one edge case.  
  - **Rollback / risk:** Medium if math is wrong—keep behind clear “estimate” labeling.

- [x] **Task 6 — JoineryPanel: smart defaults + progressive disclosure** — Stop feeling like manual allowance entry  
  - **Files / areas:** `components/JoineryPanel.tsx`, possibly `lib/joinery/*.ts` (export “recommended params” helpers), `lib/joinery/types.ts` if needed.  
  - **Verify:** Opening joinery shows **pre-filled** groove/tenon/dado values from selected part thickness + rule; user can expand “Advanced” to edit; applying still produces same deterministic joints when defaults unchanged; manual spot-check on dresser + sideboard parts.  
  - **Rollback / risk:** Medium (UX + state); keep prior numeric behavior as the default path.

## Implementation notes (executed)

- **Sub-agents:** (1) Tasks 2–5 — project width, assumptions, purchase scenarios, Buy/Print. (2) Task 6 — `lib/joinery/recommended-params.ts` + `JoineryPanel`. (3) Task 1 — `AppShellTabs` + `GrainlineApp` split columns.
- **Verification:** `npm run test` (69), `npm run lint`, `npm run build` — all pass on merged tree.
- **Manual:** Wide viewport Materials vs Construction; Setup max board width; joinery recommended vs Advanced; buy list width warnings when cuts exceed max width.

## Risks & rollback

- **Risk:** Users interpret stick count as **final yard list**—mitigate with explicit dimension assumptions and print parity.  
- **Risk:** Auto joinery defaults wrong for atypical stock—mitigate with visible “recommended (from …)” and overrides.  
- **Rollback:** Layout-only revert is trivial; schema field can be ignored if reverted in parser with default.
