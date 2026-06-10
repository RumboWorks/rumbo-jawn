# Decision Log

This is the actual project decision log.

Use `.agent/decision-log.agent.md` when maintaining this file.

## 2026-06-10 — Finish-line plan: phases 16–23 then phase 09 as the final gate

Status: Accepted

Decision:
Finish the product through a planned sequence: docs reconciliation (16), structural/UI consistency (17), admin completeness + act-as-org (18), partner self-service area (19), email verification + public signup (20), Stripe billing (21), context-sensitive help + Help & FAQ (22), missing-pieces sweep (23), and finally the existing Phase 09 launch hardening as the last pre-launch gate. One commit per phase.

Rationale:
The platform and both tools are built; what remains is the finish-line work (docs drift, no partner UI, no self-service billing, no help system) that Phase 09 anticipated. Sequencing puts shared primitives and admin/partner services before the screens that consume them, and verification-heavy billing before content phases.

Consequences:
- Roadmap gains a "Finish line" section; Phase 09 moves to the end.
- Phase docs are created per phase as work begins.

## 2026-06-10 — Stripe Checkout + Customer Portal (hosted) for billing

Status: Accepted

Decision:
Integrate payments with Stripe-hosted surfaces: Checkout Sessions for purchase and the Customer Portal for card updates, plan changes, and self-cancel. Rumbo keeps a thin `/billing` page and syncs subscription state into the existing `OrganizationEntitlement` stripe fields via webhooks (`checkout.session.completed`, `customer.subscription.updated`/`deleted`, `invoice.payment_failed`). Dunning uses Stripe Smart Retries and Stripe-hosted emails; terminal failure downgrades the org to the free tier. The webhook mounts with a raw body parser ahead of the global `express.json()`.

Rationale:
Hosted surfaces minimize code and PCI surface and ship fastest; the schema was already prepared for exactly this shape (stripe* fields on `OrganizationEntitlement`).

Consequences:
- `stripe` dependency lives in `@rumbo/billing`; price IDs live on `ProductTier` rows, not env.
- Free tier never touches Stripe; the partner tier's subscription attaches to the partner's primary org.
- Custom dunning emails and proration policy stay deferred (see deferred-work).

## 2026-06-10 — Self-service signup: four public tiers with required email verification

Status: Accepted

Decision:
Public signup offers all four existing tiers (free, solo, team, partner). Team signup creates a named org with the user as manager; partner signup creates a `PartnerAccount` + partner membership + first org; free/solo create a personal SOLO org. Email verification is required: users can log in but are blocked from the app (redirect to a verify-pending page with resend) until verified; OAuth emails count as verified. Terms acceptance is collected at signup. Public auth endpoints are rate-limited.

Rationale:
Self-service accounts that can spend AI budget and purchase subscriptions need verified ownership of the email; keeping all four tiers preserves pricing flexibility already encoded in `ProductTier`.

Consequences:
- New `EmailVerificationToken` model (mirrors `PasswordResetToken`) and `User.emailVerifiedAt`/`termsAcceptedAt`; existing users backfilled as verified.
- `/register` becomes a redirect into the tiered `/signup` flow.

## 2026-06-10 — Admin tool-data access: act-as-org plus targeted panels

Status: Accepted

Decision:
Platform admins manage tool data primarily by switching their active organization to any org ("act as org" — access already resolves to MANAGER everywhere) with a persistent indicator banner and an audit-log entry, rather than duplicating every tool screen under `/admin`. Targeted admin panels exist only for cross-org lists and destructive operations (e.g. delete an Eval run, purge SLU job artifacts, partner account CRUD, org create/delete).

Rationale:
The tool's own manager UI is already the best editor for tool data; mirroring it in admin would double the maintained surface for every tool. `listAccessibleOrganizations` already returns all orgs for platform admins, so only UI, visibility, and auditing were missing.

Consequences:
- Org switching by an admin into a non-membership org is audit-logged (`admin.act_as_org`).
- Tools may export small admin services (e.g. cascade delete) for the platform admin router to consume.

## 2026-06-10 — Help system: DB-backed articles, on-request drawer, dedicated admin editor

Status: Accepted

Decision:
Help content lives in a `HelpArticle` table (tool-scoped or platform-level, markdown body, context keys, publish flag) editable by platform admins. The in-app surface is a help drawer (native `<dialog>` per the tool-switcher pattern) opened only from a "?" button — never proactive — resolving content by page context key with tool-level then platform-level fallback. Each tool sidebar gains a "Help & FAQ" item linking to rendered article pages. Markdown rendering moves from `tools/eval` into a shared package so the platform can render article bodies. Authoring uses a dedicated edit page with preview (long markdown does not fit the inline-edit row pattern).

Rationale:
DB-backed content lets admins edit without deploys; the on-request drawer satisfies "help must not get in the way"; reusing the dialog pattern and markdown-it avoids new dependencies.

Consequences:
- New shared markdown package; `tools/eval` re-imports it.
- Planned in Phase 22, with seeded draft FAQs for SLU, Eval, and platform topics.

## 2026-06-04 — Adopt Align Desk UI language as Rumbo design system

Status: Accepted

