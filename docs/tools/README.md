# Tool Modules

Tools are product modules built on the Rumbo platform.

Each tool may have its own:

- routes,
- views,
- frontend assets,
- services,
- jobs,
- data tables,
- artifacts,
- user flows,
- output formats.

Tools must use shared platform services for:

- authentication,
- users,
- organizations,
- memberships,
- jobs,
- AI calls,
- cost logging,
- storage abstraction,
- usage limits,
- billing readiness,
- admin visibility,
- design-system conventions.

Tools must not depend on each other's internals.

## Current tools

- `sounds-like-us.md` — first MVP tool.
- `model-eval.md` — planned sibling tool, out of scope for initial MVP implementation.
