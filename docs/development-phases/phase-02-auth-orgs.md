# Phase 02 — Shared Auth and Organizations

## Purpose

Build shared platform authentication and organization membership foundations.

This phase is platform work shared by all tools.

## What this phase delivers

- Shared user model.
- Shared organization model.
- Membership model.
- Login/session structure.
- Google auth if practical.
- LinkedIn auth if practical.
- Email/password and/or magic-link direction if practical.
- Approved-domain auto-approval logic foundation.

## Out of scope

- Sounds Like Us feature behavior.
- Model Eval feature behavior.
- Complex billing.
- Full admin dashboard beyond what is needed to verify auth/orgs.

## Acceptance criteria

- Users can authenticate through the implemented launch path.
- Every user belongs to at least one organization.
- Tool modules use shared auth/org logic rather than local user models.
- Auth decisions are reflected in the decision log if implementation diverges.


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
