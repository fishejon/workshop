# Plan: UI design system polish (audit follow-through)

## TLDR

- Ship a **consistent surface system** (radius, background, border tokens) applied across primary panels so the app reads as one kit, not accumulated cards.
- Raise **legibility defaults** for shop-facing UI: **12px minimum** for actionable or status-heavy secondary text; reserve smaller sizes for decorative labels only if contrast-checked.
- Make **primary CTAs** visually distinct (starting with `DecisionStrip`); simplify **header layout** so experimental presets do not compete with preset selection.
- Improve **accessibility**: roving keyboard focus + arrow keys on the custom main `tablist`; **`prefers-reduced-motion`** for smooth scroll and decorative layers.
- **Not in scope**: new icon set, full design-system documentation site, or redesign of planner logic/layout grids beyond token/class cleanup.

## Critical decisions

1. **Decision:** Centralize “panel chrome” as **CSS component classes** in `app/globals.css` (e.g. `.gl-panel`, `.gl-panel-nested`, `.gl-btn-primary`) rather than only Tailwind arbitrary values. **Because:** Faster to enforce consistency and grep for drift; Tailwind v4 `@theme` can still map colors. **Rejected:** Purely documenting tokens in README without code enforcement (does not stop new `rounded-*` permutations).

2. **Decision:** **Outer panels `rounded-2xl`, nested groups `rounded-xl`** as the default hierarchy. **Because:** Matches existing strongest pattern (`IssuesPanel`) and gives one clear “container vs group” rule. **Rejected:** Single radius everywhere (flattens hierarchy) and three+ radius levels (harder to maintain).

3. **Decision:** **Phase 1** for dual navigation (step chips + tab row): **visually de-emphasize** the guided stepper (smaller type, lower contrast container) and keep behavior unchanged. **Because:** Low risk; avoids re-IA before user testing. **Rejected:** Merging stepper into tabs in this pass (larger product/IA change).

4. **Decision:** Primary button treatment uses **filled copper / copper-mix** on dark surfaces with **focus-visible ring**, not only border `white/25`. **Because:** Decision strip CTA must scan as “the move” without relying on color-of-text alone. **Rejected:** Relying on size alone (still competes with preset pills).

5. **Decision:** `prefers-reduced-motion: reduce` disables or minimizes **noise overlay + large blurs** and sets **`scroll-behavior: auto`** globally. **Because:** Reduces vestibular/visual fatigue; jump-to-issue still works. **Rejected:** Removing atmosphere for all users (only gate on preference).

## Tasks

- [x] **Define panel + button utility classes** — Add `.gl-panel`, `.gl-panel-muted`, `.gl-panel-nested`, `.gl-btn`, `.gl-btn-primary`, `.gl-btn-ghost` (names flexible) in `app/globals.css` with documented comments; map to existing `--gl-*` variables. — Verify: visual spot-check on one screen; no TS changes.

- [x] **Migrate high-traffic shells to utilities** — Update `components/GrainlineApp.tsx` (page chrome / intro cards if any), `components/AppShellTabs.tsx` (stepper container, tab strip chrome), `components/DecisionStrip.tsx`, `components/IssuesPanel.tsx` to use the new classes instead of ad hoc `rounded-*` + `bg-*` combos where equivalent. — Verify: side-by-side before/after; `npm run lint`.

- [x] **Decision strip CTA = primary** — Apply `.gl-btn-primary` (or equivalent) to the CTA in `components/DecisionStrip.tsx`; ensure hover/active/focus-visible states meet contrast on all four tones (`neutral`, `warning`, `blocked`, `ready`). — Verify: keyboard Tab to CTA shows visible ring; contrast spot-check on `blocked` (red-tinted) background.

- [x] **Type scale floor (12px+)** — Replace `text-[10px]` / `text-[11px]` on user-facing operational UI in: `components/AppShellTabs.tsx`, `components/DecisionStrip.tsx`, `components/IssuesPanel.tsx`; grep project for `text-\[1[01]px\]` and fix remaining instances in `components/*.tsx`. — Verify: `rg 'text-\[1[01]px\]' components`; manual read of Materials/Build tabs.

