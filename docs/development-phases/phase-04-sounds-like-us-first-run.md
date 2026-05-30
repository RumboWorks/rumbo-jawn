# Phase 04 — Sounds Like Us First Run

## Purpose

Build the first end-to-end Sounds Like Us run using the shared Rumbo platform services.

This is the first tool-specific implementation phase.

## What this phase delivers

- Sounds Like Us URL input flow.
- Registration/sign-in before API-cost work begins.
- Lightweight crawl/autodiscovery routine.
- Initial AI analysis job.
- Progress/status page.
- First generated guidance output.
- Stored metadata and artifacts using shared platform patterns.

## Out of scope

- Model Eval features.
- Paid PDF uploads unless explicitly added.
- Full guidance workbench.
- Final visual design.
- Embeddable widgets.

## Acceptance criteria

- A registered user can submit a public URL.
- The system creates a shared platform job.
- The job crawls/analyzes within configured limits.
- The user can view a result.
- Metadata and artifacts are stored in the expected shared patterns.
- Tool-specific code does not duplicate platform auth/jobs/AI/storage logic.


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
