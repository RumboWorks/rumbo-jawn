# Phase 03 — Shared Jobs, AI Provider Layer, Storage, and Artifacts

## Purpose

Create shared platform infrastructure for long-running work, AI calls, cost tracking, artifact storage, and Python integration.

This phase is platform work that Sounds Like Us will use first and future tools may reuse.

## What this phase delivers

- Flexible DB-backed jobs table/pattern.
- Worker process structure.
- Shared AI provider wrapper.
- Per-call model/provider configuration pattern.
- Cost/token logging pattern.
- Storage abstraction.
- Local file storage for MVP.
- Artifact manifest pattern.
- Node-to-Python bridge placeholder using JSON boundaries.

## Out of scope

- Full Sounds Like Us analysis implementation.
- Model Eval implementation.
- S3 integration unless trivial.
- Complex queue infrastructure.

## Acceptance criteria

- Jobs can be created and processed by a worker.
- AI call wrapper can be configured by call type.
- Cost/token metadata can be recorded.
- Artifact manifest pattern exists.
- Storage code is not hard-wired in a way that blocks later S3.
- Python bridge placeholder exists if appropriate.


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
