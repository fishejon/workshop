# Workshop Companion — Product Requirements (v0.1)

Working title: **Workshop Companion** (Grainline is the current app codename.)

## Summary

A web app that turns **furniture intent** (overall size, structure, materials, shop limits) into **three reliable outputs**:

1. **Accurate part list** — finished sizes, quantity, grain orientation, joinery notes  
2. **Joinery-aware rough-cut list** — configurable allowances plus joinery deltas, with explicit “why”  
3. **Buy list** — grouped by **species, rough thickness, and realistic stock lengths** (including **max transport length**), with optional **linear layout** for sticks and thin panels  

The product is **not** a CAD system, structural engineering tool, or CNC path generator. It is a **planning layer** before milling, cutting, and assembly—optimized for **hardwood furniture** and **joinery-aware dimension translation**, not generic sheet-goods panel nesting alone.

## Problem

Woodworkers often have dimensional designs but must still **manually derive** part lists, rough stock sizes, and material totals—slow and error-prone. Useful planning must account for **kerf**, **material type**, **stock size**, **purchasing constraints**, and (for hardwood) **board-foot logic** tied to **rough** thickness/width/length—not only finished net sizes. Many existing tools emphasize **cut optimization** and panels; this product targets **furniture casework** where **joinery changes what you cut and buy**.

## Users

**Primary:** Furniture makers building mostly in **hardwoods**, **traditional or semi-traditional joinery**, thinking in **finished overall dimensions** first.

**Secondary:** Careful hobbyists who need **transport limits**, **preferred thicknesses**, and **solid vs panel** parts called out clearly.

## Non-goals (MVP)

- Full CAD, structural analysis, CNC toolpaths  
- Curved parts, compound angles, upholstery, bent lamination, room layouts  
- Machine-specific cut strategies for every setup (defer to **shop presets** later)

## Product principles

- **Three dimension layers**, always labeled: **design → finished part → rough stock**  
- **Assumptions visible**: kerf, waste %, milling margin, groove/slide rules, inside vs outside reference  
- **“Why this number”** on calculated parts (expandable notes)  
- **Calm, workshop-friendly UI**: warm neutrals, wood-toned accents; **project left / outputs right**; progressive disclosure over spreadsheet density by default  

## Core workflow (MVP)

1. **Project setup** — name, furniture type, overall dimensions, units (**imperial + fractions**), species/material by assembly, preferred thicknesses (e.g. 3/4, 1/2, 1/4 back), **max board length (transport)**, kerf, default milling allowance, grain preferences  
2. **Assemblies** — case, base, doors, drawers, shelves, back (rectangular forms)  
3. **Joinery rules** — per connection: mortise & tenon, dovetail, miter, dado/rabbet, groove / floating back; rules adjust **mate dimensions** and **rough stock**  
4. **Parts** — generated + editable table: name, assembly, qty, finished T×W×L, material, grain, joinery notes, rough T×W×L, status (e.g. needs milling, solid, panel)  
5. **Material planner** — board-foot style grouping (rough thickness for BF), waste + milling margin; optional sheet mode for backs  
6. **Buy list** — species, rough thickness class, suggested lengths **≤ transport cap**, width band if used, BF per group, waste notes, which parts map to which stock group  
7. **Outputs** — printable/exportable **finished list, rough list, milling summary, purchase summary**; optional **linear cut diagrams** where applicable  

## MVP feature set (condensed)

- Project setup with material defaults and stock constraints  
- Guided builder for **rectangular** tables, cabinets, chests, shelving, **simple drawers and doors**, backs  
- Joinery-aware part dimension rules (start narrow, expand)  
- Rough stock estimator and **board-foot**-style buy list  
- Exportable cut list / shop sheet  
- Linear stock layout (kerf, length limits) for applicable parts  

## Success metrics (MVP)

- Time to first **trusted** cut list  
- Share of projects **exported without full manual recalculation**  
- User-reported **trust in buy-list accuracy**  
- **Override rate** per part / per joinery rule  
- Frequency of **joinery rule** usage per project  

## Risks

- **Trust:** opaque math → users revert to paper/spreadsheets  
- **Overreach:** claiming one true shop method → expose assumptions and allow overrides  
- **Hardware variance:** slides, hinges, groove depths → **manufacturer presets**, not hidden magic numbers  

## Open decisions

| Topic | Options |
|-------|--------|
| Part derivation | Template-first vs assembly builder vs hybrid |
| Joinery configuration | Global defaults vs per-project vs per-connection |
| Purchase target | Rough dealer stock vs S4S retail vs dual mode |
| First-class export | Print vs shop mobile vs CSV |

## Phase 2 (out of MVP)

- Offcut reuse, stockyard/inventory mode  
- Richer door/drawer hardware presets  
- Sheet optimization views  
- Mobile-first shop mode  
- Expanded joinery library  

## References (external)

Industry articles and tools cited in the original foundation doc (cut-list best practices, board-foot calculators, linear optimizers, etc.) remain useful for validation copy and edge-case checklists; they are not duplicated here to keep this file maintainable.
