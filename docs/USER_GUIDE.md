# Grainline — user guide

How to use the planner in the browser: projects, presets, shop outputs, and print/export.

---

## Main navigation (tabs)

| Tab | Purpose |
|-----|--------|
| **Setup** | Project name, milling allowance, max transport length, waste %, **Print shop sheet** link, **Reset project**. |
| **Build** | Choose a **preset** (dresser, board cuts, TV console, …). The preset’s planner is on the left; **Shop** panels stay on the right. |
| **Shop** | Same **Shop** column as Build, full width—parts list, buy list, joinery, rough-stick layout. |
| **About** | Short product blurb. |

Your data is **one shared project** across tabs: switching tabs does not start a new project.

---

## Project settings (Setup)

- **Milling allowance** — Added to each **finished** T, W, and L to suggest **rough** sizes, until you mark a part’s rough as **manual**.
- **Max transport length** — Used as a planning cap for stick length (buy list copy and rough-stick default stock length).
- **Waste %** — Multiplies **board-foot** and **lineal-foot** subtotals on the buy list (and print).
- **Reset project** — Clears parts, joinery history, and restores default numbers. Use when you want a clean slate.

---

## Presets (Build)

### Dresser

Enter overall case dimensions, columns, drawer rows, kick, top/bottom stack, rails, back thickness, slide assumptions, etc. The planner shows **openings** and **drawer box** sizes per cell.

- **Add drawer boxes to parts list** — Pushes drawer parts into the table.
- **Add case parts to parts list** — Adds rectilinear **Case / Base / Back** parts from the carcass math (see grain notes on each part).

**Slides:** Clearances are rules of thumb. Always verify against your **hardware manufacturer’s** specs.

### Board cut list

1D stick packing: kerf, stock length, and a list of cuts. Separate from the **parts table** rough-stick packer (which uses your project parts).

### TV console (stub)

Minimal shell parts from W×H×D. Joinery is not fully modeled—treat as a starting point.

---

## Parts table (Shop)

- **Finished** vs **rough** T×W×L in inches (decimal storage; UI shows friendly fractions where relevant).
- **Rough manual** — When on, rough no longer auto-follows finished + allowance until you edit again.
- **Assembly** — Case, Drawers, Base, Back, Doors, Other (used for filtering in some joinery flows).
- **Material** — Free-text label + **thickness category** (e.g. 4/4, 5/4)—used to **group** the buy list.
- **Clear all** — Removes every part **and** joinery history for this project.
- **Export CSV** — Includes dimensions, material, and per-row **board feet** / **lineal feet** (from rough dims).

---

## Buy list

- **Board feet (BF)** — From **rough T×W×L** (144 cu in = 1 BF). Grouped by material + thickness category.
- **Lineal feet (LF)** — For each line: **quantity × rough L ÷ 12**. Summed per group. Same **waste %** as BF.
- Yard pricing may use different nominal thickness; the UI reminds you to confirm with your supplier.

---

## Joinery panel

Rules adjust **finished** T×W×L on a chosen part; **rough** updates automatically unless that part’s rough is **manual**.

| Rule | Effect (typical) |
|------|------------------|
| **Groove for ¼ back** | Back panel: reduce **W** and **L** by 2× groove depth (floating panel in dados). Only **Back** assembly parts in the picker. |
| **Dado — shelf width** | Shelf: reduce **W** by 2× dado depth (opening-sized blank). |
| **M&T — rail** | Increase **L** by 2× tenon length per end. |
| **M&T — stile** | Decrease **L** by 2× tenon length (shoulder seats). |

Optional **mate part** and **edge labels** are stored for your notes (audit trail).

**Applied connections** — Expand an entry to see explanation and **before / after** finished sizes.

---

## Rough stick layout

Packs **rough L × quantity** from the parts list into boards of a given stock length and kerf. Complements the buy list; verify kerf and real-world breaks at the bench.

---

## Print and PDF

- **Print shop sheet** (Setup) or **Shop print** link (Shop tab) opens **`/print`** in a new tab.
- The print page reads the same **`localStorage`** project as the main app.
- For a **PDF**, use the browser’s print dialog and choose **Save as PDF** (or “Microsoft Print to PDF”). No server-side PDF is required.

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
