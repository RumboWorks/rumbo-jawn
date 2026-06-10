# Design System Reference

Implementation source of truth: `@rumbo/design-system` (shared browser preference contract) and the platform SCSS at `apps/platform-web/src/assets/scss/`. This file is the orientation map, not the spec.

## Class prefixes

- `rj-` — shared platform/design-system classes (buttons, forms, tables, cards, badges, alerts, lists, layout, admin panels).
- `slu-` / `eval-` — tool-specific classes; tools must not duplicate shared primitives (see `docs/project-charter/coding-standards.md` → CSS).

## Tokens and themes

- `partials/_base-tokens.scss` defines CSS variables (colors, typography, spacing, shadows, layout constants); themes override them.
- Selectable themes: **light, dark, paper (default), pink** via `data-theme` on the root element. Additional theme partials (`_theme-brand.scss`, `_theme-bw.scss`, `_theme-rumboworks*.scss`) are brand/experimental sources, not user-selectable.
- Density: comfortable/compact via `data-density`.
- Theme and density are browser-local preferences; navigation orientation (`data-nav-orientation`, horizontal/vertical) is account-synced (`User.navOrientation`).
- Color palette page: https://rumbo.dev9.rpkn.qa/brand/rumboworks-colors.html

## Layout shells

- `views/layouts/base.twig` — public/marketing pages (header + footer, no sidebar).
- `views/layouts/app.twig` — authenticated app shell: header (logo, tool switcher, admin link, account menu), per-tool sidebar block, 1200px default content width (fluid override class available).
- Per-tool sidebars are page partials (e.g. `views/pages/eval/_sidebar.twig`) included from the `sidebar` block.

## Key shared components

- `partials/page-header.twig` — heading, subtitle, breadcrumbs, right-aligned action button. Use on every list/detail page.
- `src/assets/js/inline-edit.js` — generic list-row inline-edit controller; markup contract and the list-first convention are documented in `docs/project-charter/coding-standards.md` → Interaction patterns.
- Admin panels: `.rj-admin-panel` with `__header` and `__body` children (every panel content sits inside `__body`).
- Dialogs: native `<dialog>` styled per the tool-switcher pattern (`partials/tool-switcher.twig`, styles in `partials/_layout.scss`); the Eval report drilldown follows the same approach.
- Icons: Lucide via `data-lucide` attributes, initialized in `src/assets/js/icons.js`.

## Build

`npm run build --workspace=rumbo-web` compiles SCSS/JS via Vite. Restart `rumbo-web` after Twig changes (templates are cached in-process).
