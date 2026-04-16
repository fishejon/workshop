# Vision: trusted shop companion + path to CAD-capable planning

**Status:** Strategy + UX/UI + architecture synthesis (cross-functional)  
**Supersedes nothing alone:** Read with [`PRODUCT_STRATEGY.md`](./PRODUCT_STRATEGY.md) and [`PRD.md`](./PRD.md). When adopted, update those files and `.cursor/rules/agent-ux.mdc` / `agent-frontend.mdc` flow language to match **Project → Plan → Materials**.

---

## 1. Product — long-term strategy (PM)

### Vision (10-year)

Grainline becomes the woodworker’s **trusted companion from first intent through purchase and every critical cut**: one place where **how much to buy**, **what to mill**, **what to cut**, and **why each number exists** stay aligned as the project evolves. The product is not trying to replace a full mechanical CAD suite for machinists; it aims to own **furniture-scale spatial + material truth** linked to **shop outputs** makers actually use.

### North star (refined)

**Outcome:** A maker can answer, with confidence: *What do I buy? What do I rough cut? What do I finish cut? What changed when I changed one dimension or one joint?*—without rebuilding a parallel spreadsheet or re-modeling in a disconnected CAD tool.

**External one-liner (evolution of current line):** *From intent to trusted cuts and a real buy list—not a second job in CAD.*

### Strategic pillars (elements that get you there)

| Pillar | What it means | Long-term role |
|--------|----------------|----------------|
| **1. Trust & provenance** | Every derived dimension traceable to assumptions + rules; checkpoints before export | Foundation for CAD (constraints propagate) |
| **2. Material intelligence** | Nominal/actual, thickness class, transport, waste, BF/LF—honest labels | Purchase truth stays primary even as geometry grows |
| **3. Joinery intelligence** | Rules change mate dimensions; visible before/after | Bridge between “sketch” and “parts list” |
| **4. Spatial truth (CAD trajectory)** | 2D/2.5D constraints, assemblies, drawings derived from same model as parts | **New** long-term pillar; phased, not day-one |
| **5. Shop execution** | Print packet, CSV, future shop mode, sequencing, checkoffs | Companion on the floor, not only the desk |
| **6. Project memory** | Versioned projects, templates, library—repeatable builds | Retains trust across sessions |

### PM / UX alignment on CAD (explicit tradeoff)

**PM stance:** Full **parametric 3D CAD** (assemblies, mates, drawings for manufacture) is a **multi-year horizon**, not the next quarter. The near-term wedge stays **joinery-aware planning** from [`PRODUCT_STRATEGY.md`](./PRODUCT_STRATEGY.md). **CAD capability** enters as **CAD-lite**: constraint-based 2D/2.5D views, elevations, and part references that **feed the existing part graph**, not a separate ghost model.

**Why:** Scope creep into “real CAD” without a shared **single geometry + parts SSOT** erodes trust—the worst failure mode for this product.

### Roadmap shape (product stages — extended)

| Stage | Horizon | Outcome |
|-------|---------|---------|
| **A — Trust core (now)** | Ongoing | Accurate parts, validation, Materials checkpoint, print/CSV, explainability |
| **B — Joinery on main path** | Next | Joinery from `/labs` folded where strategy allows; provenance on every adjusted part |
| **C — Buy + cut intelligence** | Next | Scenarios, clearer cut order, hardware schedule where it helps trust |
| **D — Spatial layer v1** | Mid | **Sketch pad + keyed dimensions** tied to presets; 2D case front/side/top consistent with part list |
| **E — Constraint model** | Mid–long | Parametric links (e.g. “rail length = opening − tenon rules”); still browser-first |
| **F — CAD-lite exports** | Long | DXF/SVG for templates, optional 2D “shop drawing” packet from same data |
| **G — Deeper CAD (optional fork)** | 12+ mo | Evaluate WASM CAD kernel / partner vs build—only after D–E prove SSOT |

---

## 2. Design — UX + UI (supporting the strategy)

### UX principles (Sofia) — adjusted for “companion” + CAD path

1. **Default path stays non-CAD** — First-time and hobbyist flows remain: Project → Plan → Materials. No requirement to “draw” before getting a list.
2. **CAD appears as depth, not a wall** — Spatial tools live behind clear entry points (“Edit case in view,” “Open sketch”) with **live link** to parts table (two panes, one truth).
3. **Blocked export stays teachable** — Any new gate (e.g. sketch out of sync) must say **which surface** fixes it (same bar as Materials checkpoint).
4. **Two contexts preserved** — Desk: exploration + constraints. Shop: large type, print, minimal chrome (future shop mode doubles down here).
5. **Disagreement resolved with PM** — We are **not** positioning as “Fusion 360 in the browser.” We **are** positioning as **the place rough/finished/buy stay aligned** as simple 2D/2.5D intent grows—**trusted companion**, not generic modeler.

### UI principles (Luca) — concrete design moves

| Area | Change |
|------|--------|
| **Information architecture** | Reserve a **fourth primary area** (tab or split) only when Stage D ships: e.g. **Draw** or **Views**, fed by same `Project`; until then, strengthen **preview panels inside Plan** as the spatial teaser. |
| **Split view pattern** | When spatial layer lands: **left sketch / right parts** (or stacked on narrow view) with shared selection (click part row → highlight in view). |
| **Tokens** | Reuse `globals.css` tokens; sketch canvas uses **neutral grid** + **copper** for driving dimensions only—avoid carnival CAD chrome. |
| **Typography** | Driving dimensions: same `gl-numeric` discipline as tables; annotations mirror print fractions policy over time. |
| **Progressive disclosure** | Advanced: constraints list, construction lines, layer toggles—collapsed by default. |
| **Print** | Future “shop drawing” is a **second print template**, not a dump of screen UI—[`ShopPrintView`](../components/ShopPrintView.tsx) pattern extended. |

