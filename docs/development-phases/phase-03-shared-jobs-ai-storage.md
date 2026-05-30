# Phase 03 — Shared Jobs, Storage, and AI Foundation

## Purpose

Create reusable platform services for long-running work, artifact storage, AI calls, cost logging, and Python integration.

## What this phase delivers

- Flexible DB-backed jobs table and worker loop.
- Job status/progress pattern usable by different tools.
- Local filesystem storage adapter with future S3 seam.
- Shared artifact manifest pattern.
- Shared AI provider wrapper with call-type config.
- AI call cost/token logging.
- Cache key/TTL pattern.
- Python bridge placeholder using JSON stdin/stdout/files.

## Out of scope

- Production-grade queue service.
- S3 implementation unless trivial behind the adapter.
- Real Sounds Like Us analysis.
- Real Model Eval workflows.
- Separate Python service.

## Files likely touched

- `packages/jobs/`
- `packages/storage/`
- `packages/ai/`
- `packages/python-bridge/`
- `packages/db/`
- `apps/worker/`
- `python/analysis/`
- `docs/project-charter/architecture.md`
- `docs/project-charter/data-model.md`

## Tasks

- [ ] Add job schema flexible enough for very different tool payloads.
- [ ] Implement worker process loop with safe polling/claiming conventions.
- [ ] Add progress/status update helpers.
- [ ] Add local storage adapter and artifact manifest writer/reader.
- [ ] Add AI provider wrapper for configured provider/model per call type.
- [ ] Log AI calls with provider, model, estimated/actual cost fields where available, token metadata, cache key, and org/job references.
- [ ] Add cache metadata helpers without overfitting to a specific tool.
- [ ] Add Python bridge placeholder script and Node wrapper.
- [ ] Document run commands and data paths.

## Acceptance criteria

- [ ] A test/demo job can be created, processed by worker, update progress, and write a JSON artifact.
- [ ] AI wrapper can run in dry/mock mode without calling an external API.
- [ ] Storage adapter can write/read a manifest locally.
- [ ] Python bridge demo can exchange JSON successfully.
- [ ] Docs clearly identify what is real vs placeholder/mock.

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
