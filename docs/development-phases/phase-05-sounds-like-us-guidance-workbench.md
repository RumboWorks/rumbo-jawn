# Phase 05 — Sounds Like Us Guidance Workbench

## Purpose

Turn the first Sounds Like Us result into an adjustable guidance workbench without overbuilding user-editable paid features.

## What this phase delivers

- Configurable guidance output sections.
- Internal JSON output format refined enough for multiple output types.
- Output translator stub for future target formats.
- Guidance modifiers for critique/rewrite modes.
- Reasonable copy/download output options.
- Dynamic UI using vanilla JS or React only where justified.

## Out of scope

- Full paid prompt-piece editing UX unless explicitly moved into this phase.
- Complex multi-profile management.
- Source evidence/excerpt annotation unless moved forward.
- Embedding widgets unless Phase 08 is moved forward.

## Files likely touched

- `tools/sounds-like-us/views/`
- `tools/sounds-like-us/assets/`
- `tools/sounds-like-us/services/`
- `packages/design-system/`
- `packages/ai/`
- `docs/project-charter/architecture.md`
- `docs/active-planning/implementation-notes.md`

## Tasks

- [ ] Define internal guidance JSON shape.
- [ ] Render guidance from internal JSON instead of one-off AI text where practical.
- [ ] Add output section toggles.
- [ ] Add critique/rewrite guidance mode options.
- [ ] Add plain language/AI-stereotype-avoidance style modifiers if low-risk.
- [ ] Add copy and download outputs in practical formats.
- [ ] Add translator stub that returns unknown input unaltered and logs/records unsupported conversions.
- [ ] Choose vanilla JS vs React for workbench based on actual dynamic complexity and document the choice.

## Acceptance criteria

- [ ] User can adjust options and see guidance output update without a new crawl/analysis call where possible.
- [ ] Internal JSON remains the source for rendered outputs.
- [ ] Unsupported translator requests fail gracefully or return input unchanged as designed.
- [ ] The UI remains understandable and does not create hidden state that cannot be reproduced.

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
