# Joinery on main path — contract (spike, P1-T0)

**Status:** Pre-implementation contract for roadmap **P1**.  
**Related:** `docs/plans/pm-roadmap-execution-ladder.md`, `lib/main-path-joinery-flag.ts`, `docs/PRD.md`.

## Goal

Fold **selected** joinery from `/labs` into the same trust path as **Materials** (parts table, export, print), without breaking `validateProject(..., { joineryValidation: "cutList" })` defaults until explicitly enabled.

## Phasing

1. **Flag off (default):** Current behavior — cut list validation ignores joinery conflict collection; joinery applies in Labs only. `jointsEffectiveForCutList` in `lib/cut-list-scope.ts` returns `[]`, so CSV / print assumptions skip `project.joints`.
2. **Flag on (dev / slice PRs):** `NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1` — `validateProject` defaults to joinery `"full"` mode, and **`jointsEffectiveForCutList` returns `project.joints`**, so Materials, CSV, and shop print pick up the same joinery provenance as Labs experiments.
3. **Incremental rollout:** With the env flag on, **all** stored `project.joints` flow into assumptions/CSV/print (same as Labs). Tighten to “one rule family only” in a future slice if product needs a narrower blast radius—until then, treat the flag as **labs integration mode**, not end-user default.

## `/labs` coexistence

Until parity: **`/labs` remains** the place for graph editing, stick layout, and experimental rules. Main path shows **read-only or apply-from-preset** joinery only when the flag and slice allow.

## Non-goals (this contract)

- CNC / toolpaths, full 3D CAD, replacing Labs in one release.

## Sign-off

Product/founder: confirm when `NEXT_PUBLIC_GL_MAIN_PATH_JOINERY` may ship enabled for non-developer users (today it remains **off** in production builds).
