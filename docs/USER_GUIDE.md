# Grainline — user guide

How to use the planner in the browser: projects, presets, shop outputs, and print/export.

## Workshop journey (happy path)

1. **Setup** — Name the project and set milling allowance, max transport length, and waste % on the **Setup** tab (plus reset or open **Print shop sheet** when you are ready for paper).
2. **Build** — Pick a preset and enter target geometry on the **Build** tab, then use each planner’s handoffs so parts land in the shared project (dresser case/drawers, board pack, sideboard shell, etc.).
3. **Materials** — Switch to **Materials** to validate the **parts table** (finished vs rough), **buy list**, and—when needed—joinery and rough-stick tools under **Advanced materials tools**.
4. **Review** — On **Review**, clear blocking validation issues if any, acknowledge both release checkpoints, and confirm you are comfortable shipping the current assumptions to the floor.
5. **Print / CSV** — When export is unlocked, download **Export CSV** from the parts header on **Materials** and/or open **shop print** from **Setup** or **Materials** (browser **Save as PDF** if you want a file).

---

## Main navigation (tabs)

| Tab | Purpose |
|-----|--------|
| **Setup** | Project name, milling allowance, max transport length, waste %, **Print shop sheet** link, **Reset project**. |
| **Build** | **Define intent** only: single-column presets and planners (dresser, board cuts, sideboard shell, …) plus the shared **decision strip** and next-step CTA—no parts table or buy list here. TV console is available only when you enable **Show experimental presets**. |
| **Materials** | **Validate procurement**. Parts list and buy list; **Advanced materials tools** expands joinery + rough-stick layout. Same decision strip and release guidance. |
| **Review** | **Release to shop**. Confirm both checkpoints before export/print handoff. |

Your data is **one shared project** across tabs: switching tabs does not start a new project.

---

## Project settings (Setup)

- **Milling allowance** — Added to each **finished** T, W, and L to suggest **rough** sizes, until you mark a part’s rough as **manual**.
- **Max transport length** — A **planning assumption** for carry length and default stock length; not a guarantee your yard stocks that length.
- **Waste %** — A **planning multiplier** applied to BF/LF subtotals for purchasing cushion (estimate, not exact material volume).
- **Reset project** — Clears parts, joinery history, and restores default numbers. Use when you want a clean slate.

---

## Presets (Build / Define intent)

### Dresser

Enter overall case dimensions, columns, drawer rows, kick, top/bottom stack, rails, back thickness, slide assumptions, etc. The planner shows **openings** and **drawer box** sizes per cell.

- **Add drawer boxes to parts list** — Pushes drawer parts into the table.
- **Add case parts to parts list** — Adds rectilinear **Case / Base / Back** parts from the carcass math (see grain notes on each part).
- **Parts list handoff** — Use the combined handoff controls to either append a full dresser set or replace only dresser assemblies (`Case`, `Base`, `Back`, `Drawers`) while preserving non-dresser parts.

**Slides:** Clearances are rules of thumb. Always verify against your **hardware manufacturer’s** specs.

### Board cut list

1D stick packing: kerf, stock length, and a list of cuts. Separate from the **parts table** rough-stick packer (which uses your project parts).

### TV console (experimental opt-in)

Enable **Show experimental presets** in Build to access TV console. It generates a minimal shell from W×H×D. Joinery is not fully modeled, so treat it as early-access concept sizing.

---

## Parts table (Materials / Validate procurement)

- **Finished** vs **rough** T×W×L in inches (decimal storage). Shop-facing dimensions in this table, buy list, joinery summaries, and print use **nearest 1/16″** strings (`formatShopImperial`); internal values stay decimal.
- **Rough manual** — When on, rough no longer auto-follows finished + allowance until you edit again.
- **Prov column** — Quick provenance signals: rough source (derived/manual), joinery change count, and mate references.
- **Assembly** — Case, Drawers, Base, Back, Doors, Other (used for filtering in some joinery flows).
- **Material** — Free-text label + **thickness category** (e.g. 4/4, 5/4)—used to **group** the buy list. Treat thickness category as yard-facing naming, not measured rough thickness.
- **Clear all** — Removes every part **and** joinery history for this project.
- **Assumptions** — Each row now shows explicit joinery sizing provenance and a glue-up assumption line.
- **Export CSV** — Includes dimensions, material, per-row **board feet** / **lineal feet** (from rough dims), plus joinery/glue-up assumption columns for printout parity. Locked until Review (Release to shop) checkpoints are acknowledged.

---

## Buy list

- **Exact BF/LF inputs** — From **rough T×W×L + quantity** (BF: 144 cu in = 1 BF; LF: quantity × rough L ÷ 12), grouped by material + thickness category.
- **Estimate layer** — Waste % inflates BF/LF for purchasing cushion; transport cap and stock-width assumptions feed the 2D board estimator.
- **2D board estimate** — Uses width-lane expansion (including panel glue-up strips) plus constrained length packing. Per-material stock width overrides are optional in the group card.
- **Yard checkout** — Confirm nominal thickness, available stock lengths, and final board count with your supplier.

---

## Joinery panel

Rules adjust **finished** T×W×L on a chosen part; **rough** updates automatically unless that part’s rough is **manual**.

| Rule | Effect (typical) |
|------|------------------|
| **Groove for ¼ back** | Back panel: reduce **W** and **L** by 2× groove depth (floating panel in dados). Only **Back** assembly parts in the picker. |
| **Dado — shelf width** | Shelf: reduce **W** by 2× dado depth (opening-sized blank). |
| **M&T — rail** | Increase **L** by 2× tenon length per end. |
| **M&T — stile** | Decrease **L** by 2× tenon length (shoulder seats). |

Optional **mate part** and **edge labels** are stored for connection audit traceability.

**Applied connections** — Expand an entry to see engineering explanation, formula/preset provenance, and **before / after** finished sizes.

---

## Rough stick layout

Packs **rough L × quantity** from the parts list into boards of a given stock length and kerf. Complements the buy list; verify kerf and real-world breaks at the bench.

---

## Print and PDF

- **Print shop sheet** (Setup) or **Shop print** link (Materials tab) opens **`/print`** in a new tab.
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
