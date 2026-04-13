# Product strategy — Workshop Companion (Grainline)

**Document type:** Internal strategy memo  
**Audience:** Founder / product / engineering  
**Companion docs:** [PRD.md](./PRD.md) (requirements), [PLAN.md](./PLAN.md) (engineering sequencing)

---

## Executive summary

Grainline is positioned as a **woodworking intelligence layer**: the planning brain between sketch and build. The wedge is not “better panel optimization” alone—markets already serve cut optimizers, cabinet configurators, and board-foot calculators as separate utilities. The defensible bet is **design-to-build translation for furniture makers using real joinery**, especially when the user starts from **finished dimensions** rather than CAD-heavy modeling.

**North star:** A maker can describe furniture intent (overall size, construction style, materials, shop constraints) and receive a **trustworthy** structured plan—assemblies, finished and rough parts, joinery assumptions, buy guidance, and shop-ready outputs—without rebuilding the math in a spreadsheet.

**Vision line (external):** *Build furniture from intent, not spreadsheets.*

---

## North star

**Outcome:** Move from idea → material purchase → shop execution with **confidence**, not merely efficiency.

**System behavior (end state):** The product behaves like a **digital master builder** for hardwood furniture: it infers or accepts assemblies, computes finished and rough dimensions, explains joinery-driven adjustments, and produces a realistic buy plan keyed to species, stock thickness, waste, and transport limits.

**Trust bar:** Users ship projects using these outputs **without recalculating everything elsewhere**. If derived dimensions, joinery logic, or buy totals feel opaque, the product fails—optimization depth cannot compensate.

---

## Target user

**Primary:** Furniture makers working mostly in **hardwoods**, **traditional or semi-traditional joinery**, and aesthetics aligned with **mid-century–influenced** or **studio furniture** builds—thinking in **overall finished sizes** first, not in parametric CAD.

**Secondary:** Serious hobbyists who care about **max board length (vehicle)**, **preferred thicknesses**, and clear separation of **solid vs panel** parts.

**Explicit non-user (for positioning):** Production cabinet shops optimizing sheet nests at scale; structural engineering or CNC toolpath workflows (out of scope for core narrative).

---

## Strategic wedge

| Category (market) | Typical focus | Our focus |
|-------------------|---------------|-----------|
| Cut optimizers | Kerf, layout efficiency | Joinery-aware **what to cut**, not only how to nest sticks |
| Cabinet configurators | Box systems, production cabinetry | **Furniture intent** and hardwood-centric stock reality |
| Calculators | Board feet, cost snippets | **One flow**: parts → rough → buy list → export |
| Design / viz tools | Modeling first; reports as artifact | **Planning-first**: geometry in service of build truth |

**Differentiation in one sentence:** We center the translation from **furniture dimensions** into **joinery-aware build plans**—with **explainability** as a first-class output, not an afterthought.

---

## Product pillars

### 1. Joinery intelligence (heart of the product)

Most tools optimize rectangles; fewer encode that **tenons, dados, miters, grooves, and frame-and-panel geometry change the numbers on the cut list**. Success here is **trust**: the app returns **parts you actually build**, not anonymous rectangles.

**Implications:** Per-joint parameters (depth, shoulder, reveal, clearances), **dimension provenance** (“why this length”), and validation that flags impossible or suspicious geometry.

### 2. Material intelligence

Bridge **finished size → rough milling → hardwood stock categories → purchase reality** (waste, thickness preference, **transport length**). The output should read as: **what to buy, in what thickness and plausible lengths, and why**—especially for solid stock.

### 3. Build intelligence

Outputs must be **shop-usable**: part list, milling sequence, joinery notes, buy list, cut order, assembly notes, and (where relevant) a concise **hardware schedule** for drawers and doors. The bar is a **build packet** you would carry onto the floor—not an export you ignore.

---

## Roadmap shape (product stages)

Progression is deliberate: establish **correctness and trust** before deeper automation.

| Stage | Time horizon (indicative) | Primary outcome |
|-------|---------------------------|-----------------|
| **1. Core planner** | 0–3 months | Trustworthy cut list and buy list for common hardwood furniture |
| **2. Joinery engine** | 3–6 months | Differentiated, joinery-aware dimensioning with provenance |
| **3. Optimization layer** | 6–9 months | Better stock usage, cost framing, transport-aware scenarios |
| **4. Shop mode** | 9–12 months | Mobile-friendly execution, print packet, sequencing |
| **5. Intelligent workshop system** | 12+ months | Inventory/offcuts, templates, recommendations, richer assistance |

*Engineering tasks and current completion status live in [PLAN.md](./PLAN.md).*

---

## MVP scope (Phase 1 product)

MVP proves **accuracy and trust** on the narrowest high-value path: **finished dimensions → parts → rough → buy list → export** for common hardwood furniture.

**In scope (aligned with [PRD.md](./PRD.md)):**

