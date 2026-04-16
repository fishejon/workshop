# Template System

Template System adds configuration reuse on top of casework planning.

## Architecture

- Template definitions live in `lib/templates/furniture-templates.ts`.
- `CaseworkPlanner` renders configurable fields from template metadata.
- `TemplateStorageService` persists user templates in `localStorage`.
- `TemplateLibrary` provides load/duplicate/delete and search/filter.

## User flow

1. Choose a template preset in Project.
2. Tune dimensions/options in Plan.
3. Save as template for reuse.
4. Load or duplicate from template library for new projects.

## Data model

- `FurnitureTemplate`: built-in template metadata + `defaultConfig`.
- `FurnitureConfig`: normalized project definition for generation.
- `SavedTemplate`: persisted user-owned snapshot with timestamps.
