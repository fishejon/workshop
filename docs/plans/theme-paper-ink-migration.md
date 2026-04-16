# Plan: Paper + ink theme (audit + ui-design-decisions)

## Locked decision

**Ship a light “shop drawing” theme** — warm paper field, near‑ink type, **one** forest accent for primary actions and focus, semantic red/amber/green **only** for validation and destructive emphasis. **Retire** the dark charcoal + copper + teal atmospheric stack; teal does not return unless it becomes the sole accent (it does not).

**Rationale (one line):** Matches Grainline calibration (*considered utility*, lumber/craft without rustic costume) and directly answers the audit: too many accent personalities and brown‑cast fatigue.

**Explicitly not doing in v1:** Dark/light toggle (add after light theme is stable); replacing Geist / Libre Baskerville (type is fine — color was the pain).

---

## Canonical tokens (`:root`) — paste into `app/globals.css` after removing old `--gl-*` block

Use **role names** below; map legacy `var(--gl-*)` usages in code to these over phases.

```css
:root {
  /* Page */
  --gl-bg: #f0ebe3; /* warm sheet — not pure white */

  /* Surfaces (panels sit above page) */
  --gl-surface: #ffffff;
  --gl-surface-muted: #e8e2d8;
  --gl-surface-inset: #f7f4ee; /* zebra / nested */

  /* Text */
  --gl-text: #161412;
  --gl-text-soft: #2a2724;
  --gl-muted: #5e5952; /* secondary labels — target ≥4.5:1 on --gl-surface */

  /* Accent = ONLY primary actions, links, focus, selected preset ring */
  --gl-accent: #2a5740;
  --gl-accent-hover: #234a36;
  --gl-accent-muted: #dfe8e2; /* tinted fill behind accent copy */
  --gl-on-accent: #ffffff; /* text on filled accent buttons */

  /* Semantic (issues, decision strip — keep hues, tune for light bg) */
  --gl-success: #166534;
  --gl-success-bg: #dcfce7;
  --gl-warning: #9a3412;
  --gl-warning-bg: #ffedd5;
  --gl-danger: #991b1b;
  --gl-danger-bg: #fee2e2;

  /* Borders / dividers — tinted warm, not neutral gray */
  --gl-border: #d4cdc2;
  --gl-border-strong: #b8afa3;

  /* Legacy aliases (remove in cleanup phase once grep is zero) */
  --gl-cream: var(--gl-text);
  --gl-cream-soft: var(--gl-text-soft);
  --gl-ink: #f4f1eb; /* sticky table header bg on light: pale band */
  --gl-copper: var(--gl-accent);
  --gl-copper-bright: #3d6f52;
  --gl-teal: var(--gl-accent); /* kill separate hue — points at accent */
}
```

**`body` rule:**

```css
body {
  background: var(--gl-bg);
  color: var(--gl-text);
}
```

**`app/page.tsx`** wrapper: change `text-[var(--gl-cream)]` → `text-[var(--gl-text)]` if still hardcoded.

---

## System rules (enforce in code review)

| Role | Token | Allowed uses |
|------|--------|----------------|
| Page | `--gl-bg` | `body`, optional full-bleed areas only |
| Panels | `--gl-surface`, muted variants | `.gl-panel`, cards, raised sections |
| Primary type | `--gl-text`, `--gl-text-soft`, `--gl-muted` | All copy hierarchy |
| Brand / primary CTA | `--gl-accent`, hover, `--gl-on-accent` | Primary buttons, key links, focus rings, **one** selected-state treatment (e.g. preset pill) |
| Semantic | `--gl-*-bg` + strong text classes | Issues panel, decision strip, inline alerts only |
| Atmosphere | **None** | No full-screen noise, no second glow hue; optional **5% accent** radial later if the UI feels flat |

---

## Phase 0 — Inventory (½ day)

- [x] Run `rg "border-white/|bg-black/|bg-white/\\[0" components app` → spreadsheet of patterns; group into ~4 replacements (`border-[var(--gl-border)]`, `bg-[var(--gl-surface-muted)]`, etc.).
- [x] Run `rg "gl-copper|gl-teal|#141210"` → list files for accent swap.

**Verify:** spreadsheet + file count estimate.

---

## Phase 1 — Globals + primitives (1 day)