- [x] **Header layout: experimental control** — In `components/GrainlineApp.tsx`, restructure `<header>` so preset chips are a clear primary band; place “Show experimental presets” in a **secondary row** (e.g. full-width below chips, `justify-end` or `border-t border-white/10 pt-4`) so it does not sit as a peer competing with presets on large breakpoints. — Verify: narrow and `lg` widths in browser; no overlap/wrap bugs.

- [x] **Guided stepper de-emphasis (phase 1)** — In `components/AppShellTabs.tsx`, reduce visual weight of the top `<ol>` container (smaller padding, softer border/background, slightly smaller label size but still ≥12px for step numbers if they carry meaning). — Verify: Build + Materials still readable; hierarchy reads: main tabs > stepper.

- [x] **Roving tabindex + arrows on main tablist** — In `components/AppShellTabs.tsx`, add `onKeyDown` on the `role="tablist"` container: Left/Right (and Home/End) move focus between tab buttons; update `tabIndex` so focused tab is `0`, others `-1`; keep `aria-selected` synced with `active` prop. Clicking a tab should still update selection. — Verify: keyboard-only navigation across all four tabs; no duplicate focus rings; `npm run lint`.

- [x] **Reduced motion** — In `app/globals.css`, add `@media (prefers-reduced-motion: reduce)` rules: `scroll-behavior: auto` on `html`; reduce or `display: none` the grain noise overlay and/or blur pseudo-elements in `GrainlineApp` (prefer class targets e.g. `.gl-noise`, `.gl-glow` added to those layers for clean CSS). Optionally in `components/IssuesPanel.tsx` / `jumpToAnchor`, use `{ behavior: prefersReducedMotion() ? "auto" : "smooth" }` if kept in JS. — Verify: toggle macOS “Reduce motion”; scroll-to-issue is instant; decorative layers calm down.

- [x] **Stretch (if time): measurement typography** — Audit `components/DresserPlanner.tsx` (and other dimension displays) for tabular nums / fraction presentation; add a small utility class `.gl-numeric` (`font-variant-numeric: tabular-nums`) where alignment matters. — Verify: columns of numbers align in Parts/Buy views; `npm run test` unchanged.

## Implementation notes (executed)

- Added `lib/motion-preference.ts`; `IssuesPanel` `scrollIntoView` respects reduced motion.
- `AppShellTabs` is a client component: `gl-stepper-shell`, arrow/Home/End on the main tablist, tab subtitles at `text-xs`, Materials callout uses `gl-panel-muted`.
- Surface classes applied to `JoineryPanel`, `BuyListPanel`, `RoughStickLayout`, `PartsTable`, `ProjectSetupBar` root, `GrainlineApp` intros and release panel; semantic red/amber issue groups keep explicit Tailwind borders.
- Parts and Dresser drawer-grid tables use `gl-numeric` for tabular figures. `npm run lint`, `npm run test`, `npm run build` passed.

## Risks & rollback

- **Risk:** Tablist keyboard changes could regress click behavior or screen reader announcements if `aria-*` drifts. **Rollback:** Revert `AppShellTabs.tsx` only; keep CSS token work.

- **Risk:** Primary button color on semantic tinted backgrounds (`blocked`/`warning`) could fail contrast. **Rollback:** Use outline-primary variant on those tones only (document in code comment).

- **Risk:** Global `prefers-reduced-motion` affecting `scroll-behavior` is low risk. **Rollback:** Remove the media block in `globals.css`.

## Post-ship verification (manual)

- Build, Materials, Review, Setup: **no** mixed `rounded-xl`/`rounded-2xl` on same nesting level without intent.
- Lighthouse accessibility spot-check (contrast + keyboard) on home route.
- Print route unchanged visually vs. current baseline (print styles already isolated).
