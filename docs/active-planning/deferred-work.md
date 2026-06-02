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
Deferred to: Phase 08 or earlier if a strong use case appears  
Reason: Widgets are valuable for brand spread, but the first public widget should be tied to a real product output.  
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
