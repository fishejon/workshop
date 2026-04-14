# Grainline — user guide

How to use the planner in the browser: projects, presets, shop outputs, and print/export.

## Workshop journey (happy path)

1. **Project** — Name the project and set milling allowance, max transport length, and waste % (plus reset or open **Print shop sheet** when you are ready for paper). Optional **`/labs`** link for joinery experiments.
2. **Plan** — Pick a preset and enter target geometry, then use each planner’s handoffs so parts land in the shared project (dresser case/drawers, board pack, sideboard shell, etc.).
3. **Cut list** — Validate the **cut list** table (finished vs rough). Open **Lumber & buy list** when you want BF/LF and purchase scenarios.
4. **Review** — Clear blocking validation issues if any, acknowledge **material assumptions**, and confirm you are comfortable shipping the current numbers to the floor.
5. **Print / CSV** — When export is unlocked, download **Export CSV** from the cut list header and/or open **shop print** from **Project** or **Cut list** (browser **Save as PDF** if you want a file).

---

## Main navigation (tabs)

| Tab | Purpose |
|-----|--------|
| **Project** | Project name, milling allowance, max transport length, waste %, **Print shop sheet** link, **Reset project**, link to **`/labs`**. |
| **Plan** | **Define intent** only: presets and planners (dresser, board cuts, sideboard shell, …) plus the shared **decision strip** and next-step CTA. TV console is available only when you enable **Show experimental presets**. |
| **Cut list** | **Validate procurement**. Cut list table; **Lumber & buy list** is a disclosure below the table. Same decision strip. |
| **Review** | **Release to shop**. Material assumptions checkpoint before export/print handoff. |

Your data is **one shared project** across tabs: switching tabs does not start a new project.

---

## Project settings (Project tab)

- **Milling allowance** — Added to each **finished** T, W, and L to suggest **rough** sizes, until you mark a part’s rough as **manual**.
- **Max transport length** — A **planning assumption** for carry length and default stock length; not a guarantee your yard stocks that length.
- **Waste %** — A **planning multiplier** applied to BF/LF subtotals for purchasing cushion (estimate, not exact material volume).
- **Reset project** — Clears parts, joinery history, and restores default numbers. Use when you want a clean slate.

---

## Presets (Plan / Define intent)

### Dresser

Enter overall case dimensions, columns, drawer rows, kick, top/bottom stack, rails, back thickness, slide assumptions, etc. The planner shows **openings** and **drawer box** sizes per cell.

- **Add drawer boxes to parts list** — Pushes drawer parts into the table.
- **Add case parts to parts list** — Adds rectilinear **Case / Base / Back** parts from the carcass math (see grain notes on each part).
- **Parts list handoff** — Use the combined handoff controls to either append a full dresser set or replace only dresser assemblies (`Case`, `Base`, `Back`, `Drawers`) while preserving non-dresser parts.

**Slides:** Clearances are rules of thumb. Always verify against your **hardware manufacturer’s** specs.

### Board cut list

1D stick packing: kerf, stock length, and a list of cuts. Separate from the **parts table** rough-stick packer (which uses your project parts).

### TV console (experimental opt-in)

Enable **Show experimental presets** in Plan to access TV console. It generates a minimal shell from W×H×D. Joinery is not fully modeled, so treat it as early-access concept sizing.

---

## Cut list table (Validate procurement)

- **Read-only grid** — Component, assembly, qty, finished and rough T×W×L (shop **nearest 1/16″**), lumber (label · thickness category), status. Internal storage stays decimal; **`project.joints` is not applied** on the main path (see **`/labs`**).
- **Edit** — Opens a modal with all fields (dimensions as numbers + live fraction preview), grain note, manual rough toggle, and a collapsible **Why these numbers?** (glue-up / rough derivation). Save applies changes; Cancel discards.
- **Assembly** — Case, Drawers, Base, Back, Doors, Other.
- **Clear all** — Removes every part **and** joinery history for this project.
- **Export CSV** — Same columns as before export pipeline (BF/LF, glue-up, provenance). Locked until Review material checkpoint is acknowledged.

---

## Buy list

- **Exact BF/LF inputs** — From **rough T×W×L + quantity** (BF: 144 cu in = 1 BF; LF: quantity × rough L ÷ 12), grouped by material + thickness category.
- **Estimate layer** — Waste % inflates BF/LF for purchasing cushion; transport cap and stock-width assumptions feed the 2D board estimator.
- **2D board estimate** — Uses width-lane expansion (including panel glue-up strips) plus constrained length packing. Per-material stock width overrides are optional in the group card.
- **Yard checkout** — Confirm nominal thickness, available stock lengths, and final board count with your supplier.

---

## Joinery & rough sticks (`/labs`)

Open **`/labs`** for the **joinery panel** and **rough stick layout**. Edits save to the same browser project, but the main **Cut list**, CSV, **`/print`**, and validation **ignore `project.joints`** until joinery is folded back into the product path.

**Joinery rules** (labs) adjust **finished** T×W×L on a chosen part; **rough** updates automatically unless that part’s rough is **manual**. Typical rules include groove-for-¼-back, dado shelf width, and mortise-and-tenon rail/stile adjustments.

**Rough stick layout** (labs) packs **rough L × quantity** from the parts list into boards of a given stock length and kerf—verify kerf and real-world breaks at the bench.

---

## Print and PDF

- **Print shop sheet** (Project) or **Shop print** from the cut list flow opens **`/print`** in a new tab.
- The print page reads the same **`localStorage`** project as the main app.
- Finished parts include an **Assumptions** column so joinery sizing and panel glue-up assumptions survive to paper/PDF handoff.
- Treat the printout as a lumber-yard handoff: material + thickness category + adjusted BF/LF, then finalize board counts from what is in stock.
- For a **PDF**, use the browser’s print dialog and choose **Save as PDF** (or “Microsoft Print to PDF”). No server-side PDF is required.

Glue-up notes use the panel glue-up planner with project-level max purchasable width plus optional material-group overrides.

---

## Where your project is stored

- Key: **`grainline-project-v1`** in the browser’s **localStorage** for this site origin.
- Clearing site data or using another browser/device does not sync the project—export **CSV** or print for a backup.

---

## Related docs

- [PRD.md](./PRD.md) — Product requirements.  
- [PLAN.md](./PLAN.md) — Engineering phases and checklist.  
- [PRODUCT_STRATEGY.md](./PRODUCT_STRATEGY.md) — Strategy and positioning.  
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Repo layout and contributing notes for developers.
