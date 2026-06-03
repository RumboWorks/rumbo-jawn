# Deferred Work

Use this file to prevent postponed work from disappearing.

Each deferred item should include:

- title,
- originally identified in,
- deferred to,
- reason,
- blocker, if any,
- why it must not be forgotten.

## Deferred item: Final visual design direction

Originally identified: Phase 01  
Deferred to: later design/UI phase  
Reason: Phase 01 should establish SCSS/Twig/design-system structure without locking final brand visuals.  
Blocking: Real screens and product workflows should exist first.  
Must not forget because: Early styling choices should eventually become a coherent public-facing visual system.

## Deferred item: Model Eval implementation

Originally identified: Platform planning  
Deferred to: after initial Sounds Like Us MVP scope unless roadmap changes  
Reason: Model Eval is a sibling tool, not part of first MVP implementation.  
Blocking: Shared platform foundation and first-tool MVP validation.  
Must not forget because: Model Eval is an important architectural constraint for shared auth, jobs, AI calls, storage, reporting, and admin.

## Deferred item: Google OAuth verification

Originally identified: Phase 02
Deferred to: when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env
Reason: Routes and strategy are fully wired; testing requires real credentials.
Blocking: Nothing — email/password auth is the working launch path.
Must not forget because: Google is the primary intended OAuth launch path.

## Deferred item: LinkedIn OAuth verification

Originally identified: Phase 02
Deferred to: after Google OAuth is confirmed; verify LinkedIn credentials when available
Reason: Strategy wired but untested. Decision log notes to defer and record if unstable.
Blocking: Nothing.
Must not forget because: LinkedIn is listed as a launch auth option.

## Deferred item: Storage root configuration on EC2

Originally identified: Phase 03
Deferred to: before Phase 04 runs real crawl jobs
Reason: Storage root defaults to ./storage relative to cwd. On EC2, this should point to a persistent path outside the app directory.
Blocking: Real artifact writes in Phase 04+.
Must not forget because: Artifacts written to the wrong path will be lost on deploy.

## Deferred item: AI provider key verification

Originally identified: Phase 03
Deferred to: as soon as API keys are available
Reason: All three provider adapters are wired; actual call testing deferred until OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY are set.
Blocking: Phase 04 SLU analysis requires at least one working provider.
Must not forget because: Phase 04 won't function without a working AI provider.

## Deferred item: Prisma migration history setup

Originally identified: Phase 02
Deferred to: before Phase 03 schema changes
Reason: prisma migrate dev requires CREATE DATABASE permission for shadow DB. rumbo_dev user lacks this. db push used instead.
Blocking: Need to grant permissions or configure SHADOW_DATABASE_URL before Phase 03 schema additions.
Must not forget because: Without migration history, schema changes are harder to track and reverse safely.

## Deferred item: PDF export from workbench

Originally identified: Phase 05
Deferred to: Phase 08 or a standalone polish phase
Reason: Plain text and Markdown download are sufficient for MVP. PDF requires a rendering library (puppeteer or similar) and server-side generation.
Blocking: Nothing.
Must not forget because: PDF is the expected output format for many nonprofit use cases (print, share with board, attach to grant application).

## Deferred item: Workbench manager/power-user configuration UI

Originally identified: Phase 05
Deferred to: post-MVP phases
Reason: Phase 05 is config-driven but exposes no UI for managers to edit Guidance Blocks, create custom Best-Practice Packs, or turn Option Sets on/off.
Blocking: Nothing — defaults work for launch.
Must not forget because: The manager config system is required for paid-tier differentiation and org customization.

## Deferred item: Guidance workbench regeneration / AI refinement

Originally identified: Phase 05
Deferred to: explicit paid/power-user phase
Reason: Phase 05 assembles output from existing structured data without new AI calls. Future phases may add explicit "regenerate" or "refine with AI" actions, but these must be clearly labeled, cost-logged, and usage-capped.
Blocking: Nothing.
Must not forget because: The no-AI-on-option-change constraint is intentional. Any AI regeneration path requires explicit UI, logging, and spend caps.

## Deferred item: Embeddable widget use-case selection

Originally identified: Platform planning  
Deferred to: post-MVP or earlier if a strong public widget use case appears  
Reason: Widgets are valuable for brand spread, but there is no current need for embedded widgets and the first public widget should be tied to a real product output.  
Blocking: Need Sounds Like Us or another tool output worth embedding.  
Must not forget because: Embeddable widgets are a medium-priority platform capability, not a back-burner idea.

## Deferred item: Admin job re-run and retry controls

Originally identified: Phase 06b  
Deferred to: later worker/admin reliability phase, or Phase 09 launch hardening  
Reason: Phase 06b added admin visibility and raw JSON debug aids. True re-run/retry buttons should wait until retry semantics, idempotency expectations, and cost implications are explicit.  
Blocking: Need clearer product rules for whether re-runs reuse artifacts, create new jobs, or mutate failed jobs.  
Must not forget because: Admin debugging will be much more useful once operators can safely retry failed runs without manual database or worker intervention.

## Deferred item: Admin UI editing for entitlements and product controls

Originally identified: Phase 07
Deferred to: Phase 07b
Reason: Phase 07 establishes shared entitlement, usage, spend-cap, model-config, and audit foundations with support scripts. Editing workflows need a dedicated admin UI pass.
Blocking: Phase 07 must be finished, approved, and committed first.
Must not forget because: Operators will need safe UI controls for tier changes, billing responsibility, usage budgets, spend caps, feature flags, and model/provider config before launch operations become practical.

