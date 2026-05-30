# Phase 06 — Central Admin and Observability

## Purpose

Create centralized admin visibility for users, orgs, jobs, AI usage, runs, artifacts, errors, and safe configuration.

## What this phase delivers

- `/admin` shell using shared auth/admin checks.
- Users/orgs view.
- Jobs list/detail.
- AI calls/cost view.
- Tool run/artifact metadata view.
- Error/failure visibility.
- DB-backed safe config editing for selected settings.

## Out of scope

- Full CMS-like admin.
- Dangerous arbitrary config editing.
- Separate admin deployment.
- Advanced analytics dashboards.

## Files likely touched

- `apps/platform-web/admin/`
- `packages/auth/`
- `packages/db/`
- `packages/jobs/`
- `packages/ai/`
- `packages/config/`
- `docs/reference/usage.md`
- `docs/project-charter/testing.md`

## Tasks

- [ ] Add admin authorization convention.
- [ ] Build admin layout and navigation.
- [ ] Add users/orgs summary pages.
- [ ] Add jobs list/detail with status, progress, and artifacts.
- [ ] Add AI call/cost listing with filters.
- [ ] Add tool runs/artifact metadata views.
- [ ] Add basic error/failure visibility.
- [ ] Add DB-backed config editor for safe numeric/string/boolean settings only.
- [ ] Document admin routes and guardrails.

## Acceptance criteria

- [ ] Admin user can inspect recent jobs and AI calls.
- [ ] Failed jobs are visible enough to debug.
- [ ] Safe config values can be changed without deploy where implemented.
- [ ] Admin remains centralized and not tool-specific islands.

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
