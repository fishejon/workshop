# Grainline Architecture Notes

## Joinery 2.0 core model

Grainline models advanced joinery as a connection graph:

- `PartConnection` edges link two parts with method, constraints, and adjustments.
- `ConnectionGraphService` builds/validates graph data from joinery records.
- `JoineryDependencyResolver` orders adjustments so structural joins resolve before surface cuts.
- `PresetApplicationService` applies repeatable construction presets that emit connections.

This keeps provenance auditable while preserving the existing project part schema (`finished` / `rough` dimensions).

## Runtime flow

1. User applies single joinery rule or construction preset.
2. Graph + dependency resolver produce ordered adjustments.
3. Part dimensions update, joint records append, and part connections are persisted.
4. Impact preview and print/CSV exports read the same graph-derived state.
