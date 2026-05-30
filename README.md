# Rumbo Phase 00 Planning Pack

This pack bootstraps the Rumbo platform MVP with repo-local documentation, agent guidance, and provisional phase docs.

Use this pack to create the initial repository documentation before product feature implementation begins.

## First action

Load this file into the repo, then assign:

```text
docs/development-phases/phase-00-project-foundation.md
```

to a coding agent.

Phase 00 creates the project foundation. It should not implement product features.

## Documentation organization

The docs are intentionally split by stability:

```text
docs/project-charter/       stable or slow-changing project agreements
docs/active-planning/       actively updated planning files
docs/development-phases/    agent-ready phase execution docs
docs/reference/             verified reference docs
docs/working-notes/         temporary notes, not source of truth
docs/archive/               superseded material
```

Agents should not be told to read all docs. The required reading path is:

1. `AGENTS.md`
2. `docs/README.md`
3. the current phase file
4. any additional files explicitly named by the phase file

## Working method

Rumbo uses guided phases: detailed phase docs plus short adaptive build loops and mandatory closeout reviews.

Every phase closeout should confirm what is done, what changed, what moved, what was deferred, and whether the next phase should be revised before assignment.

## Current architecture posture

- Monorepo
- Modular monolith for MVP
- Shared platform services for auth, orgs, jobs, admin, AI calls, billing readiness, and storage abstraction
- Tool-specific modules for Sounds Like Us, Model Eval, and future tools
- Self-contained EC2 now, with seams for future distribution
- Apache proxy, PM2, Express, ESM-only Node
- Twig page shells, vanilla JS for simple interactivity, React for dynamic screens
- SCSS design system, no Bootstrap/Tailwind
- Prisma with MySQL for now
- Python for text analysis/ML/AI work through JSON/subprocess boundaries initially
