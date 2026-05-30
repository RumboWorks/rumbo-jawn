# Phase 06 — Central Admin and Observability

## Purpose

Create centralized admin visibility into users, organizations, jobs, AI calls, costs, errors, and tool runs.

This is platform work, with Sounds Like Us as the first tool using it.

## What this phase delivers

- Admin shell under `/admin`.
- User/org visibility.
- Jobs list/detail.
- AI call/cost visibility.
- Error/failure visibility.
- Sounds Like Us run visibility.
- Basic re-run/debug aids if appropriate.

## Out of scope

- Separate admin service.
- Model Eval admin implementation.
- Full analytics dashboard.
- Complex role-management unless needed.

## Acceptance criteria

- Admin can see recent jobs and failures.
- Admin can see AI call/cost metadata.
- Admin can inspect Sounds Like Us runs without tool-specific one-off admin architecture.
- Admin code is shared-platform oriented.


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
