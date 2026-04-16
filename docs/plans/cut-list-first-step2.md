# Implementation plan: Step 2 — Option A IA + single-column Cut list + `/labs` joinery (excluded from calculations)

## TL;DR

- **Option A tabs (user-facing):** **Project** · **Plan** · **Cut list** · **Review** (keep stable internal route/state ids initially if it reduces risk: `setup` | `build` | `shop` | `about`, with new labels only).
- **Step 2 layout:** **Cut list** is one primary column; **buy list** moves into a **drawer** or **`<details>`** (single accordion), not a permanent right rail.
- **Joinery:** `JoineryPanel` (and any joinery-only affordances on the main path) move to **`/labs`**. **`project.joints` is ignored** for cut-list math, validation that exists only for joints, CSV/print assumptions, and parts-row derivation on the main app and `/print`.
- **Labs honesty:** `/labs` may still **read/write** `project.joints` in persisted state for experiments, but the **main product must never consume those joints** until a future flag flips—document this on the labs page to avoid placebo UX.

## Goals

1. Reduce competing surfaces on **Cut list** (no two-column parts vs buy by default).
2. Make **joinery optional depth** physically and logically: UI quarantined; numbers on the happy path do not depend on joint history.
3. Preserve **trustworthy cut list + export** with **fewer gates**: align checkpoints with what the product actually asks users to verify.

## Non-goals (this step)

- Removing `joints` / `connections` from the `Project` type or import/export schema (can stay for forward compatibility).
- Rebuilding dresser/board engines (they may still emit **grain notes** referencing joinery intent; that text is informational, not `ProjectJoint` records unless the planner writes joints today—verify during implementation).
- Fraction/rational math rewrite.

## Critical decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Internal tab ids vs labels | **Rename labels in UI only** first (`TAB_META`, headers, copy); optionally rename `AppShellTabId` literals in a follow-up PR to reduce churn. | Smaller diff; fewer merge conflicts with open branches. |
| Where “ignore joints” lives | **Single helper** `jointsEffectiveForCutList(project): ProjectJoint[]` returning `[]` in production cut-list mode; **`/labs`** passes **real** `project.joints` only to labs-only components. | One switch for audits; avoids sprinkling `[]` everywhere. |
| Validation | **`validateProject`** (or callers) uses a **cut-list scope**: skip `collectJoineryConflictIssues` and skip **joinery-parameter loops** in `collectSanityValidationIssues` (e.g. mortise/tenon length check keyed off `project.joints`). | Joinery-only issues must not block export when joinery is out of scope. |
| Checkpoints | **Drop joinery from the export gate** for the main app: `canExportOrPrintProject` should require **only** `materialAssumptionsReviewed` (rename copy to “I verified rough sizes and materials” if needed). Keep `joineryReviewed` in schema for legacy projects but **treat as unused** in gating, or auto-satisfy when saving project version bump—pick one and document. | Avoids asking users to acknowledge joinery they cannot see. |
| CSV / print | Same as parts table: pass **`jointsEffectiveForCutList`** into `partsToCsv` and `derivePartAssumptionsDetailed` on `/` and `/print`. | Parity across surfaces (existing test pattern in `lib/parts-csv.test.ts` still tests **with** joints when scope is full—add a second case for cut-list scope if you expose a test helper). |

## Work breakdown

### 1. Cut-list scope module (lib)

- [ ] Add `lib/cut-list-scope.ts` (name flexible) exporting:
  - Runtime toggle via **`NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1`** when joinery should affect cut list, CSV, print, and assumptions (default off).
  - `jointsEffectiveForCutList(project: Project): ProjectJoint[]` — returns `[]` when the flag is off; when on, returns `project.joints`.
- [ ] Add `validateProjectForCutList(project: Project)` (or extend `validateProject(project, options?)`) that:
  - Omits `collectJoineryConflictIssues`.
  - Omits or gates the `for (const joint of project.joints)` block in `lib/validation/sanity-checks.ts` (and any other joint-only sanity paths).
- [ ] **Audit** `lib/` for `project.joints` / `joints` in buy/estimate paths (`purchase-scenarios`, `buy-2d/*`, `board-feet`, `rough-sticks`). Wire them to `jointsEffectiveForCutList` **only if** they affect displayed totals or assumptions; otherwise leave as-is to limit scope.

### 2. Wire main UI + print to cut-list scope

- [ ] **`components/PartsTable.tsx`** — use effective joints for `derivePartAssumptionsDetailed`, row explainers, and `partsToCsv`.
- [ ] **`components/ShopPrintView.tsx`** — same for assumptions column.
- [ ] **`components/ProjectSetupBar.tsx`** / any other surface showing checkpoint “both boxes” — align with single material checkpoint for gating.
- [ ] **`components/GrainlineApp.tsx`** — `checkpointsReady` for `canExportOrPrint` uses updated gate; remove `JoineryPanel` / `RoughStickLayout` from Materials column (rough sticks can move to `/labs` in this step **or** stay behind **Cut list → “Advanced layout tools”** `<details>`—choose one; plan default: **both joinery + rough sticks to `/labs`** if they are “workshop lab” density).
- [ ] **`lib/validation/index.ts`** + tests under `lib/validation/*.test.ts` — adjust fixtures so cut-list validation expectations exclude joint-driven issues.

