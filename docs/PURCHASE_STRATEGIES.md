# Purchase Strategies

Phase 11 adds strategy-based procurement scenarios over the same parts demand.

## Implemented strategies

- `minimize-waste` — prioritize tighter material utilization.
- `minimize-board-count` — reduce board count for simpler handling/trips.
- `fit-transport` — cap board lengths to your transport limit.
- `simple-trip` — restrict to common 8ft/10ft stock for convenience.

## Metrics produced per scenario

- Board feet, linear feet, board count.
- Waste board feet and waste percentage.
- Longest board, transport feasibility, and unique stock-size complexity.
- Optional cost estimate and cost-per-BF when pricing exists.

## Constraints and assumptions

- Scenarios are planning aids, not guaranteed stock availability.
- Packing uses rough length demand and stock-width recommendations.
- Yard verification is still required before purchase.
