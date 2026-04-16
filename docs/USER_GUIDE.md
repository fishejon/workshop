# Grainline — user guide

How to use the planner in the browser: projects, presets, shop outputs, and print/export.

## Workshop journey (happy path)

1. **Project** — Name the project, set milling/transport/waste defaults, and choose the preset family you want to plan.
2. **Plan** — Enter target geometry and assumptions (dresser, board pack, sideboard shell, etc.). Dresser rows auto-sync into the shared cut list when inputs are valid.
3. **Materials** — Validate the yard list, cut layout, and source parts table. Blocking validation issues keep this tab locked until fixed in Plan.
4. **Print / CSV** — Export CSV from the source parts section and/or open **shop print** from Project (browser **Save as PDF** if you want a file).
5. **Shop mode (optional)** — Open **`/shop`** from Project for a large-type status readout (parts count, export readiness, blockers). Read-only; edit on the main planner.

---

## Build packet (story order)

Use this order when you want a coherent handoff from screen to bench:

1. **Plan** — Lock intent and preset geometry so the cut list stops moving.
2. **Materials** — Yard list + cut layout, then source parts; acknowledge **Material assumptions** so export/print unlock.
3. **Export** — CSV from the parts table for spreadsheet or supplier email.
4. **Print** — **`/print`** shop sheet for dimension + assumption columns at the bench (save as PDF if you want a file).
5. **Hardware** — The print sheet may include a **Hardware checklist (v0)** when dresser-style drawer rows exist; always confirm slide counts and lengths with the manufacturer.

---

## Main navigation (tabs)

| Tab | Purpose |
|-----|--------|
| **Project** | Project name, milling allowance, max transport length, waste %, preset selection, **Print shop sheet** link, **Shop mode** (`/shop`), **Reset project**, link to **`/labs`**. |
| **Plan** | **Define intent** with planners (dresser, board cuts, sideboard shell, …) plus shared **decision strip** and next-step CTA. TV console is available only when you enable **Show experimental presets**. |
| **Materials** | **Validate procurement**. Yard list + cut layout, then source parts table with CSV export. |

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

Enter overall case dimensions, columns, drawer rows, kick, top/bottom stack, rails, back thickness, slide assumptions, etc. The planner shows a centered **front / side / top** preview and keeps dresser rows synced into Materials when math is valid.

**Slides:** Clearances are rules of thumb. Always verify against your **hardware manufacturer’s** specs.

### Board cut list

1D stick packing: kerf, stock length, and a list of cuts. Separate from the **parts table** rough-stick packer (which uses your project parts).

### TV console (experimental opt-in)

Enable **Show experimental presets** in Plan to access TV console. It generates a minimal shell from W×H×D. Joinery is not fully modeled, so treat it as early-access concept sizing.

---

## Materials tab (Validate procurement)

- **Material assumptions** — Checkbox at the top of the tab; acknowledge after you have reviewed yard list and parts. Required (with no blocking validation issues) before **Export CSV** and **Print shop sheet** unlock.
- **Yard list + cut layout** — Nominal lumber rows, board counts, transport-length assumptions, and stick-level cut layout.
- **Read-only grid** — Component, assembly, qty, finished and rough T×W×L (shop **nearest 1/16″**), lumber (label · thickness category), status. Internal storage stays decimal; **`project.joints` is not applied** on the main path (see **`/labs`**).
- **Rough vs finished** — With **manual rough** off, rough T×W×L start as finished plus **Project milling allowance** on each axis; open **Edit** on a row and expand **Why these numbers?** to see glue-up / allowance detail for that part.
- **Edit** — Opens a modal with all fields (dimensions as numbers + live fraction preview), grain note, manual rough toggle, and a collapsible **Why these numbers?** (glue-up / rough derivation). Save applies changes; Cancel discards.
- **Assembly** — Case, Drawers, Base, Back, Doors, Other.
- **Clear all** — Removes every part **and** joinery history for this project.
- **Export CSV** — Available from the source parts section in this tab.

---

## Joinery & rough sticks (`/labs`)

Open **`/labs`** for the **joinery panel** and **rough stick layout**. Edits save to the same browser project. By default the main **Materials** cut list, CSV, **`/print`**, and cut-list validation **ignore `project.joints`**. Set **`NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1`** in `.env.local` only when you intentionally want Labs joinery audits to flow into those outputs (same flag also widens validation to full joinery mode).

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
