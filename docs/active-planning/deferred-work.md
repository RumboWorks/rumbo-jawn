# Deferred Work

Use this file to prevent postponed work from disappearing.

Each deferred item should include:

- title,
- originally identified in,
- deferred to,
- reason,
- blocker, if any,
- why it must not be forgotten.

## Completed item: Final visual design direction

Originally identified: Phase 01  
Completed in: Phase 15
Outcome: The implemented standalone Align Desk UI language was rebranded as Rumbo's shared design system.

## Completed item: Model Eval implementation

Originally identified: Platform planning  
Completed in: Phases 10–14 (as "Eval", plus the Phase 15 authoring UX pass)  
Outcome: Eval was migrated into the platform as the second tool — per-tool access foundation, model catalog + criteria, runs with immutable snapshots, manual + live API collection, review workflow, heatmap report + secure share, tasks and notifications.

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
Deferred to: Phases 18–19 (admin partner CRUD, then `/partner` self-service area) — scheduled on the roadmap
Reason: Phase 08b added user/org account management but intentionally did not add partner-account self-service screens.
Blocking: Nothing — scheduled.
Must not forget because: Partner accounts are part of the shared platform model and will matter once partner-managed organizations become a real workflow.

## Deferred item: Account deletion and anonymization

Originally identified: Phase 08b
Deferred to: Phase 23 (self-serve anonymizing deletion) — scheduled on the roadmap; hard purge of historical records remains deferred beyond that
Reason: Phase 08b added suspension/deactivation but intentionally avoided permanent deletion/anonymization.
Blocking: Hard purge needs retention rules for jobs, artifacts, AI call logs, audit logs, billing records, feedback, and organization membership history.
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

## Deferred item: Eval live collection for Google/other providers + org API keys

Originally identified: Phase 12
Deferred to: a later Eval enhancement phase
Reason: Live API response collection maps Eval models to @rumbo/ai, which implements OpenAI and Anthropic. Google/Gemini and other providers fall back to manual entry. Org-supplied API keys (ORGANIZATION_API access method) are also not yet wired — platform keys are used for live collection.
Blocking: Need a Google provider in @rumbo/ai and a secure per-org API key store.
Must not forget because: Manual-only collection for Google models and no BYO-key support limit the tool for orgs standardized on those.

## Deferred item: Editable draft runs before launch

Originally identified: Phase 12
Deferred to: a later Eval polish phase
Reason: The schema supports an EvalRun DRAFT status, but the MVP launches a run directly into COLLECTING_RESPONSES from the run-new form. There is no save-as-draft / edit-before-launch flow.
Blocking: Need product clarity on whether draft editing (re-selecting models/criteria, editing the prompt) is worth the extra surface before reviewers are involved.
Must not forget because: Managers may want to stage a run before committing snapshots.

## Deferred item: Custom dunning emails

Originally identified: Finish-line planning (2026-06-10)
Deferred to: post-launch billing polish
Reason: Phase 21 relies on Stripe Smart Retries and Stripe-hosted dunning emails; terminal payment failure auto-downgrades the org to free via webhook.
Blocking: Nothing — Stripe's defaults cover launch.
Must not forget because: Branded payment-failure communication will matter once paying customers are real.

## Deferred item: Proration and plan-change policy

Originally identified: Finish-line planning (2026-06-10)
Deferred to: post-launch billing polish
Reason: Phase 21 uses Stripe Customer Portal defaults for upgrades/downgrades (proration on upgrade, change at period end where configured). No custom policy is encoded in Rumbo.
Blocking: Need real pricing decisions before customizing.
Must not forget because: Plan-change behavior is a customer-facing pricing commitment and should eventually be deliberate, not default.

## Deferred item: Seat limits per tier

Originally identified: Finish-line planning (2026-06-10)
Deferred to: a later billing/packaging phase
Reason: Tiers gate features and usage budgets but not member counts; team/partner tiers currently allow unlimited members.
Blocking: Need packaging decisions (seats vs flat tiers).
Must not forget because: Seat enforcement is a common revenue lever and is cheap to add to `ProductTier.limits` once decided.

## Deferred item: Cookie banner / consent management

Originally identified: Finish-line planning (2026-06-10)
Deferred to: only if third-party trackers are ever added
Reason: Rumbo uses only first-party session cookies and stores UI preferences in localStorage; no analytics/marketing trackers exist, so a consent banner is not required.
Blocking: Nothing.
Must not forget because: If analytics or marketing pixels are added later, consent requirements change immediately.

## Completed item: Eval authoring UX refinement (wizard + flows + polish)

Originally identified: Phase 12 review
Completed in: Phase 15
Reason: Phase 12 built the authoring flow as plain pages so the data/features land first. The authoring UX needs refinement and sits entirely on top of the stable launchRun/snapshot model, so it can be reworked without touching the data layer or blocking Phases 13–14.
Scope to address:
- Replace the single run-new form with a multi-step wizard (port model_eval's eval-wizard.service.js: prompt → models → criteria → reviewers → review; reviewers step depends on Phase 13).
- Seamless create-eval → create-run handoff (partially done: create-eval now redirects into the run form).
- Optional save-as-draft / edit-before-launch (EvalRun DRAFT) — see related deferred item.
- General polish pass across all eval screens (evals list, detail, run status, manual response).
Blocking: Phase 13 introduces reviewer assignment, which is a wizard step in the original — build the wizard after that exists so the step is real.
Outcome: The run-authoring flow uses a stepped wizard with reviewer selection and the Eval screens received a shared-system polish pass.
