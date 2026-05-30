# Coding Standards

## General

Prefer small, reviewable changes.

Use clear module boundaries.

Do not introduce new architectural patterns unless the current phase calls for them or a decision is recorded.

## Node

Use ESM only.

Do not use CommonJS.

Use Express for backend routes and services.

Prefer plain modern JavaScript for MVP unless a later decision introduces TypeScript.

Keep route handlers thin. Put business logic in services and data access in repositories or shared packages.

## Frontend

Use Twig/server-rendered pages by default.

Use vanilla JavaScript for simple interactivity.

Use React only for highly dynamic screens.

Avoid framework sprawl.

## CSS

Use SCSS.

No Bootstrap.

No Tailwind.

No heavy utility-class framework.

Use shared design-system conventions and tokenized CSS variables.

Use `rj-` prefixes for shared design-system/platform classes and tool-specific prefixes for tool-specific classes.

## Documentation

Update documentation when behavior, commands, decisions, or scope change.

Do not create random top-level files under `docs/`.

Use `docs/working-notes/` for exploratory notes.

## Naming

Avoid naming shared services after a specific tool.

For example, shared AI call logging should not be named as if it belongs only to Sounds Like Us.
