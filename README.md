# Grainline

Working title for a **hobbyist hardwood** planning app: **furniture presets** with shop math, plus a **1D board packer** for stick layouts.

## Presets

- **Dresser** — Overall W×H×D, **1–3 columns**, **row count** with **weight-based row heights** (e.g. `2, 2, 1` = two taller rows + one shorter). Enter kick, top assembly, bottom panel, rails between drawers, back, rear clearance, and **slide preset / clearances**. Outputs **opening size** and **drawer box W×H×D** per cell (R1C1, …), with a **front schematic**. **Back-solve overall height** from target opening heights when you know row sizes but not the case height. Use **Add drawer boxes to parts list** to push rows into the project table.
- **Board cut list** — Kerf, stock length vs vehicle max, parts → packed boards (1/4″ display).
- **TV console / Standing cabinet** — Placeholders for later.

**Important:** Slide numbers are **rules of thumb**. Confirm every clearance against your **slide manufacturer’s** worksheet (especially undermount).

## Project / outputs (PRD path)

- **Project bar** — name, milling allowance (per-axis rough default), max transport length, waste %; **Reset** clears to defaults. State persists in `localStorage` (`grainline-project-v1`).
- **Parts table** — finished vs rough T×W×L (in), manual rough toggle, **Why?** explainer, **CSV export**.
- **Buy list** — board feet from **rough** dims, grouped by material + thickness category, waste multiplier, transport cap called out.

## Product docs

- [docs/PRODUCT_STRATEGY.md](docs/PRODUCT_STRATEGY.md) — internal strategy memo (north star, wedge, pillars, phased roadmap, MVP, risks).  
- [docs/PRD.md](docs/PRD.md) — product requirements (Workshop Companion / Grainline).  
- [docs/PLAN.md](docs/PLAN.md) — phased implementation plan aligned with the PRD.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4.

## Layout note

Symmetric dressers only: same drawer grid in every column. Face frames, inset reveals, and overlay details are not modeled yet—adjust clearances manually.