### 3. `/labs` route

- [ ] Add `app/labs/page.tsx` (client or server as fits existing patterns).
- [ ] Render:
  - Short banner: joint edits persist in project JSON **but do not affect** cut list, CSV, print, or buy math unless **`NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1`**.
  - `JoineryPanel` (import from existing component).
  - Optionally `RoughStickLayout` here if removed from main path.
- [ ] Add a **small nav link** from the main shell footer or Project tab (“Joinery experiments (labs)”)—**not** a primary tab.

### 4. Option A — tab labels and Materials chrome (partial Step 1 overlap, acceptable)

- [ ] Update `TAB_META` / tab `label` + `task` strings to **Project / Plan / Cut list / Review**.
- [ ] **`WorkshopFlowGuide`** — either **remove** and rely on tabs + short header **or** collapse to a **single line** “Step 2 of 4” with links—product call during implementation; plan recommends **remove or merge into tab strip** to avoid duplicate steppers (align with prior UX critique).
- [ ] **`AppShellTabs`**: remove the **secondary** numbered stepper (`gl-stepper-shell` ol) **or** merge with tablist—only one navigation metaphor.

### 5. Step 2 layout — single column Cut list + buy drawer

- [ ] **`AppShellTabs`** (Materials / `shop` branch): replace `shopMaterialsLeft` + `shopMaterialsRight` side-by-side with:
  - Primary: `PartsTable` full width.
  - Secondary: `<details className="…">` **“Lumber & buy list”** default **closed** on mobile; on desktop consider **default open** once if `prefers-reduced-motion` / `localStorage` “buy drawer open” preference—optional.
  - Inside details: `BuyListPanel` only (or buy + short BF/LF recap if duplicated elsewhere).
- [ ] **`GrainlineApp.tsx`**: stop passing `shopMaterialsRight` as a second column; refactor `AppShellTabs` props to a single `cutListExtras?: ReactNode` or inline the details in `AppShellTabs` to avoid prop drilling two arbitrary columns.
- [ ] Remove or shorten the **muted procurement explainer** card above the fold on Cut list (move one sentence into empty state or buy `<summary>` line).

### 6. Review tab copy

- [ ] Remove joinery checkbox UI and strings referencing “joinery deltas/history” **or** replace with a single **“I verified finished and rough sizes on the cut list”** if you still want a deliberate human gate—prefer **one** checkbox + material assumptions to match Option A simplicity.

### 7. Documentation & rules

- [ ] `docs/USER_GUIDE.md` — document `/labs`, cut-list-only behavior, and that legacy projects may still contain `joints` data that is dormant.
- [ ] `docs/WOODWORKER_CHECKLIST.md` — align checklist items with the new gate (no joinery acknowledgment on main path).
- [ ] `.cursor/rules/agent-ux.mdc` / `agent-ui.mdc` — one-line note that joinery is labs-only until re-enabled (optional, if you keep rules in sync with product).

### 8. QA / Definition of done

- [ ] **Dresser happy path:** generate parts → Cut list shows rows → open buy drawer → export CSV and `/print` **without** visiting `/labs`; outputs have **no joinery-derived assumption text** from `project.joints` (only static “no recorded joinery…” or similar).
- [ ] **Labs path:** add a joint record → return to main Cut list → confirm **dimensions/CSV unchanged** vs before labs edit.
- [ ] **Validation:** joint conflict fixtures do **not** block export on main app when joints exist in JSON from an old save.
- [ ] **Lint + tests** green; add at least one test for `validateProjectForCutList` ignoring joint conflicts.

## Suggested implementation order

1. `jointsEffectiveForCutList` + `validateProject` scope + checkpoint gate (unblocks coherent behavior).
2. Wire PartsTable, print, CSV.
3. `/labs` page + remove joinery from main layout.
4. **Materials** layout refactor (details/drawer) + prop cleanup on `AppShellTabs`.
5. Tab rename + duplicate stepper removal + Review copy.
6. Docs + QA pass.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Users with existing `joints` think edits still apply | Labs banner + migration note in USER_GUIDE; optional one-time toast “Joinery is off the cut list for now.” |
| Dresser or another preset **writes** `joints` automatically | Audit planners on save; if they enqueue joints, either stop writing or document that data is labs-only until re-enabled. |
| Test suite assumes joint validation | Split fixtures: `validation.fixture.ts` joint cases run under `validateProject(..., { scope: 'full' })` in labs-only or dedicated test file. |

## Out of scope follow-ups (Step 3+)

- Merge **Review** into Cut list sticky footer.
- Feature flag to re-enable joinery in cut-list scope for power users.
- Rename internal `shop` / `about` ids to `cutList` / `review` across codebase.
