# AGENTS.md

This repository uses written guidance to keep human work, coding-agent work, and project planning aligned.

Agents should follow this file first, then use the documentation map and the assigned phase file to determine what else to read.

## Reading order

For most coding tasks, use this reading order:

1. `AGENTS.md`
2. `docs/README.md`
3. The assigned phase file in `docs/development-phases/`
4. Any `.agent/*.agent.md` file referenced by the phase file or task prompt
5. Any additional project-charter, tool, active-planning, reference, or working-note files explicitly referenced by those files

Agents should not read every file in `docs/` by default. The current phase file and `docs/README.md` define the relevant reading path.

## Platform vs tool scope

Rumbo is the shared platform/product family.

Sounds Like Us is the first MVP tool built on the Rumbo platform.

Model Eval is a planned sibling tool. It is out of scope for initial MVP implementation unless a phase file explicitly says otherwise.

When implementing shared services, do not name or model them as Sounds Like Us-only services.

When implementing Sounds Like Us features, do not add Model Eval features. Consider Model Eval only as an architectural constraint for shared platform decisions.

Tools may have their own routes, views, assets, services, jobs, and tables. Shared concerns such as auth, users, orgs, memberships, jobs, AI calls, storage, billing readiness, admin visibility, usage limits, and core design-system conventions belong to the platform.

Tool modules must not depend on each other's internals.

## Source-of-truth structure

The repository separates stable agreements, tool-specific notes, active planning, execution phases, reference material, temporary notes, archives, and specialist agent instructions.

Use these locations:

- Stable project agreements: `docs/project-charter/`
- Tool-specific product notes and boundaries: `docs/tools/`
- Active planning docs: `docs/active-planning/`
- Phase execution docs: `docs/development-phases/`
- Reference docs: `docs/reference/`
- Temporary or exploratory notes: `docs/working-notes/`
- Superseded material: `docs/archive/`
- Specialist agent instructions: `.agent/`

## Documentation hygiene

Do not create new top-level files directly under `docs/` unless the assigned phase file explicitly asks for them.

Use `docs/working-notes/` for exploratory notes, investigation results, temporary analysis, or agent-created notes that are not yet source-of-truth.

Working notes are not source of truth. If a working note affects future work, promote the relevant information into the appropriate source-of-truth file:

- `docs/project-charter/` for stable project agreements
- `docs/tools/` for tool-specific scope, behavior, user flows, or product notes
- `docs/active-planning/decision-log.md` for decisions
- `docs/active-planning/roadmap.md` for roadmap changes
- `docs/active-planning/deferred-work.md` for postponed work
- `docs/active-planning/implementation-notes.md` for implementation discoveries
- `docs/development-phases/` for phase-specific execution changes
- `docs/reference/` for verified reference material

Use `docs/archive/` for superseded plans, retired phase files, abandoned approaches, or historical material that should not be required reading.

At phase closeout, review any working notes created during the phase and decide whether each should be promoted, linked, archived, or deleted.

## Specialist agent guidance

The `.agent/` directory contains provider-neutral specialist instruction files.

These files are not source-of-truth project documentation. They are task-specific playbooks that tell coding agents how to maintain, review, or update parts of the project.

Examples:

- `.agent/phase-review.agent.md` — use when closing or reviewing a development phase.
- `.agent/roadmap.agent.md` — use when updating `docs/active-planning/roadmap.md`.
- `.agent/decision-log.agent.md` — use when adding or reconciling decisions in `docs/active-planning/decision-log.md`.
- `.agent/usage.agent.md` — use when creating or updating `docs/reference/usage.md`.
- `.agent/architecture.agent.md` — use when reviewing architectural consistency or changing architecture docs.
- `.agent/frontend.agent.md` — use when working on frontend structure, templates, CSS, or interactive UI.
- `.agent/database.agent.md` — use when changing schema, migrations, persistence, or data access.
- `.agent/testing.agent.md` — use when adding, revising, or reviewing tests.

