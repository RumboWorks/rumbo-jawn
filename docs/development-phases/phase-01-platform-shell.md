# Phase 01 — Platform Shell

## Purpose

Create the first runnable Rumbo platform web shell after Phase 00 has established the repo and conventions.

## What this phase delivers

- Working Express platform app using ESM.
- Twig layout system for app pages.
- Shared SCSS design-system foundation compiled through the approved build step.
- Basic route/module conventions for shared platform areas and tool areas.
- Placeholder app routes for Sounds Like Us and Model Eval.
- Basic health/status page.
- Clear source traceability for rendered HTML.

## Out of scope

- Real auth implementation.
- Real tool workflows.
- Real crawling or AI calls.
- Billing.
- Admin feature screens beyond placeholder navigation.
- React unless needed for a small mount-pattern proof.

## Files likely touched

- `apps/platform-web/`
- `packages/design-system/`
- `packages/config/`
- `tools/sounds-like-us/`
- `tools/model-eval/`
- `docs/project-charter/architecture.md`
- `docs/reference/usage.md`

## Tasks

- [ ] Create Express app entrypoint if Phase 00 only stubbed it.
- [ ] Wire Twig view rendering and shared layouts.
- [ ] Add base app navigation for account/admin/tool placeholders without implying completed features.
- [ ] Create shared SCSS entrypoint and compile target.
- [ ] Add route registration convention for tool modules.
- [ ] Add placeholder routes/pages for Sounds Like Us and Model Eval.
- [ ] Add health/status page and document how to run it.
- [ ] Update usage and architecture docs with verified commands and file locations.

## Acceptance criteria

- [ ] `npm install` still works.
- [ ] `npm run dev` starts the platform shell.
- [ ] A browser can load the home/app shell, health page, Sounds Like Us placeholder, and Model Eval placeholder.
- [ ] Rendered app pages have obvious Twig source files.
- [ ] SCSS build produces expected CSS artifact.
- [ ] No feature-specific auth, billing, crawling, or AI code is falsely represented as complete.

## Manual QA checklist

- [ ] Run this phase's documented commands.
- [ ] Visit any pages/routes created or changed in this phase.
- [ ] Confirm visible placeholder text does not imply unfinished features are complete.
- [ ] Confirm failures and blocked work are documented before moving on.

## Phase Closeout

### Completion checklist

- [ ] All acceptance criteria pass.
- [ ] New or changed commands are documented in `docs/reference/usage.md`.
- [ ] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [ ] Roadmap items are checked off, revised, or moved.
- [ ] Deferred work is captured in `docs/active-planning/deferred-work.md` with a target phase or explicit reason.
- [ ] Implementation discoveries are captured in `docs/active-planning/implementation-notes.md` when useful.
- [ ] No known blocker is hidden only in comments, TODOs, chat history, or agent notes.
- [ ] Manual QA notes are recorded.

### Retrospective questions

1. What was completed exactly?
2. What changed from the original phase plan?
3. What did we discover that affects later phases?
4. What is blocked?
5. What moved to a later phase?
6. What should be removed because it is no longer needed?
7. Are we allowed to start the next phase?

### Valid outcomes

- Proceed to the next phase.
- Stay in this phase and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because the product understanding changed.

## Documentation hygiene checklist

- [ ] No unplanned files were added directly under `docs/`.
- [ ] Any working notes are in `docs/working-notes/`.
- [ ] Useful working-note content was promoted to source-of-truth docs.
- [ ] Superseded notes/plans were moved to `docs/archive/`.
- [ ] `docs/README.md` still points agents to the correct required reading.
