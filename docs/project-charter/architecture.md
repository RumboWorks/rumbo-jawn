# Architecture

## Architectural anchor

Build Rumbo as a modular monolith for the MVP, with explicit seams for later distribution.

The platform should run on self-contained EC2 servers initially. Future architecture may move toward a more modern distributed DevOps setup when justified.

## Platform vs tools

Rumbo is the shared platform/product family.

Sounds Like Us is the first MVP tool.

Model Eval is a planned sibling tool and is out of scope for initial MVP implementation unless a phase file explicitly says otherwise.

Shared services belong to the platform:

- authentication,
- users,
- organizations,
- memberships,
- subscriptions,
- jobs,
- AI calls and cost logging,
- storage abstraction,
- usage limits,
- centralized admin,
- billing readiness,
- design-system conventions,
- deployment conventions.

Tool-specific modules may own:

- tool routes,
- tool views,
- tool frontend assets,
- tool services,
- tool-specific jobs,
- tool-specific database tables,
- tool-specific artifacts.

Tools must not depend on each other's internals.

## Repository strategy

Use a monorepo.

Recommended shape:

```text
apps/
  platform-web/
  worker/

tools/
  sounds-like-us/
  model-eval/

packages/
  auth/
  db/
  design-system/
  ai/
  crawler/
  jobs/
  storage/
  python-bridge/
  config/

python/
  analysis/
```

The exact package structure may evolve during Phase 00 and Phase 01, but the boundary principle should remain: shared platform packages should not depend on tool modules.

## Runtime

Current runtime direction:

- EC2 Ubuntu servers.
- Apache reverse proxy.
- PM2 process manager.
- Express backend.
- Node ESM only.
- No CommonJS.
- PM2 processes:
  - `rumbo-web`
  - `rumbo-worker`
  - possible later `rumbo-python-worker`

## Frontend and templating

Use server-rendered pages by default.

Use Twig for page templates unless a better option is explicitly chosen and documented.

Use vanilla JavaScript for simple interactivity.

Use React for highly dynamic screens where it is justified.

Use Twig page shells with React islands/pages when needed so page source and routing remain traceable.

Public anonymous brochure/marketing pages should live in one WordPress site, not separate brochure pages per tool.

## CSS and visual design

Use SCSS.

Do not use Bootstrap, Tailwind, or a heavy CSS framework.

Use a shared design-system foundation that works across simple server-rendered pages and complex React pages.

Use Lucide as the default icon library unless a later decision changes this.

Use moderate prefixing:

- `rj-` for shared platform/design-system classes,
- tool-specific prefixes for tool-specific classes, such as `slu-` and `meval-`.

Phase 01 should establish functional scaffolding plus a minimal neutral design foundation, not a final visual brand system.

## Build

Use npm scripts.

Use Vite where useful for SCSS, JS, and React bundling.

Do not use Gulp unless a clear need emerges and is documented.

## Database

Use Prisma as the ORM/data-access layer.

Use MySQL while Rumbo is sharing existing general-purpose EC2 servers.

Reconsider Postgres when building EC2 instances or infrastructure specifically for Rumbo.

Use Prisma migrations.

Avoid database-specific tricks unless needed. Isolate and document raw SQL when used.

## Auth and organizations

Use centralized auth shared across all tools.

Every account should belong to at least one organization.

Users are global identities. Platform access is determined by relationships:

- direct organization memberships,
- partner-account memberships,
- partner access to managed organizations,
- platform admin status.

Solo users should receive an internal solo organization and manager membership. Partner managers may act with manager-level rights inside organizations connected to their partner account.

Launch auth should include Google login and probably LinkedIn, plus email/password and/or magic link if practical.

Approved-domain auto-approval belongs in shared auth/org logic.

## Jobs, storage, and artifacts

Use shared flexible DB-backed jobs for MVP.

Use local EC2 file storage initially with an abstraction for later S3 or S3-compatible storage.

Store raw crawl and AI artifacts as JSON files.

Store metadata and status in the database.

Use shared artifact manifests for job inputs, outputs, costs, and event logs.

## Python

Node should call Python via CLI/subprocess initially.

Use JSON stdin/stdout/files as boundaries.

Python may become a separate worker/service later.

Python is appropriate for text analysis, ML, AI-heavy routines, extraction, scoring, and similar work.

## AI provider layer

All AI calls should go through a shared provider wrapper.

Provider and model should be configurable per call type.

Record token/cost usage for every AI call.

Support global and per-organization spend caps.

Use cache keys and TTLs for crawl and AI reuse where appropriate.

## Entitlements, limits, and billing readiness

Product tiers, usage limits, billing readiness, feature flags, and AI model/provider configuration belong to shared platform services.

The billable/control unit is the organization, including internal solo organizations. Tools should ask shared services for budget and entitlement status rather than embedding billing logic in tool modules.

AI model/provider configuration is keyed by tool and call type. This allows the same call type, such as `crawl.summarize`, to use different providers or models for Sounds Like Us, Model Eval, or future tools.

Sounds Like Us starts with a soft usage budget of 10 runs per 7 days. Soft usage overages surface to users and admins but do not block runs. AI spend caps remain server-enforced before provider calls.

Admin edit workflows for tiers, billing responsibility, limits, feature flags, and model configuration are separated into Phase 07b.

## Admin

Use a centralized admin UX shared across tools.

Admin can start under `/admin`.

The architecture should allow admin to later move to a subdomain or separate host if useful.

## Embeddable widgets

Embeddable widgets are a medium-priority platform capability, not a back-burner idea.

They are valuable because useful public widgets can spread brand recognition.

Do not make web components the default UI model for MVP, but keep them on the table for embeddable, cross-context, or framework-neutral widgets.

## Future distribution seams

The MVP may run on one EC2 server, but the architecture should not prevent later moving:

- admin,
- individual tools,
- workers,
- database,
- storage,
- queue,
- Python services,
- AI processing services,

onto separate hosts or managed services.
