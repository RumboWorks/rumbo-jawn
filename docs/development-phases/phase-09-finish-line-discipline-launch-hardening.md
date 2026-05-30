# Phase 09 — Finish-Line Discipline / Launch Hardening

## Purpose

Convert the nearly-finished MVP into a launchable, supportable product without letting final work become vague polish.

## What this phase delivers

- Privacy/AI disclosure review.
- Empty/error/loading state review.
- Broken link and redirect review.
- Admin visibility review.
- Billing/usage sanity review.
- Backup/export/restore notes.
- Deploy rehearsal.
- Rollback notes.
- Final manual QA checklist.
- Deferred-work triage.

## Out of scope

- Major new features.
- Unplanned rewrites.
- Nice-to-have UI redesigns.
- Noncritical architecture migrations.

## Files likely touched

- `docs/project-charter/testing.md`
- `docs/project-charter/deployment.md`
- `docs/active-planning/deferred-work.md`
- `docs/active-planning/phase-retrospectives.md`
- `docs/active-planning/roadmap.md`
- `apps/platform-web/`
- `tools/`

## Tasks

- [ ] Run final privacy and AI disclosure review.
- [ ] Review all public/account/tool/admin routes for empty, loading, and error states.
- [ ] Check links, redirects, and public WordPress-to-app handoffs.
- [ ] Confirm admin can see enough to support users and debug failures.
- [ ] Confirm usage limits and spend caps behave correctly.
- [ ] Write backup/export/restore notes for DB and local artifacts.
- [ ] Run deploy rehearsal on target EC2 pattern.
- [ ] Write rollback notes.
- [ ] Run final manual QA checklist.
- [ ] Review every deferred item and classify as launch blocker, post-launch, or removed with reason.

## Acceptance criteria

- [ ] MVP can be deployed and manually verified from a clean checklist.
- [ ] Known non-launch items are explicitly deferred.
- [ ] No hidden TODOs are required for launch.
- [ ] Rollback/deploy notes are usable by the user on the target server.

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
