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

## Template system (Phase 10)

Grainline now supports a configuration-driven casework planner:

- `FurnitureConfig` is the canonical model for dresser/console/bookshelf templates.
- `CaseworkGenerationService` converts any `FurnitureConfig` into carcass/opening/back parts.
- `CaseworkPlanner` renders dynamic controls from `configurableFields` metadata.
- `TemplateStorageService` + `TemplateLibrary` provide save/load/duplicate workflows in the client.

This keeps furniture-type branching in template definitions, not in core generation/runtime services.

## Purchase intelligence (Phase 11)

Materials now includes scenario-driven procurement analysis:

- `PurchaseStrategyService` generates four strategies (waste, board count, transport, simple trip) over shared parts demand.
- `ScenarioComparison` presents side-by-side trade-offs and selection.
- `CostEstimationService` injects optional planning-cost estimates from user-entered species pricing.
- `StockConversionService` handles surfaced vs rough conversion assumptions used by scenario demand shaping.

All outputs remain planning guidance; yard verification is required for final purchases.
