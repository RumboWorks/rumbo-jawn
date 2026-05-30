# Phase 07 — Billing, Limits, and Product Controls

## Purpose

Add product controls, limits, and billing readiness.

## What this phase delivers

- Usage limits based on simple counts.
- Per-org limits.
- Spend caps.
- DB-backed tool configuration.
- Stripe-ready schema/config.
- Feature flags/product tier controls.
- Paid/free distinction foundation.

## Out of scope

- Overly complex token-based user-facing limits.
- Full billing automation unless this phase is revised to include it.
- Model Eval billing implementation.

## Acceptance criteria

- Platform can enforce basic org-level usage limits.
- Admin/config can tune limits and model choices.
- Billing schema/config does not block later Stripe integration.
- User-facing limits remain simple.


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
