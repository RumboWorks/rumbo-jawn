# Phase 07 — Billing, Limits, and Product Controls

## Purpose

Add practical usage limits, paid/free boundaries, spend controls, and billing readiness for MVP launch.

## What this phase delivers

- Subscription/schema readiness.
- Simple org/account usage limits.
- Daily spend caps.
- Free vs paid feature boundary enforcement.
- Stripe integration if still MVP-critical and timing supports it.
- Admin overrides.

## Out of scope

- Complex pricing experiments.
- Enterprise contracts.
- Detailed token-based customer-facing billing.
- Full invoicing beyond Stripe basics.

## Files likely touched

- `packages/db/`
- `packages/auth/`
- `packages/ai/`
- `packages/config/`
- `apps/platform-web/`
- `docs/project-charter/data-model.md`
- `docs/active-planning/decision-log.md`

## Tasks

- [ ] Finalize simple usage unit for initial tools, likely analysis/run counts rather than tokens.
- [ ] Add org usage counters or usage events.
- [ ] Enforce configurable usage limits before expensive jobs/API calls.
- [ ] Add spend cap enforcement in shared AI layer.
- [ ] Add free/paid feature boundary checks.
- [ ] Prepare Stripe data model and integrate Stripe only if phase review keeps it in scope.
- [ ] Add admin override controls.
- [ ] Document customer-facing limits and internal cost controls.

## Acceptance criteria

- [ ] Anonymous users cannot trigger paid AI spend.
- [ ] Registered users are limited by clear simple run counts or configured allowances.
- [ ] AI spend caps can stop new expensive calls.
- [ ] Paid-only features are blocked for free orgs.
- [ ] Any deferred Stripe work is explicit and assigned.

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
