# Phase 17 — Structural and UI Consistency

## Purpose

One shell, one set of interaction patterns, before new surfaces (admin/partner/billing/help) are built on them. Part of the finish-line plan (decision log 2026-06-10).

## What this phase delivers

- **Unified tool shell.** Authenticated SLU pages (index when signed in, history, job progress, workbench) use `layouts/app.twig` with a new `pages/slu/_sidebar.twig` (Analyze, Your analyses). The anonymous SLU entry stays on `layouts/base.twig` via conditional extends. The workbench opts into full width via a new `content_class` block (`rj-app-content--fluid`); `app.twig` also gains a `scripts` block.
- **Account pages on the platform convention.** `/account` profile and password become inline-edit rows (`_profile-row.twig`, `_password-row.twig`); org member management becomes inline-edit rows (`_member-row.twig`) with AJAX role save and row removal. `src/routes/account.js` content-negotiates (`{ok, rowHtml}` / `{ok, removed}` for AJAX; redirect + flash without JS). Shared `pages/account/_sidebar.twig` replaces duplicated sidebars; both pages use `partials/page-header.twig`.
- **Shared segmented control.** The sliding segmented control moved from `_slu.scss` to a new shared `partials/_segmented.scss` as `rj-segmented` (`__indicator`, `__btn`, `__label`, `__desc`, `--vertical`), fixing the platform/tool boundary violation where Eval's Score/Rank switch reused `slu-wb__seg-*` classes. All consumers renamed: `guidance-workbench.jsx`, `main.js`, `pages/eval/_matrix-mode.twig`, `_eval.scss`.
- **Styled error pages.** `pages/error.twig` renders inside the app shell for signed-in users (base shell otherwise) with friendly headings and actions (`.rj-error-page` styles).
- **Dead code removed.** Orphaned `pages/slu/result.twig` and `pages/placeholder.twig` deleted (nothing rendered them).

## Out of scope

- Further SCSS consolidation: on inspection, `_eval.scss` and `_slu.scss` are predominantly genuinely tool-specific (heatmap/drilldown/progress vs. workbench); the segmented control was the real shared/duplicated component. No forced extraction of single-use styles.
- Admin detail-page inline-edit conversion (admin forms remain operational full forms; revisit if they chafe).

## Acceptance criteria

- Signed-in users see the SLU sidebar and app shell on all SLU pages; anonymous `/slu` keeps the public shell.
- Account profile/password/member management edit inline over fetch and degrade to POST+redirect without JS.
- No `slu-wb__seg-*` classes remain; Eval and the workbench both use `rj-segmented`.
- `npm run build` and `npm run qa` pass.

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Relevant commands/checks were run.
- [x] Roadmap items are checked off.
- [x] No unplanned files were added directly under `docs/`.
- [x] The next phase still makes sense.

### Closeout notes

- QA expanded: an inline-edit round-trip test (profile edit via fetch, row swap asserted) and an SLU app-shell/sidebar test. Suite: 29/29 passing.
- Conditional Twig extends (`{% extends currentUser ? "layouts/app.twig" : "layouts/base.twig" %}`) verified working in twig.js for the SLU index and error pages.
- Verification: `npm run build --workspace=rumbo-web`; `pm2 restart rumbo-web`; anonymous `/slu` and 404 verified over HTTP (base shell, no app shell); `npm run qa` 29/29.

Next phase recommendation: Proceed to Phase 18 — Admin Completeness and Act-as-Org.