Decision:
Rebrand the implemented standalone Align Desk visual language as Rumbo's shared design system. Ship light, dark, paper, and pink themes plus comfortable and compact density. Use Paper when a browser has no saved theme preference, and use the standalone Eval `1200px` fixed-width content layout by default.

Rationale:
The standalone Eval app established a more mature operational UI after Rumbo's initial neutral design foundation. Rumbo now has enough real workflows to make that system the cross-tool standard.

Consequences:
- `@rumbo/design-system` is the shared frontend source of truth.
- Shared primitives use `rj-`; tools retain isolated workflow-specific styles.
- Current platform, Eval, and Sounds Like Us surfaces migrate onto the shared tokens and shell.
- Individual pages may opt into fluid content when their workflow requires it.

## 2026-06-04 — Use validated active organization context

Status: Accepted

Decision:
Use a session-backed active organization context validated against direct membership, partner-managed organization access, or platform-admin status.

Rationale:
A multi-tool platform cannot safely assume the first membership is always the organization a user intends to act within.

Consequences:
- Tool access and organization-scoped work resolve through the active organization.
- Invalid or stale session context falls back to an accessible organization.
- The global header exposes organization switching.

## 2026-06-04 — Store navigation orientation on the user account

Status: Accepted

Decision:
Allow authenticated users to choose horizontal or vertical contextual navigation, with a single sitewide preference stored on `User.navOrientation`. Horizontal is the default.

Rationale:
Horizontal navigation matches the adopted Align Desk language, while vertical navigation remains useful for dense operational work and existing Rumbo users.

Consequences:
- The same contextual navigation markup supports both layouts.
- The preference follows users across devices and login sessions.
- Theme and density remain browser-local preferences.

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

## 2026-06-02 — Per-tool access layer (ToolGrant) for a multi-tool platform

Status: Accepted

Decision:
Add a per-user, per-tool access layer so the platform can host many tools (target 5–25) with independent access tiers per tool (no-access / member / manager), while platform-admin stays universal. Access has two axes: an org axis (does the organization get the tool, via `getEffectiveEntitlement(orgId).features[tool]`) and a new user axis (a `ToolGrant(userId, orgId, tool, role)` table; absence means no access). A `resolveToolRole(user, orgId, tool)` helper unifies grants with platform-admin (universal) and partner-manager, and a `requireToolAccess` middleware gates tool routers. A code-level tool registry is the single source of truth for tool keys/paths/nav order. Tools may opt into an `orgOpen` fallback so a tool is usable at org-membership role without explicit grants; Sounds Like Us is `orgOpen: true` (grandfathered), Eval is `orgOpen: false`.

Rationale:
The existing model is org-wide: `Membership.role` and `permissions.js` give a user one role across everything the org can reach, so "manager in tool A, no access to tool B" was impossible. Per-tool config/usage seams already existed (`tool` on `UsageEvent`/`FeatureFlag`/`AiModelConfig`) and org-level tool entitlement existed via `ProductTier.features`, but the per-user role dimension was missing. This is platform functionality and should land before a second tool, not inside it.

Consequences:
- New `ToolGrant` table reusing the existing `MemberRole` enum.
- New tool registry module; navigation renders from accessible tools, scaling to many tools.
- SLU mounts behind `requireToolAccess('slu')` non-breaking via `orgOpen`.
- Platform-admin gains UI to assign per-tool roles (audit-logged); org-manager self-serve grants and dedicated per-tool billing tiers are deferred.
- Planned in Phase 10.

## 2026-06-02 — Migrate Model Eval into Rumbo as the `eval` tool

Status: Accepted

Decision:
Rebuild the standalone Model Eval app as a Rumbo tool (`@rumbo/eval`, URL `/eval`, key `eval`, display name "Eval"), reusing the platform's shared identity, org, partner, jobs, AI, billing, storage, and admin infrastructure instead of its duplicates. Eval-domain tables are added to the single platform Prisma schema, re-cast to platform conventions (String `cuid` IDs, `Eval`-prefixed names, UPPERCASE enums) referencing platform `User`/`Organization`. No data migration (all test) and no backwards compatibility; the schema/APIs are re-optimized for the MVP and unused pieces dropped. MVP scope is the core eval→review→report loop plus live API response collection, notifications & email, and a tasks inbox. Report exports (PDF/PNG/PPTX), partner-account UI, custom roles, and analytics events are deferred. Frontend stays server-rendered Twig + vanilla JS. Eval is the first consumer of the Phase 10 per-tool access model (`orgOpen: false`).

Rationale:
Keeping Model Eval standalone would fork identity, billing, AI, and admin. The platform was designed with tool seams (router-per-package, shared packages, single schema, single worker) precisely so a second tool can be added without a rewrite.

Consequences:
- Rename the empty `tools/model-eval` stub to `tools/eval` / `@rumbo/eval`.
- Drop Model Eval's duplicate identity/org/partner/session tables, its own auth/permissions, email service, ad-hoc AI calls, and analytics/audit tables.
- Add `eval` to product-tier `features` and AI model config; add `UsageKey.EVAL_RESPONSE_COLLECTION`.
- Live API response collection runs through `@rumbo/jobs` + `apps/worker` + `@rumbo/ai`, cost-logged and spend-capped.
- Planned in Phases 11–14.
