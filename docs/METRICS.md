# Metrics

## Phase 10 code reuse snapshot

- Shared template-system core:
  - `lib/services/CaseworkGenerationService.ts`
  - `lib/hooks/useCaseworkGeneration.ts`
  - `components/casework/CaseworkPlanner.tsx`
  - `lib/services/TemplateStorageService.ts`
  - `components/templates/TemplateLibrary.tsx`
- Type-specific logic:
  - Template definitions in `lib/templates/furniture-templates.ts`.

Estimated shared-vs-specific ratio for currently shipped types (dresser, console, bookshelf) remains above 80% because behavior is driven by template config rather than type branches in services.

## Performance targets

- Config change: target <50ms
- Part generation: target <100ms
- Template load (100 rows): target <50ms
