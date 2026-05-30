# Rumbo Documentation Map

Do not read every file in `docs/` by default. This directory is organized so agents and humans can find the right source of truth without wading through stale notes.

## Required reading for coding agents

1. `AGENTS.md`
2. This file: `docs/README.md`
3. The current phase file in `docs/development-phases/`
4. Any additional files explicitly named by the phase file

## Stable project charter

Stable or slow-changing project agreements live in `docs/project-charter/`:

- `product-vision.md` — what Rumbo is and what it is not
- `architecture.md` — platform architecture and major technical direction
- `coding-standards.md` — coding conventions and repo expectations
- `data-model.md` — shared data-model principles
- `deployment.md` — current and future deployment posture
- `testing.md` — testing expectations
- `ai-guidance.md` — AI/agent guidance principles for the project

These files should not be casually rewritten during implementation. Major changes should be recorded in `docs/active-planning/decision-log.md`.

## Active planning

Actively updated planning files live in `docs/active-planning/`:

- `roadmap.md` — current phase status and next work
- `decision-log.md` — accepted, rejected, superseded, and deferred decisions
- `deferred-work.md` — postponed work that must not disappear
- `phase-retrospectives.md` — phase closeout notes
- `implementation-notes.md` — useful implementation discoveries that are not full decisions

## Development phases

Agent-ready phase docs live in `docs/development-phases/`.

Only the current phase should be treated as ready to execute. Later phase docs are provisional and should be reviewed before assignment.

## Reference

Reference material lives in `docs/reference/`:

- `usage.md` — man-page-style command usage, maintained from actual code only

## Working notes

Temporary notes, research, and agent scratch docs live in `docs/working-notes/`.

Working notes are not source of truth. If a working note affects future work, promote the relevant content into the project charter, active planning docs, reference docs, or the relevant phase file.

## Archive

Superseded plans and retired notes live in `docs/archive/`.

Archived material is not required reading unless specifically linked by a current source-of-truth document.
