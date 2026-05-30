# Rumbo Architecture

## Architecture summary

Rumbo should start as a **modular monolith** deployed on self-contained EC2 infrastructure, with explicit seams for future distribution.

This means:

- One monorepo.
- Shared platform capabilities.
- Tool modules with strong boundaries.
- One deployable web app at first.
- Separate worker process at first.
- Clear path to split tools, admin, workers, Python services, database, and storage later.

## Current deployment model

- EC2 Ubuntu servers.
- Apache reverse proxy.
- PM2-managed Node processes.
- MySQL while using existing general-purpose servers.
- Local filesystem storage through an abstraction.

Recommended PM2 processes for MVP:

```text
rumbo-web
rumbo-worker
```

Possible future process:

```text
rumbo-python-worker
```

## Future deployment direction

When justified, the architecture should allow:

- Admin on a separate host/subdomain.
- Tool-specific web apps on separate hosts.
- Workers on separate hosts.
- Python analysis as a separate worker/service.
- Managed/cloud database.
- S3-compatible object storage.
- External queue service such as Redis/SQS/etc.

Do not build the distributed system now. Do preserve the seams.

## Monorepo structure

```text
apps/
  platform-web/
  worker/
tools/
  sounds-like-us/
  model-eval/
packages/
  auth/
  config/
  db/
  design-system/
  ai/
  crawler/
  jobs/
  storage/
  python-bridge/
python/
  analysis/
docs/
.agent/
```

## Dependency rule

Tools may depend on shared packages.

Shared packages must not depend on tool internals.

Tool modules should not import each other directly. Shared reusable logic belongs in a package.

## Routing model

Internally, route modules may live under:

```text
/admin
/tools/sounds-like-us
/tools/model-eval
/api/...
```

Externally, Apache may route subdomains to the same app now:

```text
admin.example.com        -> same web app, admin routes
sounds.example.com       -> same web app, Sounds Like Us routes
eval.example.com         -> same web app, Model Eval routes
```

Later, the same hostnames can point to different servers if needed.

## Backend

- Express.
- Node ESM only.
- Plain JavaScript initially.
- Thin route handlers should call service modules.
- Shared logic should move to packages.

## Templating/frontend

- Server-rendered Twig page shells by default.
- Twig is preferred because page source traceability matters.
- Vanilla JS modules for simple interactivity.
- React for highly dynamic screens.
- React can be mounted as an island inside a Twig page shell.

Example:

```text
tools/sounds-like-us/views/guidance-workbench.twig
tools/sounds-like-us/assets/js/guidance-workbench.jsx
```

## CSS/design system

- SCSS.
- Shared design system.
- No Bootstrap.
- No Tailwind-style framework.
- Lucide icons acceptable.
- Compile shared base CSS plus per-tool CSS.

Recommended outputs:

```text
rumbo-base.css
sounds-like-us.css
model-eval.css
```

## Database

- Prisma ORM.
- MySQL for MVP on existing EC2 servers.
- Prisma migrations are the official schema-change workflow.
- Avoid DB-specific raw SQL unless needed. Isolate and document any raw SQL.
- Reconsider Postgres when building Rumbo-specific infrastructure.

Shared platform tables should include:

- users
- orgs
- memberships
- subscriptions
- jobs
- ai_calls
- files/artifacts/manifests as needed

Tool-specific tables should reference shared platform tables.

## Auth/orgs

- Centralized auth for all tools.
- Every account belongs to at least one organization.
- Launch should support Google auth and probably LinkedIn auth.
- Email/password and/or magic link should remain available if practical.
- Approved-domain auto-approval belongs in shared auth/org logic.
- Evaluate Passport.js first for Express-native multi-provider auth unless Auth.js proves better.

## Jobs

- Shared DB-backed jobs table for MVP.
- Job payloads must be flexible because tools may ask very different things from similar verbs such as `extract_text`.
- Long-running analysis should continue even if the user leaves the page.
- Job progress should be available to the web UI.

## AI provider layer

- Shared AI provider wrapper.
- Provider/model configurable per call type.
- Record token and cost data for each call.
- Support global and per-org spend caps.
- Cache by explicit cache keys/TTLs where safe.

## Python integration

- Node orchestrates and calls Python via CLI/subprocess initially.
- Use JSON stdin/stdout/files as the integration boundary.
- Python owns deeper text analysis, ML, extraction, and AI routines where libraries matter.
- Python may later become a separate worker/service.

## Storage

- Local EC2 filesystem initially.
- Use a storage abstraction to allow later S3-compatible storage.
- Store raw crawl/AI artifacts as JSON files when appropriate.
- Store metadata/status in DB.
- Use shared artifact manifests.

## Embeddable widgets

Embeddable widgets are a medium-priority platform capability. They are not the default UI model, but architectural choices should avoid preventing them.

Potential uses:

- AI Facts / transparency label.
- Generated-with-guidance badge.
- Public mini report cards.
- Evaluation result snippets.
- Organization guidance/voice summary badges.

Consider web components later for embeddable widgets, but do not make them the default component model for MVP app screens.
