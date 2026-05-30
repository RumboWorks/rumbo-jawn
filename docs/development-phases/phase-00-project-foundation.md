# Phase 00 — Project Foundation

## Purpose

Create the repository foundation, documentation structure, agent guidance, and initial scaffolding needed before feature implementation begins.

This phase is about the Rumbo platform repository, not Sounds Like Us feature behavior.

## What this phase delivers

- Monorepo skeleton.
- npm workspace setup.
- ESM-only Node baseline.
- Placeholder Express app or equivalent app shell.
- Placeholder worker structure if practical.
- PM2 ecosystem file.
- Apache proxy notes.
- SCSS/Vite placeholder.
- Prisma/MySQL placeholder.
- Documentation hierarchy.
- Agent guidance files.
- Provider guidance bridges.
- Phase docs and active-planning docs.

## Out of scope

- Sounds Like Us feature implementation.
- Model Eval implementation.
- Final visual design.
- Billing integration.
- Production auth implementation.
- Real AI provider calls.
- Real crawler implementation.

## Likely files/directories touched

- `package.json`
- `apps/`
- `tools/`
- `packages/`
- `python/`
- `docs/`
- `.agent/`
- `.github/`
- `CLAUDE.md`
- `AGENTS.md`

## Tasks

1. Create or verify the monorepo directory structure.
2. Create initial package metadata and npm scripts.
3. Create placeholder Express app using ESM.
4. Create placeholder worker entry if useful.
5. Add PM2 ecosystem placeholder.
6. Add Vite/SCSS placeholder if practical.
7. Add Prisma placeholder targeting MySQL.
8. Ensure documentation hierarchy exists.
9. Ensure provider guidance bridge files exist.
10. Ensure no feature work is implemented.

## Acceptance criteria

- Repository structure exists.
- `npm install` works if dependencies are introduced.
- Basic dev/check/build commands exist if appropriate.
- Placeholder app runs if an app is created.
- Documentation hierarchy matches `docs/README.md`.
- `AGENTS.md` explains reading order, doc hygiene, `.agent/`, and platform/tool boundaries.
- `docs/tools/` distinguishes Rumbo platform, Sounds Like Us, and Model Eval.
- No Sounds Like Us feature behavior is implemented.


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
