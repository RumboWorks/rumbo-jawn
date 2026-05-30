# Phase 09 — Finish-Line Discipline and Launch Hardening

## Purpose

Prevent the project from stalling at 80% done by turning finish-line work into an explicit phase.

## What this phase delivers

- Launch checklist.
- Final docs review.
- Error states.
- Empty states.
- Broken-link review.
- Privacy/AI disclosure review.
- Backup/export notes.
- Deploy rehearsal.
- Rollback notes.
- Manual QA.
- Admin sanity checks.
- Billing/usage sanity checks if in scope.

## Out of scope

- New major features.
- New architecture changes unless needed to launch safely.
- Model Eval implementation.

## Acceptance criteria

- Launch checklist is complete.
- Known blockers are either fixed or explicitly deferred with owner/reason.
- Docs reflect the actual product.
- Deployment and rollback notes exist.
- Manual QA is recorded.


## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [ ] All acceptance criteria pass.
- [ ] Relevant commands/checks were run.
- [ ] Manual QA notes are recorded.
- [ ] New commands are documented in `docs/reference/usage.md`, if commands exist.
- [ ] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [ ] Roadmap items are checked off, added, or moved.
- [ ] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [ ] Working notes created during this phase were promoted, linked, archived, or deleted.
- [ ] No unplanned files were added directly under `docs/`.
- [ ] The next phase still makes sense or has been revised.

### Valid outcomes

- Proceed to next phase.
- Stay in this phase and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.
