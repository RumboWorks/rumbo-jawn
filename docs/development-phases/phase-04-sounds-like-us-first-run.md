# Phase 04 — Sounds Like Us First Run

## Purpose

Deliver the first registered-user Sounds Like Us flow from public URL submission to generated guidance result.

## What this phase delivers

- Registered-user URL submission flow.
- Lightweight focused crawl/fetch path with configurable page limits.
- Source text normalization.
- First voice/guidance generation AI call through shared AI wrapper.
- Job progress UI.
- First result page.
- Testing-mode privacy/AI disclosure language.

## Out of scope

- PDF upload for public MVP unless moved forward explicitly.
- User-editable guidance components.
- Billing enforcement beyond basic limits if not already ready.
- Embeddable widgets.
- Advanced source evidence/excerpt UI.

## Files likely touched

- `tools/sounds-like-us/`
- `packages/crawler/`
- `packages/ai/`
- `packages/jobs/`
- `apps/platform-web/`
- `docs/reference/usage.md`
- `docs/project-charter/testing.md`

## Tasks

- [ ] Create Sounds Like Us submission page behind auth.
- [ ] Implement URL validation and same-domain/subdomain crawl rules according to config.
- [ ] Add lightweight focused discovery for likely pages.
- [ ] Normalize fetched HTML text into source records.
- [ ] Create analysis job that uses shared jobs/storage/AI services.
- [ ] Generate internal JSON result plus simple rendered guidance output.
- [ ] Add progress page that can be revisited while job continues.
- [ ] Add result page and basic copy/download behavior if low-risk.
- [ ] Add privacy/AI disclosure text for test users.
- [ ] Add manual QA test organizations list placeholder.

## Acceptance criteria

- [ ] Authenticated user can submit a public URL.
- [ ] System processes a bounded crawl through a background job.
- [ ] Result page displays generated guidance from stored artifact data.
- [ ] Repeated runs can use configured cache behavior where implemented.
- [ ] Blocked/empty/inaccessible pages are skipped without failing the entire run.
- [ ] Costs and job metadata are visible in the underlying logs/data.

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
