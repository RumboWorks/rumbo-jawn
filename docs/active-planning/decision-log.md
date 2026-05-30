# Decision Log

This is the actual project decision log.

Use `.agent/decision-log.agent.md` when maintaining this file.

## 2026-05-30 — Use guided iterative phases

Status: Accepted

Decision:
Use phase-based planning with short adaptive build loops and mandatory closeout reviews.

Rationale:
Detailed phase docs work well for coding-agent execution, but plans drift as implementation reveals new information. The process needs controlled revision points.

Consequences:
- Future phase files are provisional.
- Each phase requires closeout.
- Deferred work must be recorded.
- Roadmap and phase docs must be updated when plans change.

## 2026-05-30 — Build Rumbo as modular monolith for MVP

Status: Accepted

Decision:
Build Rumbo as a modular monolith for MVP, with explicit seams for later distribution.

Rationale:
The project needs shared auth, orgs, jobs, AI provider handling, storage, billing readiness, admin, and design-system conventions without overbuilding distributed infrastructure too early.

Consequences:
- One self-contained EC2 deployment can serve MVP work.
- Shared services should be generic.
- Tools must remain modular and isolated.
- Architecture should not prevent later splitting tools, workers, admin, storage, database, or Python services onto separate hosts.

## 2026-05-30 — Separate platform from tool modules

Status: Accepted

Decision:
Rumbo is the shared platform/product family. Sounds Like Us is the first MVP tool built on the platform. Model Eval is a planned sibling tool and is out of scope for initial MVP implementation, but it should inform shared platform architecture.

Rationale:
The project needs shared platform capabilities without treating the first tool as the entire product.

Consequences:
- Platform docs describe shared services.
- Tool docs describe tool-specific behavior.
- Sounds Like Us may drive first implementation, but shared services must not be named or modeled as if they belong only to Sounds Like Us.
- Model Eval must not be implemented during the first MVP unless a phase explicitly adds it.

## 2026-05-30 — Use project-charter and active-planning doc split

Status: Accepted

Decision:
Keep stable project agreements in `docs/project-charter/` and active planning files in `docs/active-planning/`.

Rationale:
Agents need a clean reading path. Stable docs, active logs, working notes, and archives should not be mixed together.

Consequences:
- `docs/README.md` is the documentation map.
- Agents should not read all docs by default.
- Working notes are not source of truth.
- Random top-level docs are not allowed.

## 2026-05-30 — Use provider-neutral agent guidance with provider adapters

Status: Accepted

Decision:
Use `AGENTS.md`, `docs/`, and `.agent/` as the master guidance system. Use provider-specific files such as `.github/copilot-instructions.md` and `CLAUDE.md` as adapters, not replacements.

Rationale:
The project may use Codex, GitHub Copilot, Claude Code, or other coding agents. Guidance should survive provider switching.

Consequences:
- `.agent/` files are specialist playbooks.
- Provider-specific files should point back to canonical repo guidance.
- Do not duplicate full doctrine in each provider system.

## 2026-05-30 — Phase 01 visual direction

Status: Accepted

Decision:
Phase 01 should establish functional scaffolding plus a minimal neutral design foundation. It should not finalize a full visual brand system.

Rationale:
The project needs SCSS/Twig/design-system rails early, but final visual direction should not be invented before real screens and product needs are clearer.

Consequences:
- Phase 01 may create tokens, layout primitives, basic typography, form/button/card/alert/table styles.
- Phase 01 should avoid polished marketing design, final palette, animations, illustrations, or complex component-library work.
- Final visual design direction is deferred.

## 2026-05-30 — Use Passport.js for auth middleware

Status: Accepted

Decision:
Use Passport.js for auth middleware. Do not use Auth.js (NextAuth.js v5).

Rationale:
Passport.js is Express-native, battle-tested, and has stable strategies for Google, LinkedIn, and local/magic-link auth. Auth.js v5 added Express support but was designed for Next.js and SvelteKit framework adapters; its Express+Prisma path has a history of breaking changes between major versions and is less proven.

Consequences:
- Use Passport.js strategies for each OAuth provider.
- Pair with `express-session` and a DB-backed session store so sessions survive process restarts.
- If LinkedIn OAuth proves unstable in Phase 02, defer it and record the deferral explicitly.
- Supersedes the earlier "evaluate Passport.js first unless Auth.js proves better" hedge.

## 2026-05-30 — Use `twig` npm package for Express/Twig integration

Status: Accepted

Decision:
Use the `twig` npm package as the Twig template engine for Express.

Rationale:
It is the only actively maintained pure-JS Twig implementation for Node. It integrates with Express via `app.set('view engine', 'twig')` with no adapter layer needed. Other options are either abandoned or require a PHP runtime.

Consequences:
- The `twig` npm package implements Twig 1.x syntax. PHP-only Twig 2.x/3.x extensions are not available; avoid relying on them.
- Wire via `app.set` in the platform-web entry point.

## 2026-05-30 — AI providers for MVP: OpenAI, Anthropic, DeepSeek

Status: Accepted

Decision:
Support OpenAI, Anthropic (Claude), and DeepSeek as AI providers for MVP. The shared AI provider wrapper in `packages/ai/` must abstract provider differences.

Rationale:
Different providers have meaningful cost and capability tradeoffs. Different call types (crawl summarization, guidance generation, evaluation) may favor different providers and models. Supporting three providers at MVP avoids lock-in and allows cost optimization without rebuilding the wrapper.

Consequences:
- `packages/ai/` normalizes request and response shape across providers.
- `ai_calls` table logs which provider and model was used per call.
- Provider API keys live in `.env`. Model and provider selection per call type lives in DB-backed config.
- DeepSeek shares the OpenAI API schema; its adapter may reuse the OpenAI client with a different base URL.
