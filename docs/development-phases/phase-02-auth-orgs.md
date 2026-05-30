# Phase 02 — Auth and Organizations

## Purpose

Implement centralized identity and organization foundations shared across all Rumbo tools.

## What this phase delivers

- Shared user, organization, and membership data model.
- Session/auth foundation.
- Google auth for MVP launch direction.
- LinkedIn auth if practical without destabilizing the phase.
- Email/password and/or magic-link path if practical.
- Approved-domain auto-approval concept in shared auth/org logic.
- Minimal account and organization screens.

## Out of scope

- Tool-specific user models.
- Billing collection.
- Advanced team permissions.
- Enterprise SSO.
- Complex onboarding flows.

## Files likely touched

- `packages/auth/`
- `packages/db/`
- `apps/platform-web/routes/`
- `apps/platform-web/views/`
- `docs/project-charter/data-model.md`
- `docs/active-planning/decision-log.md`

## Tasks

- [ ] Finalize Prisma schema for users, orgs, memberships, auth accounts/sessions, and approved domains.
- [ ] Implement auth provider approach selected for Express/Prisma.
- [ ] Add Google OAuth.
- [ ] Attempt LinkedIn OAuth only if the chosen auth library path is clear and low-risk.
- [ ] Add account belongs to at least one org invariant.
- [ ] Add minimal profile/account page.
- [ ] Add minimal org switch/current org behavior if needed.
- [ ] Add approved-domain auto-approval data model and placeholder flow.
- [ ] Update data model, architecture, and usage docs.

## Acceptance criteria

- [ ] A user can authenticate through the implemented MVP provider path.
- [ ] Authenticated user is associated with at least one org.
- [ ] Tool routes can require a user/org context through shared auth middleware.
- [ ] No tool implements separate account logic.
- [ ] Auth decisions and any deferred provider work are documented.

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
