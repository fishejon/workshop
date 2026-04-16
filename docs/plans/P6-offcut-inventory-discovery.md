# P6-M1 — Offcut / inventory discovery (spike, no persistence)

**Intent:** PRD-aligned spike for Phase 2 roadmap items (“offcut reuse, stockyard/inventory mode” in `docs/PRD.md`) without committing storage, schema, or UI surface area. This document is discovery only; it does not change product behavior.

## Problem

Hardwood projects produce **usable remainder stock**. Buyers want buy lists that respect **what they already have** in the rack, and some want a credible story for **serviceable offcuts** without turning Grainline into an ERP. The app already exposes `workshop.offcutMode` as a coarse preference; PRD Phase 2 calls for deeper reuse and inventory thinking. The open question is **where intelligence should live** (buy math only, ephemeral UX, or a durable inventory model) without breaking the trust-first sequencing in `docs/PRODUCT_STRATEGY.md`.

## Non-goals versus `docs/PRODUCT_STRATEGY.md`

- **Not MVP scope:** Strategy places “inventory/offcuts, templates, recommendations” in a **later workshop systems** horizon (12+ months in the staged roadmap table), after core planner, joinery engine, optimization, and shop mode foundations.
- **Not an ERP or stockyard system:** Explicit non-user positioning includes production cabinet shops at scale; **ERP-style inventory** is already called out for deferral on the execution ladder. A full stockyard mode would fight the wedge (**joinery-aware translation + explainable buy guidance**).
- **Not a substitute for buy-list trust:** Strategy’s leverage list ranks **accuracy, joinery clarity, buy-list trust, export usability** before **optimization depth**. Any offcut feature that obscures “why this board foot” or hides assumptions works against the north star.
- **Persistence is out of scope for this spike:** No ADR for sync, multi-device, or authoritative stock levels until the data model is deliberately chosen; this spike stops at options and questions.

## Three option directions

1. **Buy-list and waste narrative only (no stock ledger).** Extend explanations and scenarios so “preserve serviceable offcuts” changes **labeled waste or scenario copy**, not a personal inventory. Lowest risk to trust; aligns with “labeled multipliers—not magic totals.”
2. **Session-only or project-scoped “stash” (ephemeral).** Let the user declare **length buckets or stick leftovers** for this project only, feeding suggestions or warnings on the Materials path, cleared when the project resets. No cross-project truth; avoids pretending Grainline knows their rack.
3. **Durable inventory v0 behind an explicit contract.** A future `InventoryItem` (or similar) model, import-friendly, with clear non-goals (not valuation, not multi-user shop floor). Would require an ADR, migrations, and hard UX for **assumption → derivation** so inventory never silently overrides rough math without provenance.

## Open questions

- Should offcut logic ever **reduce board feet** automatically, or only **annotate** risk and opportunity so the user stays accountable for the number?
- How much of this belongs in **purchase scenarios** (`lib/purchase-scenarios.ts` and Materials copy) versus a separate surface?
- Does `offcutMode` stay a **workshop preference**, or should it become a **per-material-group** or **per-buy-group** control once scenarios deepen?
- What is the minimum **shop-readable** output (print / CSV) if offcuts affect a story users will act on in the yard?
- When geometry and stick layout mature, does **linear layout** own offcut lengths first, before any inventory ledger?

## Recommendation

**Defer durable offcut inventory until Phase 2 “buy trust” work is boringly solid** (purchase scenarios UX, transparent BF/LF and transport story, export parity). Until then, treat PRD Phase 2 inventory language as **directional**, not a near-term build target. Prefer **option 1** or a very small slice of **option 2** if user research shows demand, always with visible assumptions and no silent persistence. Promote **option 3** only after a written data model ADR and migration tests land in the same discipline as project shape changes (`docs/plans/pm-roadmap-execution-ladder.md` P4-M2 pattern).

## Verify (for this spike doc)

- [ ] PRD Phase 2 bullet still reads “offcut reuse, stockyard/inventory mode” and matches this framing.
- [ ] `docs/PRODUCT_STRATEGY.md` roadmap row for “Intelligent workshop system” still lists inventory/offcuts as 12+ months, not MVP.
- [ ] Execution ladder P6-M1 checkbox can be satisfied by this document plus stakeholder skim; no code required for M1.
