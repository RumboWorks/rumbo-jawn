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

- `sounds-like-us.md` — first tool.
- `eval.md` — Eval (formerly Model Eval), the second tool; migrated into the platform in `docs/development-phases/phase-10`–`phase-14`.

## Tool switcher copy and icons

The global tool switcher is driven by the code-level registry in `packages/config/src/tools.js`.

To change a tool's switcher text or icon, update that tool's registry entry:

- `name` — short display name shown in the header and switcher.
- `description` — one-sentence switcher description.
- `icon` — Lucide icon name in kebab case, used with `<i data-lucide="...">`.
- `path` — landing route used when a user selects the tool.
- `navOrder` — sort order in the switcher.

If you use a new Lucide icon, also import and add it to `apps/platform-web/src/assets/js/icons.js`; otherwise the placeholder `<i>` element will not render as an SVG.
