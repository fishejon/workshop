# Grainline — development guide

Orientation for working in this Next.js repo: layout, state, domain libraries, and how to extend joinery.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (App Router). |
| `npm run build` | Production build + TypeScript check. |
| `npm run lint` | ESLint. |
| `npm run test` | Vitest (unit tests under `lib/**/*.test.ts`). |
| `npm run test:watch` | Vitest watch mode. |

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**.
- Client-only project state (no API database in MVP).

---

## Repository layout (high level)

```
app/                 # Routes: /, /print
components/          # UI: GrainlineApp, tabs, planners, parts, shop panels
lib/
  imperial.ts        # Parse/format imperial lengths
  project-types.ts   # Project, Part, ProjectJoint, assemblies
  project-utils.ts   # createEmptyProject, parse/serialize, deriveRough, ids
  board-feet.ts      # BF + LF grouping for buy list
  part-provenance.ts # Part provenance summary + joinery rule label formatting
  dresser-engine.ts  # Dresser openings / drawer grid math
  dresser-carcass.ts # Case part specs from outer dims
  optimize-cuts.ts   # 1D bin packing (board cuts + rough sticks)
  rough-sticks.ts    # Rough lengths derived from parts list
  joinery/
    types.ts         # JointRuleId, JointSpec, …
    groove-back.ts   # Floating back panel deltas
    dado-shelf.ts    # Shelf width vs dado depth
    mortise-tenon.ts # Rail / stile L deltas
docs/                # PRD, PLAN, strategy, USER_GUIDE, this file
vitest.config.ts     # Vitest + `@/*` path alias
```

---

## Application entry

- `app/page.tsx` — Wraps content in `ProjectProvider` + `GrainlineApp`.
- `app/print/page.tsx` — Read-only **ShopPrintView**; hydrates project from `localStorage` (`STORAGE_KEY` in `lib/project-utils.ts`).

---

## State and persistence

- **`ProjectProvider`** (`components/ProjectContext.tsx`) holds the live `Project`.
- **`useEffect`** writes `serializeProject(project)` to `localStorage` after hydration.
- **`Project`** includes `parts[]` and **`joints[]`** (`ProjectJoint`: rule id, part ids, optional mate/edge labels, params, explanation, finished before/after).

Mutators of note:

- **`clearParts`** — Clears `parts` and **`joints`**.
- **`removePart`** — Drops joints whose `primaryPartId` or `matePartId` matches the removed part.
- **`replacePartsInAssemblies`** — Replaces parts only within selected assemblies (used by dresser handoff), preserving other project parts and cleaning affected joints.

---

## Dresser handoff behavior

- `DresserPlanner` supports staged append actions (case or drawer parts) and a combined handoff path:
  - append full dresser set
  - replace dresser assemblies (`Case`, `Base`, `Back`, `Drawers`)
- The replace path uses `replacePartsInAssemblies` to avoid destructive full-table replacement.

---

## Adding a joinery rule

1. Add an id to **`JointRuleId`** in `lib/joinery/types.ts`.
2. Implement a pure function in `lib/joinery/<rule>.ts` returning `{ explanation, finishedDimensionDeltas }` (see existing files).
3. Wire **`JoineryPanel`**: rule option, parameter inputs, branch in `ruleResult` / `invalidInputs` / `params` in `applyRuleToSelected`.
4. Add **`RULE_LABELS`** for history display.
5. Add **`lib/joinery/<rule>.test.ts`** and run `npm run test`.

---

## Buy list and CSV

- **`groupPartsByMaterial`** (`lib/board-feet.ts`) produces groups with BF and LF subtotals and waste-adjusted totals.
- **CSV** (`components/PartsTable.tsx`) includes `board_feet_*` and `linear_feet_*` columns using `boardFeetForPart` / `linearFeetForPart`.

---

## Testing

- Tests live next to code: `*.test.ts` under `lib/`.
- Vitest resolves `@/` to the repo root (see `vitest.config.ts`).
- Current regression coverage includes:
  - joinery rule unit tests (`lib/joinery/*.test.ts`)
  - board-foot / lineal-foot totals (`lib/board-feet.test.ts`)
  - part provenance helpers (`lib/part-provenance.test.ts`)
  - canonical dresser fixture regression (`lib/dresser-regression.test.ts`, `lib/fixtures/dresser-regression.fixture.ts`)

---

## Product documentation

| Doc | Audience |
|-----|----------|
| [USER_GUIDE.md](./USER_GUIDE.md) | End users / makers. |
| [PRD.md](./PRD.md) | Requirements. |
| [PLAN.md](./PLAN.md) | Implementation phases. |
| [PRODUCT_STRATEGY.md](./PRODUCT_STRATEGY.md) | Strategy. |
