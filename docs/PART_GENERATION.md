# Part Generation (Template System)

`CaseworkGenerationService` converts a `FurnitureConfig` into generated openings and normalized parts.

## Pipeline

1. Generate carcass shell (sides, top, bottom).
2. Add optional dividers.
3. Add optional face-frame rails/stiles.
4. Expand opening-specific parts (`drawer`, `shelf`; skip `open`).
5. Add optional back panel.

## Opening grid logic

- Uses row/column placement from `openings[].position`.
- Derives opening width/height from spans if explicit sizes are omitted.
- Uses carcass interior envelope based on thickness + overhang/base offsets.

## Validation constraints

- Minimum outer dimensions.
- Requires at least one opening.
- Catches direct row/column overlap collisions.
