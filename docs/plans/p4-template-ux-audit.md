# P4-M1 — Template UX audit (local templates)

**Scope:** Milestone audit for Phase 4 (project memory and templates). Ground truth: `lib/project-utils.ts` (`serializeTemplate`, `applyTemplate`, `cloneProject`, `parseTemplates`, `PROJECT_TEMPLATES_STORAGE_KEY`) and template UI in `components/ProjectSetupBar.tsx`. Full-project duplication in context is implemented with `cloneProject` from the same module.

## What works

- **Clear split in the UI** between “Duplicate current project” and “Templates”: duplicate keeps the live graph with remapped IDs and remapped cut progress; starting from a template always builds a fresh project via `applyTemplate` with empty cut progress and reset checkpoints (aligned with treating a template as a new starting point).
- **Serialization is explicit enough for reuse:** `serializeTemplate` deep-copies parts, joints, connections, workshop prefs, cost rates, stock width overrides, and core setup numbers (milling allowance, transport length, max purchasable width, waste). `applyTemplate` remaps the graph so joint and connection IDs stay consistent after apply (covered in tests).
- **Persistence path is simple:** templates live in `localStorage` under `PROJECT_TEMPLATES_STORAGE_KEY`; the bar loads and parses them with `parseTemplates`, dedupes by template id, and skips malformed rows without crashing the panel.
- **Apply flow is gated:** “Create from template” is disabled when no template is selected, which avoids a foot-gun when the list is empty.
- **Naming defaults:** placeholder-driven defaults for duplicate name and “from template” project name reduce friction for users who accept the suggested strings.

## Gaps

- **No lifecycle for templates beyond save:** users cannot rename, delete, reorder, or export a single template from the UI; the list only grows until someone clears storage manually.
- **Save gives no success signal:** unlike backup/import/export, saving a template does not write to `transferStatus` / `transferMeta`, so confirmation is only implicit (list updates, field clears).
- **Empty template name is a silent no-op** (`trim()` then `return`), with no inline hint that a name is required.
- **“Create from template” replaces the entire active project** with no confirm step; that is correct for power users but easy to misread as “merge” or “add parts,” especially next to duplicate wording.
- **What is not in a template is invisible:** `serializeTemplate` does not carry checkpoints, cut progress, or `Project.geometry` (and `ProjectTemplate` has no geometry field). Users are not told that templates are a structural + setup snapshot, not a full clone of project state.
- **Selection can drift:** `selectedTemplateId` is not reconciled if `parseTemplates` drops the selected row after a bad edit or partial sync; the select can show stale or empty pairing until the user changes selection.
- **Device-local only:** there is no import/export path for the template array itself, so templates do not travel with project JSON export by default.

## Risks

- **Destructive apply without friction** risks losing unsaved intent if the user expected a non-destructive action.
- **Silent parse drops** mean a user who hand-edits storage or merges arrays may lose templates with no surfaced error.
- **Template vs PRD “templates” language:** the PRD speaks to furniture-type templates (table, carcass, drawer box); today’s feature is “snapshot of current project,” which may not match mental models until copy or onboarding clarifies it.

## Concrete next issues (3–5)

1. **Confirm before apply:** one-step confirmation (or undo window) when applying a template would replace the current project, with copy that states checkpoints and cut progress reset.
2. **Template management row:** delete (and optionally rename) selected template, with `persistTemplates` updating storage and selection falling back to the first remaining id.
3. **Save feedback:** mirror backup/import with a short `transferStatus` line on successful template save (and optional warning if part count is very large for storage limits).
4. **Document or encode template payload:** either extend `ProjectTemplate` + `serializeTemplate` / `parseTemplates` for fields you intend to preserve (for example validated `geometry` when that becomes SSOT), or add UI/helper text listing what is included and excluded.
5. **Import/export template bundle (optional slice):** JSON download/upload of the template array (or single template) for backup and cross-machine use without pulling full project library work into the same PR.

## Verify steps

- Save a template from a non-trivial project (multiple parts, joints, connections); reload the app; confirm the template appears and `Create from template` yields a new project name, new part ids, and consistent joint/connection links.
- Duplicate the same project and confirm cut progress carries over where rough instance ids remap; confirm checkpoints reset per `cloneProject` behavior.
- Apply a template and confirm cut progress is empty and material/joinery checkpoints require re-acknowledgment where the rest of the app expects it.
- Corrupt `PROJECT_TEMPLATES_STORAGE_KEY` with invalid JSON and confirm the UI does not throw; repeat with one valid and one invalid row and confirm the valid row still parses.
- With templates present, clear `localStorage` for the key in devtools, reload, and confirm the empty state and disabled apply button behave predictably.