Important distinction:

```text
docs/active-planning/decision-log.md
  = actual project decision log

.agent/decision-log.agent.md
  = instructions for maintaining the decision log
```

Do not assume every `.agent/` file should be loaded for every task. Use a specialist file only when:

1. the current phase file references it,
2. the user explicitly names it,
3. the task clearly matches its purpose, or
4. a phase closeout requires it.

If a new recurring workflow emerges, create a new `.agent/*.agent.md` file instead of scattering reusable instructions across random docs or working notes.

## Provider-specific guidance bridges

This repository may be used with multiple coding-agent providers.

Provider-specific instruction files such as `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and `CLAUDE.md` should act as adapters that point back to this file, `docs/README.md`, and `.agent/` specialist files.

Do not duplicate the full project doctrine separately for each provider.

## Development process

This project uses guided iterative phases.

The process is:

1. Keep stable product vision and architecture docs.
2. Work in short, agent-ready phases.
3. Treat future phases as provisional.
4. Review and revise the plan after each phase.
5. Never let deferred work disappear.
6. Keep docs as the source of truth.
7. Prefer working, verifiable slices over vague progress.
8. Do not start the next phase until the current phase is closed, split, or explicitly revised.

Avoid adding fake-agile ceremony unless a phase file specifically requires it. Do not add sprint rituals, story points, velocity tracking, or standup structures by default.

## Phase work rules

When assigned a phase:

1. Read the assigned phase file.
2. Follow its scope and out-of-scope section.
3. Do not expand scope without recording the change.
4. Keep implementation choices consistent with `docs/project-charter/`.
5. Keep platform/tool boundaries consistent with `docs/tools/`.
6. Update active-planning docs when decisions, deferrals, or roadmap status change.
7. Update reference docs only when behavior actually exists.
8. Record temporary discoveries in `docs/working-notes/` only when needed.

Each phase must end with closeout work. Closeout should confirm:

- what was completed,
- what changed from the original plan,
- what was deferred,
- what should move to a later phase,
- what docs were updated,
- whether the next phase still makes sense,
- whether the current phase is truly done.

## Decision log rules

Use `docs/active-planning/decision-log.md` for decisions that affect architecture, scope, stack, data model, security, deployment, product direction, cost model, or long-term maintainability.

Decision-log entries should include:

- date,
- status,
- decision,
- rationale,
- consequences,
- superseded decisions, if any.

Do not use the decision log for casual notes.

Use `.agent/decision-log.agent.md` when adding, reconciling, or reviewing decision-log entries.

## Roadmap rules

Use `docs/active-planning/roadmap.md` as the current status and next-work summary.

Do not mark work complete unless it can be verified in the repository.

If work is postponed, add it to `docs/active-planning/deferred-work.md` or move it to a named later phase. Do not let unfinished work disappear.

Use `.agent/roadmap.agent.md` when updating or reconciling roadmap status.

## Usage/reference rules

Use `docs/reference/usage.md` for verified commands, scripts, inputs, outputs, and operational usage.

Do not document commands that do not exist yet.

When updating usage docs, verify `package.json`, source files, scripts, and relevant docs before making claims.

Use `.agent/usage.agent.md` when creating or updating usage documentation.

## Coding expectations

Prefer small, reviewable changes.

Respect the existing architecture and project-charter decisions. If a major change seems necessary, document the proposed change and rationale before implementing it.

Do not introduce new frameworks, providers, services, build tools, or architectural patterns unless the assigned phase explicitly calls for it or the user approves the change.

Keep shared code generic and tool modules isolated. Tool-specific code should not casually depend on another tool’s internals.

## Completion expectations

When finishing a task, summarize:

- files changed,
- commands run,
- tests/checks performed,
- docs updated,
- unresolved issues,
- deferred work added or moved,
- any guidance files used.

If something could not be completed, say so clearly and record where the remaining work lives.
