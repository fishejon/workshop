# Cursor agent rules — Grainline

These `.mdc` files live in **this repo** at `.cursor/rules/`. They steer **on-demand** AI behavior (`alwaysApply: false`).

**Canonical product docs:** `docs/PRODUCT_STRATEGY.md`, `docs/PRD.md`, `docs/USER_GUIDE.md`, and `docs/plans/cohesion-woodworker-readiness.md`.

## How to use in Cursor

**Option A — Tag in chat:**  
`@agent-pm` … `@agent-architect` … (pick the role that matches the question.)

**Option B — Natural language:**  
“From a UX perspective, …” — Cursor may still surface a matching rule by description.

## Which agent when?

| Question type | Start with |
|----------------|--------------|
| Scope, roadmap, acceptance criteria | `agent-pm` |
| System shape, boundaries, data model | `agent-architect` |
| Lumber tables, persistence, calculation purity vs tests | `agent-backend` |
| Components, React state, forms, print route | `agent-frontend` |
| Flow, hierarchy, onboarding, friction | `agent-ux` |
| Tokens, type, density, microcopy | `agent-ui` |
| DoD, test gaps, ship blockers | `agent-eng-manager` |

## Files

| File | Agent | Focus |
|------|-------|-------|
| `agent-architect.mdc` | Alex Chen | Stack fit, boundaries, furniture vs config |
| `agent-frontend.mdc` | Priya Nair | UI implementation, a11y, print/export |
| `agent-backend.mdc` | Marcus Reid | Data model, nominal lumber SSOT, math/testing |
| `agent-eng-manager.mdc` | Jordan Taylor | DoD, tests, release discipline |
| `agent-ux.mdc` | Sofia Andreou | Journeys, progressive disclosure |
| `agent-ui.mdc` | Luca Ferretti | Visual language, shop/read contrast |
| `agent-pm.mdc` | Amara Diallo | Requirements, prioritization |

## Example prompts

- `@agent-pm` — “What’s in scope for the next milestone vs later?”
- `@agent-architect` — “Where should joinery vs buy math live?”
- `@agent-backend` — “Review `lib/nominal-lumber-stocks.ts` and storage migration risk.”
- `@agent-ux` — “Does Project → Plan → Cut list → Review read as one journey?”
- `@agent-eng-manager` — “What’s the DoD for shipping a dresser change?”