## Deferred item: Admin UI editing Product controls

Admin UI editing Product controls needs multi-choice option for "tool" field rather than a single type-in.

## Deferred item: Advanced admin table search and filters

Originally identified: Phase 07b admin table polish  
Deferred to: later admin/search phase or Phase 09 launch hardening if needed before launch  
Reason: Current admin tables are small, server-rendered, and capped. Lightweight client-side sort/filter/count is enough for the present listings.  
Blocking: Need clearer operator workflows for relation-aware searches such as users by org, users by role, orgs by partner, usage over budget, and billing responsibility.  
Must not forget because: Once admin lists need pagination or cross-entity filtering, the implementation should move to whitelisted server-side query params backed by Prisma instead of relying on client-side DOM filtering.

## Deferred item: Partner account management screens

Originally identified: Phase 08b
Deferred to: partner-management phase or Model Eval migration planning
Reason: Phase 08b added user/org account management but intentionally did not add partner-account self-service screens.
Blocking: Need clearer partner workflows, branding needs, and whether partner management ships before or with Model Eval.
Must not forget because: Partner accounts are part of the shared platform model and will matter once partner-managed organizations become a real workflow.

## Deferred item: Account deletion and anonymization

Originally identified: Phase 08b
Deferred to: launch hardening, legal/privacy phase, or post-MVP account lifecycle work
Reason: Phase 08b added suspension/deactivation but intentionally avoided permanent deletion/anonymization.
Blocking: Need retention rules for jobs, artifacts, AI call logs, audit logs, billing records, feedback, and organization membership history.
Must not forget because: Production users will eventually need a clear account deletion/privacy process.

## Deferred item: OAuth account linking and unlinking

Originally identified: Phase 08b
Deferred to: later auth polish phase
Reason: Phase 08b displays auth method indicators and supports local-password recovery but does not let users connect or disconnect OAuth providers.
Blocking: Need provider-specific safety rules so users do not remove their only usable sign-in method.
Must not forget because: OAuth account recovery and provider changes are common account-management needs.

## Deferred item: Org-manager self-serve per-tool grants

Originally identified: Phase 10
Deferred to: a later access-delegation phase
Reason: Phase 10 adds per-tool access (`ToolGrant`) and a platform-admin UI to assign per-tool roles, but not org-manager (or partner-manager) self-serve UI to grant tool roles to their own members.
Blocking: Need delegation rules — which roles may grant which tools, and how this interacts with org entitlement and partner access.
Must not forget because: At 5–25 tools, platform admins should not be the only people who can grant tool access; org managers will need to manage their teams' tool access.

## Deferred item: Dedicated per-tool tiers and limits

Originally identified: Phase 10
Deferred to: a later billing phase
Reason: Per-tool org entitlement currently lives in `ProductTier.features`/limits JSON. A dedicated `OrganizationToolEntitlement` table (per-tool tier/limits) was considered but deferred.
Blocking: Need clearer per-tool pricing/packaging before formalizing the schema.
Must not forget because: Distinct per-tool plans and limits will eventually outgrow the shared `features`/limits JSON.

## Deferred item: Navigation UX for many tools

Originally identified: Phase 10
Deferred to: a later UX phase
Reason: Phase 10 renders accessible tools from a registry, which is correct but flat. Grouping, search, and favorites for large tool counts are out of scope.
Blocking: Need real tool count and categories before designing the dense navigation.
Must not forget because: A flat list does not scale gracefully toward 25 tools.

## Deferred item: Eval report exports (PDF/PNG/PPTX)

Originally identified: Eval migration planning (Phases 11–14)
Deferred to: a later Eval enhancement phase
Reason: The Eval MVP ships on-screen reports plus a secure share link; the standalone `Export`/`ExportFormat` model and PDF/PNG/PPTX generation are dropped from the MVP.
Blocking: Need export format priorities and a rendering approach consistent with platform storage/artifacts.
Must not forget because: Exportable reports were a feature of the standalone tool and will likely be requested.

## Deferred item: Cross-tool platform notification center

Originally identified: Eval migration planning (Phase 14)
Deferred to: a later platform phase
Reason: Phase 14 delivers Eval-scoped in-app + email notifications. A shared, cross-tool notification system was not generalized.
Blocking: Need a second tool with notifications to define the shared abstraction.
Must not forget because: As tools multiply, per-tool notification surfaces should consolidate into one platform notification center.

## Deferred item: Flash-message session race under rapid requests

Originally identified: Phase 10 (observed during access-foundation QA)
Deferred to: a later platform-hardening phase
Reason: The session-backed flash mechanism (set on POST, read+delete on the following GET) is eventually-consistent because the Prisma session store persists asynchronously. Under back-to-back requests (e.g. the Playwright `account page supports profile and password edits` test) the GET can read a stale or lost flash, making that test intermittently fail. This predates Phase 10 — it reproduces with Phase 10's nav middleware disabled (≈2/8 failures). Phase 10's tool-nav lookup was deliberately made non-blocking (cached, no awaited DB on the page-load hot path) so it does not add to this sensitivity.
Blocking: Need a robust flash approach (e.g. explicit `req.session.save()` before redirect on flash-setting routes, or a non-session flash channel) and confirmation it doesn't regress account/admin/org flows.
Must not forget because: It surfaces as flaky QA today and as occasional missing/stale confirmation banners for real users.
