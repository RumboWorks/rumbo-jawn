# Coding Standards

## JavaScript/Node

- Use ESM only.
- Do not introduce CommonJS.
- Prefer plain modern JavaScript for MVP unless a phase explicitly introduces TypeScript.
- Keep route handlers thin.
- Put business logic in services/packages.
- Shared capabilities belong in `packages/`, not inside one tool.

## Express

- Route modules should be explicit and easy to trace.
- Tool routes should be isolated by tool module.
- Do not create separate auth/session systems per tool.

## Twig

- Use Twig for server-rendered page shells.
- Keep page source traceable: each major page should have an obvious Twig file.
- Dynamic React screens should still have a Twig shell that mounts the React component.

## Frontend JS

- Use vanilla JS modules for simple behavior.
- Use React only where the screen is meaningfully dynamic.
- Do not convert simple forms/pages into React by default.

## CSS/SCSS

- Use SCSS.
- No Bootstrap.
- No Tailwind-style framework.
- Use shared design-system classes with `rj-` prefix.
- Use tool-specific prefixes for tool-only styles.
- Avoid generic global classes.

## Database

- Use Prisma migrations.
- Avoid raw SQL unless needed.
- If raw SQL is needed, isolate it and document DB assumptions.
- Tool-specific tables should reference shared users/orgs/jobs where applicable.

## Python

- Python routines should accept JSON input and return JSON output or write documented JSON artifacts.
- Keep the Node/Python contract explicit.

## Documentation

Update docs in the same phase as code changes. Do not leave docs stale for a later cleanup phase unless the deferral is recorded.
