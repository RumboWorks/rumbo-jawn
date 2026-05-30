# Rumbo Decision Log

Record decisions that affect product direction, architecture, stack, workflow, or future maintainability.

## 2026-05-30 — Use Rumbo Guided Phases

Decision: Use phase-based planning with short adaptive build loops and mandatory closeout reviews.

Reason: Detailed phase docs worked better than GitHub-issue-based planning, but the previous approach drifted near the finish line when new learning made older phase docs stale.

Implications:

- Future phases are provisional.
- Each phase must end with a closeout review.
- Work cannot silently disappear; it must be completed, deferred, moved, or removed with a documented reason.

## 2026-05-30 — Use a monorepo

Decision: Use one monorepo for the Rumbo platform and tool modules.

Reason: Shared auth, orgs, billing, jobs, AI provider wrappers, storage, admin, and design system should not be duplicated across tools.

Risk: Work on one tool could create side effects for others.

Mitigation:

- Use modular tool boundaries.
- Shared packages expose narrow contracts.
- Shared packages must not depend on tool internals.
- Tools must not import each other directly.
- Tests and phase closeouts must check for cross-tool effects.

## 2026-05-30 — Start as modular monolith on EC2

Decision: Start as a modular monolith on self-contained EC2 servers.

Reason: This matches current working patterns and avoids premature distributed complexity.

Future direction: Allow later movement to distributed DevOps: separate admin, tools, workers, DB, storage, Python services, and queue if justified.

## 2026-05-30 — Express backend, ESM only

Decision: Use Express for backend and ESM-only Node code.

Reason: Express fits current stack preference and keeps implementation straightforward. ESM avoids mixing module systems.

## 2026-05-30 — Twig page shells with vanilla JS/React as needed

Decision: Use Twig for server-rendered page shells by default. Use vanilla JS for simple interactivity. Use React for highly dynamic screens.

Reason: The source of rendered HTML should be easy to find and understand. React should be available where the UI complexity justifies it.

## 2026-05-30 — SCSS design system, no Bootstrap/Tailwind

Decision: Use SCSS with a shared design system. Do not use Bootstrap or Tailwind-style framework.

Reason: CSS choices must work across simple server-rendered pages and complex React pages without heavy utility-class markup.

## 2026-05-30 — npm scripts and Vite, no Gulp by default

Decision: Use npm scripts as the build/task entry point. Use Vite where useful for SCSS/JS/React bundling. Do not use Gulp unless a strong need appears.

## 2026-05-30 — Prisma with MySQL for current servers

Decision: Use Prisma ORM and Prisma migrations. Stick with MySQL while using existing general-purpose EC2 servers. Reconsider Postgres when building infrastructure specifically for Rumbo.

Reason: Existing servers already run MySQL. Prisma preserves a path to Postgres/cloud DB later if database-specific assumptions are avoided.

## 2026-05-30 — Centralized auth/orgs/admin across tools

Decision: Use centralized authentication, organizations, memberships, subscriptions, and admin UX across tools.

Reason: Sounds Like Us and Model Eval should not require separate user accounts or separate admin systems.

## 2026-05-30 — Auth providers

Decision: Launch should include Google login and probably LinkedIn. Email/password and/or magic link should remain available if practical. Evaluate Passport.js first unless Auth.js proves better for Express/Prisma.

## 2026-05-30 — Shared jobs/storage/AI provider layer

Decision: Use shared DB-backed jobs, shared storage abstraction, and shared AI provider wrapper.

Reason: Multiple tools need crawling, extraction, analysis, AI calls, cost tracking, and caching. These should not be duplicated.

## 2026-05-30 — Python through JSON boundaries first

Decision: Node should call Python via CLI/subprocess initially, using JSON stdin/stdout/files. Python may become a separate worker/service later.

Reason: This keeps deployment simple while allowing Python for text analysis, ML, and AI work.

## 2026-05-30 — Embeddable widgets remain important

Decision: Embeddable widgets should remain a medium-priority platform capability, not a back-burner idea.

Reason: Useful public widgets can spread brand recognition and support trust/transparency use cases.