### Copy direction

- Prefer **“Views” / “Case sketch” / “Driving dimensions”** over “CAD” in primary UI until the feature set earns the word.
- Buttons: verb + object — “Open case view,” “Sync parts from sketch,” “Export 2D outline (DXF).”

---

## 3. Engineering — architecture (Alex + Marcus + Priya + Jordan)

### North-star architecture principle

**Single source of truth (SSOT) for buildable truth:** one directed graph: **design intent → geometry (optional) → parts (finished) → rough → buy / layout**. CAD-lite **writes intent and constraints**, never a forked duplicate part list.

Today’s anchor: `lib/project-types.ts`, planners in `lib/*`, validation in `lib/validation`, cut-list scope in `lib/cut-list-scope.ts`, persistence in `lib/project-utils.ts`.

### Layered architecture (target)

```
┌─────────────────────────────────────────────────────────────┐
│  UI: App shell, planners, Materials, future Views/Sketch    │
├─────────────────────────────────────────────────────────────┤
│  Sync layer: “reconcile sketch ↔ parts” (pure functions)    │
├─────────────────────────────────────────────────────────────┤
│  Domain: presets, joinery, validation, BF, purchase, export │
├─────────────────────────────────────────────────────────────┤
│  Geometry (new, phased):                                    │
│    - v0: read-only derived polylines from preset dimensions   │
│    - v1: editable 2D constraints + solve step               │
│    - v2: export SVG/DXF from solved profiles                │
├─────────────────────────────────────────────────────────────┤
│  Persistence: versioned Project + migration hooks           │
└─────────────────────────────────────────────────────────────┘
```

### Backend / data (Marcus)

- **Extend `Project` with an optional `geometry` (or `sketches`) subtree**—versioned, nullable for all existing saves. Migrations in `project-utils` required for any new block.
- **Constraint solver** — start **pure TypeScript**, deterministic, heavy unit tests (no React). Consider a **small rational interval** for key driving dimensions later; document as ADR if floats become painful.
- **Joinery** remains **dimension deltas on parts**; sketch references **part IDs** or stable **construction IDs** generated from preset topology—avoid renaming fragility.
- **Lumber SSOT** unchanged: `nominal-lumber-stocks.ts`, board feet paths—geometry must not duplicate BF logic inline.

### Frontend (Priya)

- **Canvas** — Prefer **SVG-first** for 2D (accessible, print-friendly, testable snapshots) before WebGL. If large performance need later, isolate behind `components/views/` with clear props from solved geometry DTOs only.
- **State** — Sketch edits go through **ProjectContext** (or a dedicated reducer merged into project save) so `localStorage` stays coherent.
- **Bundle** — Lazy-load sketch bundle (`dynamic(() => import(...), { ssr: false })`) when Stage D ships to protect initial load.

### Architecture risks (explicit)

| Risk | Mitigation |
|------|------------|
| Two part lists (sketch vs table) | Single reconcile pipeline; tests that assert equality after round-trip |
| CAD UX overwhelming hobbyists | Feature flag + default collapsed; IA as above |
| Float drift in solver | Rounding policy at export; tests on golden presets |
| Persistence size | Cap history, compress sketch payloads, or prune construction history |

### Definition of done (Jordan) — per slice toward D/E

- [ ] Vitest for new **pure** geometry/reconcile modules (+ golden fixtures from real dresser/sideboard projects).
- [ ] Migration path for `Project.version` + one manual open of old `localStorage` project.
- [ ] Print and CSV unchanged or **strictly improved** when sketch is empty (no regression for non-CAD users).
- [ ] USER_GUIDE + checklist updated when a user-visible surface ships.

### Suggested first engineering milestones (CAD foundation, “robust + easy”)

1. **Read-only geometry DTO** — Derive rectangle outlines from existing dresser/sideboard inputs; render in Plan; no edit.
2. **Stable IDs** — Construction/part reference IDs in export for “highlight on sheet.”
3. **One editable driving dimension** — E.g. case width; propagates to preset fields through existing planner APIs; tests prove single SSOT.
4. **Constraint object schema** — JSON-serializable, versioned, documented in `project-types`.
5. **Reconcile function** — `reconcileSketchToProject(project) -> { project, issues }` used before export optional gate.

---

## 4. Reconciliation summary

| Stakeholder | Position |
|-------------|----------|
| **PM** | Long-term **spatial truth** pillar; CAD phased as **CAD-lite** tied to parts SSOT; full CAD TBD via ADR. |
| **UX** | Companion = trust + clarity on floor; CAD is **optional depth**, never the only path. |
| **UI** | Split view, tokens, print templates; “Views” language until depth warrants “CAD.” |
| **Eng** | Thick `lib/`, versioned geometry subtree, SVG-first, lazy load, migrations, tests-first slices. |

When this direction is accepted: update **`PRODUCT_STRATEGY.md`** (pillars + roadmap row for spatial layer), **`PRD.md`** non-goals (clarify “not full CAD in MVP” vs “CAD-lite on roadmap”), and **cursor rules** that still say “not CAD” or old tab flows.