- Project setup: imperial fractions, kerf, waste, **max board / transport length**, preferred thicknesses, species/material labels
- **Templates** for common forms: table, cabinet / carcass, shelf unit, drawer box, door (depth of template coverage can grow iteratively)
- **Part-generation** from finished dimensions (manual + preset-driven)
- **Rough-cut layer** with milling allowances and visible formulas
- **Buy-list** engine: board-foot summary, grouping by species + thickness class, transport cap surfaced in recommendations
- **Export**: cut list and shop-oriented summary (CSV / print-friendly views per PRD)

**Out of scope for MVP:** Full CAD, structural analysis, CNC paths, compound curves, exhaustive hardware databases (manufacturer-specific presets phased in carefully).

**Success definition:** Users trust outputs enough to **build without redoing core math** elsewhere; “Why?” explanations and visible assumptions are non-negotiable.

---

## Prioritized leverage (build order)

1. **Accuracy of derived part dimensions** — wrong numbers poison everything downstream  
2. **Joinery rule clarity** — even one well-explained rule beats ten hidden ones  
3. **Buy-list trustworthiness** — thickness class, BF logic, and transport realism  
4. **Export / shop usability** — if it dies in the browser, it is not a workshop tool  
5. **Optimization and automation depth** — valuable only after 1–3 are credible  

---

## Key risks

| Risk | Mitigation |
|------|------------|
| **Trust erosion** — “black box” math | Dimension provenance, assumptions on-screen, overrides with audit trail |
| **Overclaiming shop truth** | Opinionated defaults **labeled as defaults**; escape hatches for regional / maker variation |
| **Hardware variance** (slides, hinges) | Presets + explicit “confirm with manufacturer” copy; avoid magic constants |
| **Scope creep into CAD** | Ruthless focus on **planning**; export to other tools when modeling is the job |
| **Fragmented categories** | Positioning and copy stress **translation + joinery**, not “we nest better than X” alone |

---

## Design principles

- **Three labeled layers:** design intent → **finished part** → **rough stock** (never conflate in UI)  
- **Assumptions visible:** kerf, waste, milling allowance, reference faces, inside vs outside dimensions  
- **Explainability:** every derived field can answer “why?” without leaving the row  
- **Workshop calm:** progressive disclosure; readable type; warm neutrals; avoid spreadsheet density as the default experience  
- **Hardwood-first language:** species, 4/4 vs 5/4, stick lengths, grain notes—not only “panels and sheets”  

---

## Differentiated feature bets

- **Dimension provenance** on every computed part (formula + assumptions)  
- **“Fit in my car”** (max transport length) as a first-class constraint on buy guidance, not a footnote  
- **Joinery-first templates** (e.g. frame-and-panel case, dovetailed drawer chest, mitered case) alongside furniture-type templates  
- **Build packet** UX: a single coherent artifact for the shop, not a dump of disconnected exports  

---

## Example end-to-end workflow (MVP → near-term)

1. **Start project** — “Walnut sideboard,” 60″ W × 32″ H × 18″ D; set kerf, waste, milling allowance, max carry length, preferred thicknesses (e.g. 4/4 case, 1/2″ drawer sides, 1/4″ back).  
2. **Choose structure** — Carcass + base; frame-and-panel doors; drawers on slides; back (grooved / inset per template).  
3. **Generate parts** — System proposes rails, stiles, panels, dividers, drawer boxes, back; user adjusts labels and quantities.  
4. **Inspect rough layer** — Each row shows rough T×W×L from finished + allowance; “Why?” expands the calculation.  
5. **Joinery (as shipped)** — First rules adjust lengths/thicknesses (e.g. tenon exposure, groove depth); UI shows **before/after** on affected parts.  
6. **Buy list** — Groups by walnut + thickness class; board feet with waste; suggested purchasable lengths **under transport cap**; notes on which parts drive each group.  
7. **Optional linear layout** — Pack sticks for long parts where 1D packing applies.  
8. **Export** — Cut list + rough list + buy summary for the shop floor or supplier run.

Later phases add **scenario optimization** (cost vs waste vs transport), **offcut reuse**, **shop mode** (large type, checkoffs), and **project memory**—without changing the core promise: **trustworthy translation from intent to build**.

---

## Competitive context (light touch)

The landscape spans cut-list optimizers, cabinet configurators, board-foot calculators, and design-centric apps. Those references are useful for **parity checks** and marketing language, but the strategy anchor remains: **joinery-aware translation + material reality + explainability** for individual furniture makers. Detailed external links are intentionally kept out of this memo to reduce maintenance burden; cite sources in marketing or research docs as needed.

---

## Document maintenance

When strategy shifts, update this file first; then reconcile [PRD.md](./PRD.md) for scope changes and [PLAN.md](./PLAN.md) for task breakdown. The PRD remains the **requirements source of truth**; this memo is the **narrative and prioritization** layer.
