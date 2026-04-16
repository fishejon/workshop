# Furniture Configuration Schema

Phase 10 introduces `FurnitureConfig` as the source of truth for template-driven casework.

## Core model

- `type`: furniture archetype (`dresser`, `console`, `bookshelf`, etc.).
- `dimensions`: outer envelope and stock thickness assumptions.
- `material`: primary and optional secondary stock definitions.
- `openings`: drawers, shelves, doors, or open zones with row/column placement.
- `construction`: carcass joinery, back-panel strategy, dividers, face frame.
- `features`: overhang/base/hardware style options.

## Why it exists

- Removes type-specific branches from core part generation.
- Enables save/load/duplicate template workflows with stable JSON.
- Lets new furniture types ship through templates instead of planner rewrites.

## Current templates

- `dresser-classic`
- `console-table`
- `bookshelf-adjustable`
