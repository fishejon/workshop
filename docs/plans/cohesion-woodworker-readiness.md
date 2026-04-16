# Plan: Cohesion + woodworker readiness

## TLDR

- **Ship a single “happy path”** a hobbyist can follow without reading docs: preset → validate intent → generate parts → review materials → print/export, with advanced joinery/2D/diagnostics clearly secondary.
- **Unify product story** across README, `docs/PRODUCT_STRATEGY.md`, `docs/PRD.md`, and `.cursor/rules/*` (one name, one canonical strategy, rules that match how Grainline is actually built).
- **Define “woodworker complete”** as an explicit checklist (cut list, rough, buy language, shop/yard sheet, edge cases)—then close gaps or label honestly “not yet.”
- **Freeze display + trust contracts**: one imperial rounding policy for shop outputs; checkpoints/validation copy tied to that path.
- **Defer** full fractional/rational math rewrite unless you elevate accuracy risk above UX cohesion (document the tradeoff either way).

## Critical decisions

1. **Decision: Canonical product narrative** — **Grainline / Workshop Companion** (joinery-aware planning + shop outputs) is primary; the older “Woodworker’s Cut List Tool” doc is **positioning for DIY clarity**, not a second codebase direction. **Because:** the implemented product already matches the internal PRD/strategy. **Rejected:** forcing the entire app back to “dresser-only calculator” without acknowledging joinery depth already shipped.

2. **Decision: Two-tier UX (not two products)** — **Default = Builder path** (minimal surfaces); **Advanced = workshop lab** (joinery rules, 2D scenario compare, deep diagnostics) behind one consistent pattern (`<details>`, “Advanced”, or a toggle). **Because:** fixes cohesion without deleting valuable differentiators. **Rejected:** hiding joinery entirely (loses trust story) or leaving everything flat (overwhelming).

3. **Decision: Imperial contract for v1** — **Decimal inches internally** + **documented display denominator** (recommend **1/16″ for all shop-facing strings**: parts table, print, buy list, joinery summaries) with tests on golden values. **Because:** matches woodworker expectations and agent-PM acceptance language without a multi-month math rewrite. **Rejected:** claiming “all math is fractional” in rules while code uses floats (agents and builders stay misaligned).

4. **Decision: Agent rules refresh** — Update `.cursor/rules/agent-*.mdc` to reference **Grainline**, **current capabilities** (dresser + board pack + sideboard stub + materials pipeline), and **remove stale calendar milestones**; split “aspirational math” into a separate optional rule if needed. **Because:** rules should steer the next month of work, not a 2024 roadmap.

## Tasks

### Phase A — Cohesion & clarity (1–2 weeks)

- [x] **A1 — User journey map (1 page)** — Write a single diagram or numbered flow: Setup → Build (preset) → Generate parts → Materials → Review → Print/CSV. List what screen owns each step. **Verify:** you can read it aloud in &lt; 60s; no orphan panels. **Files:** new section in `docs/USER_GUIDE.md` or short `docs/FLOW.md`.

- [x] **A2 — Strategy merge** — Add a “Vision alignment” section to `docs/PRODUCT_STRATEGY.md` (or `docs/PRD.md`) that absorbs DIY/calculator language from the Woodworker’s strategy *without* contradicting joinery/material pillars. Mark obsolete dates OKRs as historical or rewrite for “current phase.” **Verify:** no conflicting north-star statements across docs.

- [x] **A3 — In-app orientation** — Workshop flow guide + **DecisionStrip** copy/CTA now follows Setup → Build → Materials → Review. **Files:** `components/GrainlineApp.tsx`, `components/WorkshopFlowGuide.tsx`.

- [x] **A4 — Naming pass (UI + docs)** — Replace mixed “shop / materials / build” confusion in tab subtitles if needed; align headers with journey verbs (Define / Validate / Release). **Verify:** 5-minute usability self-test. **Files:** `components/AppShellTabs.tsx`, headers in major panels.

### Phase B — “Woodworker complete” definition (1 week)

- [x] **B1 — Checklist doc** — Covered by **`docs/WOODWORKER_CHECKLIST.md`** plus in-app readiness checklist in `WorkshopFlowGuide` (same pass/fail intent as planned “WOODWORKER_COMPLETE”).

- [x] **B2 — Gap list from checklist** — For each failed/partial item, file a one-line “must / should / could.” Examples to evaluate: hardware schedule, sheet goods, dados vs construction presets, asymmetric layouts, project templates discoverability. **Verify:** prioritized backlog ≤ 10 items.

- [x] **B3 — PM / Eng-manager acceptance** — See **Release slice (dresser + board pack)** in `docs/plans/woodworker-gaps.md`.

### Phase C — Display & output contract (1–2 weeks)

- [x] **C1 — Centralize `SHOP_DENOMINATOR = 16`** — Export from `lib/imperial.ts` (or small `lib/shop-formatting.ts`) and use for user-visible dimensions in Parts, Print, Buy list summaries, Joinery deltas where shown. **Verify:** visual scan + `lib/imperial.test.ts` extended. **Rejected alternative:** mixed 4th and 16th without labeling.

- [x] **C2 — “Why this number” consistency** — Parts table, `/print`, and CSV all call `derivePartAssumptionsDetailed` for assumption copy; **`lib/parts-csv.test.ts`** asserts CSV columns match that helper for a glue-up + joinery fixture row (locks parity with print/Parts).

### Phase D — Agent rules + team alignment (few days)

- [x] **D1 — Rewrite rule frontmatter + first paragraphs** — Point agents at Grainline + `docs/PRODUCT_STRATEGY.md`; remove Q2 2024 etc.; align backend rule with **decimal + tested rounding** OR schedule fraction work explicitly. **Files:** `.cursor/rules/agent-*.mdc`, `.cursor/rules/README.md`.

- [x] **D2 — “When to invoke which agent”** — Add a 10-line table: e.g. cohesion/IA → UX+PM; tokens/print → UI+FE; data model → Architect+Backend. **File:** `.cursor/rules/README.md`.

## Risks & rollback

- **Risk:** Over-tightening UI hides joinery tools power users need. **Mitigation:** Advanced sections remember open state in `sessionStorage` optional; default collapsed only.
- **Risk:** Changing all display to 1/16″ surfaces rounding disagreements vs stored floats. **Mitigation:** golden tests + explicit “display rounded; internal value” in one tooltip or doc line—not everywhere.
- **Rollback:** Phase C is mostly formatting constants; revert via single commit if print layout regresses.

## Suggested sequencing

A1 → A2 → B1 → B2 → A3 → A4 → C1 → C2 → D1 → D2 → B3 (acceptance gate before expanding furniture types).

When Phase B gap list is small and green, resume **furniture expansion** (bookshelf/table) per internal roadmap—otherwise new types add cohesion debt.
