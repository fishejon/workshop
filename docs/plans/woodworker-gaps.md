# Woodworker gaps (prioritized)

Honest backlog against what Grainline ships today (README + PRD): dresser / board pack / sideboard shell presets, symmetric dresser constraints, parts + rough + joinery + buy list + 2D board estimate, CSV + `/print` gated by the material-assumptions checkpoint on Materials plus validation.

## Must

- **Hardware schedule** — Slides and clearances are heuristics with “confirm manufacturer” copy; no consolidated qty/spec schedule in exports.
- **Sheet-goods depth** — PRD Phase 2 sheet optimization; current focus is hardwood-style parts and buy guidance, not panel nesting.

## Should

- **Asymmetric / face-frame layouts** — README: symmetric dresser grid; face frames, inset/overlay not modeled—users hand-adjust or stay in the supported envelope.
- **Onboarding depth** — Happy path exists (tabs + flow copy) but no dedicated first-run tour; advanced joinery is easy to miss behind disclosure.
- **Standing cabinet / richer casework** — Queued preset; gap until template coverage matches dresser-level handoff.

## Could

- **Joinery UX weight** — Power features are correct but secondary; risk that joinery-first positioning feels lighter than strategy copy until library and surfacing grow.
- **Inventory / offcuts** — PRD Phase 2; no stockyard memory in app today.
- **Mobile shop mode** — Deferred; print/CSV are the portable artifacts for now.

---

## Release slice — Definition of done (dresser + board pack)

Use before calling a release “good enough” for your own shop:

1. **`npm test`** — full Vitest suite green.
2. **Dresser** — Run at least one **generate / replace** path; confirm parts land with expected assemblies and no unexpected blocking validation on a standard configuration.
3. **Board pack** — Run 1D layout with transport cap; confirm packed lengths respect stock length and kerf inputs.
4. **Print** — Open `/print`; confirm project name, assumptions, and part dimensions read clearly (browser print preview).
5. **CSV** — Export from Materials; spot-check a few rows for finished/rough and material columns vs on-screen parts table.
6. **Materials** — With **Material assumptions** checked and no blockers, confirm **Export CSV** and print link behave as expected (unlocked).

Manual print preview once per release candidate is still the bar for paper shop use.
