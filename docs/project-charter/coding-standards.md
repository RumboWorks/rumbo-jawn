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

### Interaction patterns

The default feel is modern, fast, inline, and low-friction — not a full page reload for every action. Escalate only when the data warrants it:

- **Lists are the primary view.** A list/index page shows existing items first; "Add" is a button in the page header that links to a dedicated add interface. Use the shared `partials/page-header.twig` (with an `action`) for the header.
- **Edit is inline by default.** A row displays read-only until the user clicks **Edit**; it then becomes an inline form in place; **Save** persists over `fetch` (no page load) and the row flips back to the updated display; **Cancel** reverts. Use the shared inline-edit controller (`src/assets/js/inline-edit.js`) and its markup contract (`[data-inline-edit]`, `[data-edit-display]`, `form[data-edit-form]`, `[data-edit-start]`, `[data-edit-cancel]`, `form[data-inline-remove]`), plus the `rj-list`/`rj-item` styles.
- **Saves are AJAX where practical.** Mutation endpoints content-negotiate: when called with `X-Requested-With: XMLHttpRequest` they return JSON (`{ ok, rowHtml }` for an edit, `{ ok, removed }` for a delete); otherwise they redirect with a flash. Keep the no-JS path working (progressive enhancement). For an edit, the server re-renders the row partial and returns it, so display formatting stays server-side and DRY.
- **Escalate to a full page** only when the item is too large to edit inline (a page-worth of fields).
- **Immediate-save interactions** (e.g. the Eval review screen's ratings/comments) save on change without an explicit Save button — a distinct pattern from admin forms, and a candidate for a React island when the screen is highly dynamic.

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
