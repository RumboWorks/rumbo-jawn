# Rumbo

Rumbo is a modular platform for building AI-assisted tools for nonprofit and mission-driven communications, evaluation, guidance, and analysis workflows.

This repository is organized to support human planning, coding-agent implementation, and long-term maintainability. The project uses repo-local guidance files so decisions, phases, deferred work, and implementation notes stay close to the code.

## Current status

This repository is in early project foundation work.

Start with the current phase file in:

```text
docs/development-phases/
```

Do not assume later phase files are final. Future phases are provisional and should be reviewed before assignment.

## For coding agents

Before making changes, read:

1. `AGENTS.md`
2. `docs/README.md`
3. The assigned phase file in `docs/development-phases/`

Do not read every file in `docs/` by default. The documentation map and phase file define the relevant reading path.

Specialist task guidance lives in `.agent/`.

## Documentation layout

```text
docs/
  project-charter/      Stable or mostly stable project agreements
  active-planning/      Roadmap, decision log, deferred work, retrospectives
  development-phases/   Phase-by-phase implementation guidance
  reference/            Verified usage and reference material
  working-notes/        Temporary or exploratory notes
  archive/              Superseded material
```

## Agent guidance layout

```text
.agent/
  *.agent.md            Specialist playbooks for recurring agent tasks
```

These files are instructions for agents. They are not source-of-truth project documentation.

For example:

```text
docs/active-planning/decision-log.md
  = actual project decision log

.agent/decision-log.agent.md
  = instructions for maintaining the decision log
```

## Development approach

The project uses guided iterative phases:

- keep stable product vision and architecture docs,
- work in short, agent-ready phases,
- treat future phases as provisional,
- review and revise the plan after each phase,
- never let deferred work disappear,
- keep docs as the source of truth,
- prefer working, verifiable slices over vague progress.

## Repository setup

Project setup, scripts, package structure, and local development commands will be documented in `docs/reference/usage.md` once they exist.

Until then, follow the assigned phase file.
