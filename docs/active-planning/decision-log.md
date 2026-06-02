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

## 2026-05-30 — Development environment /ndg

Status: Accepted

Decision: The app is being developed in /var/www/rumbo on an EC2 server. You must ask the user if you want changes to the Apache proxy.  Mysql is installed, you can ask the user to create a db or do it yourself.

## 2026-05-31 — Use prisma db push instead of prisma migrate dev for Phase 02

Status: Accepted

Decision:
Use `prisma db push` to apply schema changes for Phase 02. Do not use `prisma migrate dev` until the DB user has CREATE DATABASE permission (needed for the shadow database).

Rationale:
`prisma migrate dev` requires permission to create a temporary shadow database. The `rumbo_dev` MySQL user has only access to `rumbo_dev` and cannot create new databases. `prisma db push` synchronizes the schema directly without a shadow database.

Consequences:
- No migration history files exist for Phase 02 tables.
- Before Phase 03, either grant the `rumbo_dev` user CREATE DATABASE permission, or configure `SHADOW_DATABASE_URL` in `.env` pointing to a separate database.
- If migration history is needed retroactively, it can be created with `prisma migrate diff` + `prisma migrate resolve`.

## 2026-05-31 — LinkedIn OAuth deferred from Phase 02

Status: Deferred

Decision:
LinkedIn OAuth is wired (strategy + routes exist) but is not testable in Phase 02 because credentials have not been configured. Defer verification to when credentials are available.

Rationale:
The decision log already flagged that LinkedIn OAuth should be deferred and recorded if unstable. Since it cannot be tested without credentials, it is treated as a deferred item rather than a confirmed working feature.

Consequences:
- LinkedIn OAuth routes (`/auth/linkedin`, `/auth/linkedin/callback`) exist but are gated on `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` being set.
- Test and confirm LinkedIn OAuth when credentials are available.

## 2026-06-01 — Use relationship-based organization and partner access model

Status: Accepted

Decision:
Adopt the Model Eval prototype's identity/access model as Rumbo's shared platform foundation before building central admin. Users are global identities; access is determined by platform admin status, organization memberships, partner account memberships, and partner access to managed organizations. Solo users receive an internal solo organization and manager membership.

Rationale:
Rumbo will later host Model Eval as a sibling tool inside the same platform. Building Phase 06 central admin on a simple user/admin flag and basic org membership model would create immediate rework. The relationship-based model supports Sounds Like Us now while preserving the tenant and partner-management concepts Model Eval needs later.

Consequences:
- `User.isPlatformAdmin` gates platform admin access.
- Organization membership roles use manager/member semantics.
- Partner accounts can manage organizations through explicit access records.
- Org-scoped queries should include explicit organization context and server-side permission checks.
- Phase 06b admin and observability should be built on this access foundation.
- If LinkedIn's OAuth proves unreliable, remove the strategy and record the removal.

## 2026-06-01 — Use org-centered product tiers and soft SLU usage budgets

Status: Accepted

Decision:
Use organization-centered product tiers and entitlements for billing readiness. Initial tiers are Free, Solo, Team, and Partner. Billing responsibility can attach to an eligible owner/manager of an organization. Sounds Like Us starts with a soft budget of 10 runs per 7 days; going over budget shows an "Over budget" indicator but does not block runs in Phase 07. Organization AI spend caps are enforced server-side before AI provider calls.

Rationale:
Rumbo users operate through organizations, including internal solo organizations. Keeping billing and product controls on organizations avoids user-type drift and supports future partner and Model Eval workflows. A soft SLU budget lets the MVP gather behavior and cost data before hard enforcement. Spend caps still need hard server-side enforcement because AI calls have direct cost exposure.

Consequences:
- Product tiers, entitlements, usage events, feature flags, AI model config, and audit logs are shared platform data.
- Sounds Like Us checks shared budget status but does not own billing logic.
- Admin UI can inspect Phase 07 data, while edit workflows move to Phase 07b.
- Partner managers do not bypass client organization limits.
- Model Eval can later add tool-namespaced limits without changing the billing architecture.

## 2026-06-02 — Add user account management with hidden personal workspaces

Status: Accepted

Decision:
Phase 08b will add self-account management, organization member management, platform-admin user detail/editing, SMTP-backed invites, password recovery, and account suspension/deactivation. Personal solo organizations remain part of the platform data model but should be hidden or minimized in the user-facing account UI until an account is intentionally promoted into organization management.

Platform-admin grants and revocations remain CLI-only for now. Admin UI may display platform-admin status but must not mutate it.

Rationale:
The platform's shared user/org model is already in place, but user editing was missing from the phase plan. Launch hardening should not proceed while `/account` is still a placeholder and platform admins cannot inspect or manage users. At the same time, ordinary solo users should experience Rumbo as an individual account, not as a team/org admin surface.

Consequences:
- Add user account status to support suspension/deactivation.
- Add password-change and password-recovery flows for local-password users.
- Add environment-driven SMTP email delivery for invites and password recovery.
- User email editing is in scope and must be handled carefully.
- Organization managers may invite members by email and manage member roles/removal.
- Removing the final manager from an organization is allowed; platform admins must be able to recover managerless organizations.
- Existing solo-account creation may need adjustment so personal workspaces do not expose organization-management UI by default.
