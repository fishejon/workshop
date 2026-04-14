# Cursor Agent Rules — Woodworker's Cut List Tool

Drop the `.mdc` files in this folder into your project at:

```
your-project/
└── .cursor/
    └── rules/
        ├── agent-architect.mdc
        ├── agent-frontend.mdc
        ├── agent-backend.mdc
        ├── agent-eng-manager.mdc
        ├── agent-ux.mdc
        ├── agent-ui.mdc
        └── agent-pm.mdc
```

## How to use in Cursor

Each rule is set to `alwaysApply: false` — meaning agents are invoked on demand, not on every prompt. To use one, either:

**Option A — Tag in chat:**
Type `@` in the Cursor chat and select the rule by name. Example:
> `@agent-pm what should I build next?`

**Option B — Reference by description:**
Open Cursor chat and reference the agent naturally:
> "As the UX designer, review this form layout"

Cursor will surface the matching rule.

## Agents

| File | Agent | Focus |
|------|-------|-------|
| `agent-architect.mdc` | Alex Chen | Tech stack, system design, data model, lumber math architecture |
| `agent-frontend.mdc` | Priya Nair | Components, state, fraction inputs, print output, UI logic |
| `agent-backend.mdc` | Marcus Reid | Lumber lookup table, fractional math, local storage schema, validation |
| `agent-eng-manager.mdc` | Jordan Taylor | QA, definition of done, scope discipline, test coverage |
| `agent-ux.mdc` | Sofia Andreou | User flows, form usability, output hierarchy, onboarding |
| `agent-ui.mdc` | Luca Ferretti | Color system, typography, copy, print stylesheet, visual polish |
| `agent-pm.mdc` | Amara Diallo | Requirements, prioritization, user stories, roadmap sequencing |

## Good starting prompts

- `@agent-pm` → "What are the must-have requirements for the dresser calculator MVP?"
- `@agent-architect` → "Review the current project structure and flag any architectural concerns"
- `@agent-backend` → "Is our lumber size lookup table using correct nominal vs. actual dimensions?"
- `@agent-ux` → "Walk through the new project flow and identify any friction points"
- `@agent-ui` → "Review this component against our design system"
- `@agent-frontend` → "How should we handle imperial fraction input in the form fields?"
- `@agent-eng-manager` → "What's blocking us from shipping the dresser calculator?"