- [x] Replace `:root` and `body` in `app/globals.css` per table above.
- [x] Rewrite **`.gl-panel`**: `background: var(--gl-surface); border: 1px solid var(--gl-border);` remove dark-only blur or reduce to `0 1px 0 rgba(0,0,0,0.04)` shadow if blur reads muddy on light.
- [x] Rewrite **`.gl-panel-muted`**: `background: var(--gl-surface-muted); border-color: var(--gl-border)`.
- [x] Rewrite **`.gl-panel-nested`**: `background: var(--gl-surface-inset);`.
- [x] Rewrite **`.gl-stepper-shell`**: light borders `var(--gl-border)`, background `color-mix(in srgb, var(--gl-surface) 92%, var(--gl-bg))`.
- [x] **`.input-wood`**: border `var(--gl-border-strong)`, background `#fff`, color `var(--gl-text)`, placeholder `#9c958c`, focus ring `var(--gl-accent)`.
- [x] **`.gl-btn-primary`**: background `var(--gl-accent)`, hover `var(--gl-accent-hover)`, text `var(--gl-on-accent)`, focus outline `2px solid var(--gl-accent)`.
- [x] **`GrainlineApp`**: delete **both** `gl-glow` divs OR set a single `opacity: 0.06` blob using **only** `var(--gl-accent)` (optional). Remove `gl-noise` entirely for v1 (paper does not need grain).

**Verify:** Home + Build + Materials at desktop width; contrast spot-check muted text on `surface`.

---

## Phase 2 — Mechanical Tailwind pass (1–2 days)

Replace dark-assumption utilities in **this order** (reduces churn):

1. `border-white/10` → `border-[var(--gl-border)]` (or `border-[color-mix(in srgb,var(--gl-border)70%,transparent)]` where subtle).
2. `bg-black/20`, `bg-black/25`, `bg-black/30` → `bg-[var(--gl-surface-muted)]` or `bg-[var(--gl-surface-inset)]`.
3. `bg-white/[0.04]` etc. → `bg-[var(--gl-surface)]` with border as needed.
4. `text-[var(--gl-cream)]` → already aliased; prefer **`text-[var(--gl-text)]`** in edits for clarity.
5. `hover:text-[var(--gl-cream-soft)]` → `hover:text-[var(--gl-text)]` or `text-[var(--gl-text-soft)]`.
6. Primary filled buttons currently `bg-[var(--gl-copper)]` + `text-[var(--gl-bg)]` → `bg-[var(--gl-accent)]` + `text-[var(--gl-on-accent)]` (never `text-[var(--gl-bg)]` on buttons again — `--gl-bg` is no longer “ink”).
7. **Decision strip** / **Issues**: swap tinted containers to `--gl-*-bg` tokens + text `--gl-danger` etc. on light fills.

**Files (expect all to touch):** `components/*.tsx`, `app/page.tsx`, `app/globals.css`. `ShopPrintView` / `@media print`: **leave** print rules as-is unless a variable now breaks forced colors — then set explicit `#000` / `#fff` only inside print scope.

**Verify:** `npm run lint && npm run test && npm run build`; click through Setup → Build → Materials → Review; open `/print`.

---

## Phase 3 — Polish + debt (½ day)

- [x] Remove `--gl-teal` usage from any remaining inline styles; delete unused CSS variables.
- [x] Experimental row in header: change `amber-300/25` container to **`border-[var(--gl-border)]` + `bg-[var(--gl-surface-muted)]`** + text `var(--gl-muted)` so it does not shout on paper.
- [ ] Optional: add **`font-mono`** utility to dimension cells only (skill: monospace for numbers) — `PartsTable` numeric columns + Dresser dimension reads.

**Verify:** no `rg "copper|teal|141210"` except comments / git history; Lighthouse contrast sample on Build tab.

## Implementation notes (executed)

- `app/globals.css`: full paper+ink `:root`, legacy `--gl-cream` / `--gl-copper` aliases, light `.gl-panel*`, `.gl-stepper-shell`, `.input-wood`, `.gl-btn*`, `body` text color.
- `scripts/apply-paper-theme-sweep.mjs`: mechanical replacement of `border-white/*`, `bg-black/*`, `bg-white/*`, divides, rings, `text-[var(--gl-bg)]` on CTAs, `backdrop-blur`, `ShopPrintView` `gl-ink` borders → `gl-border`.
- Manual: `GrainlineApp` (removed noise/glows; preset + experimental row), `DecisionStrip` / `IssuesPanel` semantic tokens, `AppShellTabs` stepper accent, inline `red-*`/`amber-*`/`emerald-*` → `gl-*` semantic vars across planners and lists.
- Legacy names (`--gl-copper`, `--gl-cream`) remain as aliases for gradual call-site cleanup; `--gl-teal` aliases to `--gl-accent`.

---

## Risks & rollback

- **Risk:** Missed `white/` utility leaves invisible text on light panels. **Mitigation:** Phase 2 grep checklist; visual sweep. **Rollback:** revert `globals.css` + `GrainlineApp` + `page.tsx` in one commit.

- **Risk:** Sticky table header used `--gl-ink` as dark wash — redefined as pale band; confirm **Parts** thead still readable.

---

## Success criteria

- One accent hue in the UI chrome; semantic colors only in status surfaces.
- No teal decorative glow; no copper naming in **new** code (aliases OK until cleanup).
- Muted body text passes **WCAG AA** on `--gl-surface` (spot-check with DevTools).
