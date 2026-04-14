# Grainline

Working title for a **hobbyist hardwood** planning app: **furniture presets** with shop math and a **2D purchase estimator** (width-lane + length packing).

## Presets

- **Dresser** — Overall W×H×D, **1–3 columns**, **row count** with **weight-based row heights** (e.g. `2, 2, 1` = two taller rows + one shorter). Enter kick, top assembly, bottom panel, rails between drawers, back, rear clearance, and **slide preset / clearances**. Outputs **opening size** and **drawer box W×H×D** per cell (R1C1, …), with a **front schematic**. **Back-solve overall height** from target opening heights when you know row sizes but not the case height. Includes dresser handoff controls for appending or replacing dresser assemblies in the parts list.
- **Board cut list** — Kerf, stock length vs vehicle max, parts → packed boards (1/4″ display).
- **TV console (experimental)** — Opt-in early-access shell from W×H×D. **Standing cabinet** — queued.

**Important:** Slide numbers are **rules of thumb**. Confirm every clearance against your **slide manufacturer’s** worksheet (especially undermount).

## Project / outputs (PRD path)

- **Tabs** — **Setup** (project name, milling allowance, max transport length, waste %, print link, reset), **Build** (presets + shop column), **Shop** (parts, buy list, joinery, rough sticks), **About**. State persists in `localStorage` (`grainline-project-v1`).
- **Parts table** — finished vs rough T×W×L (in), manual rough toggle, provenance pills, explicit **joinery + glue-up assumptions** per row, **Why?** explainer, **CSV export** (includes BF/LF + detailed provenance columns).
- **Buy list** — board feet and **lineal feet** from **rough** dims, grouped by material + thickness category, plus **2D board estimate** (width-lane expansion + constrained length packing) with per-group stock width overrides.
- **Joinery** — Groove/back, dado shelf width, M&T rail/stile, and **thickness-aware drawer joinery presets** with formula/provenance labeling.
- **Print** — `/print` shop sheet; PDF via browser **Save as PDF**.

Glue-up assumptions use a shared panel glue-up planner with project/per-group board-width sources, so table/print/CSV stay in sync.

## Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — how to use the app (tabs, presets, shop, print, storage).  
- [docs/WOODWORKER_CHECKLIST.md](docs/WOODWORKER_CHECKLIST.md) — tab order and readiness before shop handoff.  
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — repo layout, scripts, tests, extending joinery.  
- [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md) — internal strategy memo (north star, wedge, pillars, phased roadmap, MVP, risks).  
- [docs/PRD.md](docs/PRD.md) — product requirements (Workshop Companion / Grainline).  
- [docs/PLAN.md](docs/PLAN.md) — phased implementation plan aligned with the PRD.

## Run

```bash
npm install
npm run dev
```

```bash
npm run test    # unit tests (Vitest)
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4.

## Layout note

Symmetric dressers only: same drawer grid in every column. Face frames, inset reveals, and overlay details are not modeled yet—adjust clearances manually.
