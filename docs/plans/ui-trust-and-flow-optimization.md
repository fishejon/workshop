# Plan: UI trust and flow optimization

## TLDR
- Ship a **task-first UI hierarchy** so users always know the next action in Build, Materials, and Review.
- Add a centralized **Issues panel** (blocking + warning) with jump links to reduce error-hunting time.
- Rework Materials card hierarchy so **2D buy decision outputs** are primary and BF/LF/cost are secondary diagnostics.
- Improve joinery usability with **progressive disclosure** (intent defaults first, advanced controls second) and a clearer mobile “yard mode” presentation.
- Explicitly not included: major visual redesign/theme overhaul, backend/cloud sync, or new computational engines.

## Critical decisions
1. **Decision:** Prioritize **decision hierarchy** over visual polish. **Because:** current friction is primarily wayfinding/cognitive load, not styling. **Rejected:** typography/animation-first pass.
2. **Decision:** Add a persistent **Decision Strip** (health + recommendation + next action) at top of Build/Materials. **Because:** users need a stable orientation anchor across tabs. **Rejected:** only inline panel-level notices.
3. **Decision:** Centralize validation in a dedicated **Issues panel** and keep inline hints as secondary. **Because:** distributed warnings are hard to triage quickly. **Rejected:** relying only on inline field errors.
4. **Decision:** Use **progressive disclosure** for joinery controls (default intent → advanced parameters). **Because:** prevents expert controls from overwhelming common workflows. **Rejected:** always-on full parameter surface.
5. **Decision:** Keep 2D procurement estimate as the primary output in Materials and demote BF/LF to supporting data. **Because:** user intent is “what to buy now.” **Rejected:** equal visual weight for all metrics.

## Tasks
- [x] **Task 1 — Introduce Decision Strip on Build/Materials** — Add persistent summary bar with project health, recommended buy plan, and one primary CTA.  
  - **Files / areas:** `components/GrainlineApp.tsx`, `components/AppShellTabs.tsx`, maybe shared UI component under `components/`.  
  - **Verify:** Build/Materials always show one actionable next-step card; no duplicate conflicting CTAs.
  - **Rollback / risk:** Low (additive UI).

- [x] **Task 2 — Add Issues panel with grouped severity + jump actions** — Create triage panel for blocking geometry, joinery conflicts, procurement assumptions; include “jump to section/field” links.  
  - **Files / areas:** `components/PartsTable.tsx`, `components/JoineryPanel.tsx`, `components/ProjectSetupBar.tsx`, `components/ShopPrintView.tsx`, `components/ProjectContext.tsx`.  
  - **Verify:** each issue can be navigated from one place; blocking issues clearly listed for print/export lock.
  - **Rollback / risk:** Medium (anchor/jump behavior can be brittle if ids drift).

- [x] **Task 3 — Reorder Materials hierarchy for decision-first scanning** — In each group card, show 2D estimate first, assumptions second, BF/LF/cost third.  
  - **Files / areas:** `components/BuyListPanel.tsx`, `components/ShopPrintView.tsx`.  
  - **Verify:** first visible metric per group is estimated boards; assumptions readable without expanding advanced controls.
  - **Rollback / risk:** Low.

- [x] **Task 4 — Joinery progressive disclosure pass** — Keep recommended preset view prominent; tuck advanced parameters and edge metadata behind explicit reveal.  
  - **Files / areas:** `components/JoineryPanel.tsx`, optional small helper text updates in `lib/part-provenance.ts`.  
  - **Verify:** non-expert flow applies preset with minimal typing; expert flow can still fully override.
  - **Rollback / risk:** Medium (must avoid hiding required controls for advanced users).

- [x] **Task 5 — Tab/task framing consistency** — Add/align subtitles and helper copy for “Define intent” (Build), “Validate procurement” (Materials), “Release to shop” (Review).  
  - **Files / areas:** `components/AppShellTabs.tsx`, `components/GrainlineApp.tsx`, `docs/USER_GUIDE.md` if wording changes materially.  
  - **Verify:** wording is consistent across tab labels, lock reasons, and print handoff text.
  - **Rollback / risk:** Low.

- [x] **Task 6 — Mobile yard mode ergonomics pass** — Tighten card density, simplify first-glance content, and reduce required typing in Materials critical actions.  
  - **Files / areas:** `components/BuyListPanel.tsx`, `components/ProjectSetupBar.tsx`, utility classes/components where needed.  
  - **Verify:** on narrow width, key decision metrics are visible without deep scrolling; controls remain touch-friendly.
  - **Rollback / risk:** Medium (responsive tweaks can cause desktop regressions).

- [x] **Task 7 — Accessibility and non-happy-path review** — Ensure severity signaling is not color-only, focus order is correct, and locked states are screen-reader explicit.  
  - **Files / areas:** Build/Materials/Review components listed above, plus lock UI in `components/ShopPrintView.tsx`.  
  - **Verify:** keyboard navigation and ARIA labels for lock reasons/issue summaries; no regressions in `npm run lint` accessibility checks.
  - **Rollback / risk:** Low.

## Risks & rollback
- **Risk:** Over-adding UI chrome increases clutter.  
  **Rollback:** keep Decision Strip + Issues panel minimal and hide secondary copy behind collapses.
- **Risk:** Jump links break as component structure evolves.  
  **Rollback:** fallback to section-level anchors if field-level ids are unavailable.
- **Risk:** Mobile adjustments reduce desktop scanability.  
  **Rollback:** isolate responsive changes with explicit breakpoints and snapshot/manual checks.

## Implementation notes (executed)
- **Parallelization:** (A) Decision Strip + task framing, (B) Issues panel + accessibility/locks, (C) Materials hierarchy + joinery disclosure + mobile ergonomics.
- **New shared UI:** `components/DecisionStrip.tsx` and `components/IssuesPanel.tsx`; issues are grouped by blocking/warning with jump actions and non-color-only summaries.
- **Flow updates:** Build/Materials now carry persistent decision guidance, and tab language is aligned to **Define intent / Validate procurement / Release to shop**.
- **Materials ordering:** group cards now present 2D estimate first, assumptions second, diagnostics third; mobile quick-preset controls reduce typing in setup/materials.
- **Verification:** `npm run test` (92), `npm run lint`, `npm run build` all pass on integrated tree.
