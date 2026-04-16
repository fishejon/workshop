# P0 — Fraction / rounding inventory (Grainline)

**Purpose:** Single reference for PM roadmap **P0-T1** (`docs/plans/pm-roadmap-execution-ladder.md`).  
**Source of truth:** `lib/imperial.ts`.

## Rules

| API | Default denominator | Use for |
|-----|---------------------|---------|
| `formatImperial(inches, denom?)` | **4** (`DEFAULT_DENOM`) | Internal / hobby-facing strings when not passed explicitly |
| `formatImperial(inches, 16)` | 16 | Dresser planner field display (`DresserPlanner` uses `FRACTION_DENOMINATOR = 16`) |
| `formatShopImperial` / `formatShopImperialInput` | **16** (`SHOP_FRACTION_DENOMINATOR`) | Parts table, print (`ShopPrintView`), buy list, yard copy, `GrainlineApp` milling blurb |

## Known inconsistency

- **Dresser planner inputs** use **1/16″** display; **generic `formatImperial` call sites** (e.g. some `lib/joinery/*`, `lib/archetypes/casework.ts` grain notes) use **¼″** unless passed `16`.
- **Mitigation (future slices):** Prefer `formatShopImperial` for any user-visible inch tied to the cut list or shop handoff; reserve `formatImperial` only where a different denominator is intentional, and pass the denominator explicitly.

## Verification

- `rg "formatImperial\\("` across `lib/` and `components/` — audit each call for shop vs internal context.
- `npm test` — `lib/imperial.test.ts` encodes shop 1/16″ expectations.
