# Grainline

[![CI](https://github.com/fishejon/workshop/actions/workflows/ci.yml/badge.svg)](https://github.com/fishejon/workshop/actions/workflows/ci.yml)

Working title for a **hobbyist hardwood** planning app: **furniture presets** with shop math and a cut-list-first materials handoff.

## Presets

- **Dresser** — Overall W×H×D, **1–3 columns**, row-count, row-opening balancing (with per-row locks), kick/top/bottom/rail/back/rear-clearance, and slide + joinery allowances. Outputs opening size and drawer box W×H×D per cell with a centered **front/side/top** preview. Dresser case + drawer rows sync automatically into the shared cut list when math is valid.
- **Console template** — Shared casework engine path with shallow-depth drawer + open shelf defaults and optional face frame.
- **Bookshelf template** — Shared casework engine path with shelf-first defaults and optional base drawer.
- **Board cut list** — Kerf, stock length vs vehicle max, parts → packed boards (shop display rounds to **1/16″**).
- **TV console (experimental)** — Opt-in early-access shell from W×H×D. **Standing cabinet** — queued.

**Important:** Slide numbers are **rules of thumb**. Confirm every clearance against your **slide manufacturer’s** worksheet (especially undermount).

## Project / outputs (current app path)

- **Tabs** — **Project** (defaults + preset selection), **Plan** (intent inputs + preview), **Materials** (yard list, cut layout, parts table). Materials is blocked while there are blocking validation issues. Joinery and rough-stick nesting live on **`/labs`**. By default the **Materials** cut list, CSV, **`/print`**, and cut-list validation **ignore `project.joints`**; set **`NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1`** in `.env.local` when you want Labs joinery to affect those outputs (see [USER_GUIDE](docs/USER_GUIDE.md)). State persists in `localStorage` (`grainline-project-v1`).
- **Parts table** — finished vs rough T×W×L (in), manual rough toggle, provenance pills, explicit assumptions per row, **Why?** explainer, and CSV export.
- **Materials** — yard list and cut layout at top, followed by the source parts table.
- **Joinery** — Groove/back, dado shelf width, M&T rail/stile, and **thickness-aware drawer joinery presets** with formula/provenance labeling.
- **Shop mode** — **`/shop`** (link from **Project**): read-only large-type status (parts count, export readiness, blockers); edit on the main planner.
- **Print** — `/print` shop sheet; PDF via browser **Save as PDF**.

Glue-up assumptions use a shared panel glue-up planner so table/print/CSV stay in sync.

## Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — how to use the app (tabs, presets, shop, print, storage).  
- [docs/WOODWORKER_CHECKLIST.md](docs/WOODWORKER_CHECKLIST.md) — tab order and readiness before shop handoff.  
- [docs/plans/woodworker-gaps.md](docs/plans/woodworker-gaps.md) — honest backlog + release DoD slice (dresser + board pack).  
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — repo layout, scripts, tests, extending joinery.  
- [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md) — internal strategy memo (north star, wedge, pillars, phased roadmap, MVP, risks).  
- [docs/PRD.md](docs/PRD.md) — product requirements (Workshop Companion / Grainline).  
- [docs/PLAN.md](docs/PLAN.md) — phased implementation plan aligned with the PRD.
- [docs/FURNITURE_CONFIG.md](docs/FURNITURE_CONFIG.md) — configuration schema for template-driven casework.
- [docs/TEMPLATE_SYSTEM.md](docs/TEMPLATE_SYSTEM.md) — template architecture and save/load workflows.

## Run

```bash
npm install
npm run dev
```

```bash
npm run test    # unit tests (Vitest)
```

Open [http://localhost:3000](http://localhost:3000).

**Optional:** in `.env.local`, set `NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1` to include Labs joinery in the Materials cut list, CSV, and print (default is off). Details: [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4.

## Layout note

Symmetric dressers only: same drawer grid in every column. Face frames, inset reveals, and overlay details are not modeled yet—adjust clearances manually.
