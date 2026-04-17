# Cost Modeling

Purchase Intelligence supports optional cost estimation using user-entered species pricing.

## Inputs

- Price per board foot (preferred) or linear foot per species.
- Optional source/grade metadata.
- Pricing is persisted in browser `localStorage` for reuse.

## Output

- Scenario-level estimated total cost.
- Optional cost-per-board-foot metric for scenario comparison.
- Warning messages when some species are missing pricing.

## Disclaimer discipline

All cost values are shown as **planning guidance only**:

- Confirm final quotes with your lumber supplier.
- Regional availability, grade, and moisture conditions can shift price materially.
- Do not treat app estimates as purchase orders or invoices.
