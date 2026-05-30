# Phase 08 — Embeddable Widgets

## Purpose

Implement the first strong embeddable widget use case as a brand-spreading platform capability.

## What this phase delivers

- Chosen first widget use case.
- Public-safe widget data model.
- Widget rendering approach.
- Embed code generation.
- Style isolation strategy.
- Usage documentation.

## Out of scope

- A generalized widget marketplace.
- Multiple widget types unless the first use case proves the architecture.
- Complex analytics unless needed for basic validation.

## Files likely touched

- `packages/widgets/`
- `packages/design-system/`
- `apps/platform-web/routes/`
- `tools/*/`
- `docs/project-charter/architecture.md`
- `docs/reference/usage.md`

## Tasks

- [ ] Select one widget use case based on actual MVP output, such as AI Facts label, public report card, or guidance badge.
- [ ] Define public-safe data payload and visibility controls.
- [ ] Implement widget render endpoint or static JS embed pattern.
- [ ] Add style isolation strategy using scoped CSS, shadow DOM, iframe, or another documented approach.
- [ ] Generate embed code for a result/profile/report.
- [ ] Add minimal analytics or access logging if useful.
- [ ] Document how to embed and how to disable/revoke a widget.

## Acceptance criteria

- [ ] A non-authenticated page can display the widget using generated embed code.
- [ ] Widget exposes only public-safe data.
- [ ] Widget styles do not break the host page in normal conditions.
- [ ] The implementation can support additional widget types later without redesign.

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
