# Usage

Use `.agent/usage.agent.md` when maintaining this file.

This file should document verified commands, scripts, inputs, outputs, configuration, data paths, and operational usage.

Do not document commands until they exist in `package.json`, source files, scripts, or verified project setup.

## Environment setup

Copy `.env.example` to `.env` and fill in values before starting any process.

```sh
cp .env.example .env
```

Key variables:

| Variable | Description |
| --- | --- |
| `PORT` | Express web port (default: `4000`) |
| `DATABASE_URL` | MySQL connection string (e.g. `mysql://user:pass@localhost:3306/rumbo_dev`) |
| `NODE_ENV` | `development` or `production` |
| `EMAIL_TRANSPORT` | Email transport mode. Use `log` to log delivery intent without SMTP. |
| `EMAIL_FROM` | Sender address for password recovery and organization invites. |
| `EMAIL_SMTP_HOST` | SMTP host for email delivery. |
| `EMAIL_SMTP_PORT` | SMTP port, commonly `587`. |
| `EMAIL_SMTP_SECURE` | `true` for implicit TLS, otherwise STARTTLS-style SMTP. |
| `EMAIL_SMTP_USER` | SMTP username. |
| `EMAIL_SMTP_PASS` | SMTP password. |

## Install

Run from the monorepo root. npm workspaces installs all packages.

```sh
npm install
```

## Build (assets)

Compiles SCSS and JS via Vite. Output goes to `apps/platform-web/public/dist/`.

```sh
npm run build
# or for the web workspace only:
npm run build --workspace=rumbo-web
```

## Start (dev — direct Node)

```sh
# Web server on port 4000
npm run dev:web

# Worker process
npm run dev:worker
```

## Start (PM2)

Requires PM2 installed globally (`npm install -g pm2`).

```sh
npm run pm2:start    # start rumbo-web and rumbo-worker
npm run pm2:stop     # stop both processes
npm run pm2:restart  # restart both processes
npm run pm2:logs     # tail logs
```

## QA / Playwright

Runs against the live server on `localhost:4000`. Server must be running first.

```sh
npm run qa           # run all tests headless
npm run qa:headed    # same but with a visible browser window (local only)
npx playwright test --grep "login"  # run a subset by name
```

Screenshots from each run land in `tests/screenshots/`. The suite covers page rendering, design system, theme switching, brand mark, and full auth flows.

## Database (Prisma)

Run from `packages/db/`.

```sh
# Generate Prisma client after schema changes
npm run db:generate --workspace=@rumbo/db

# Run migrations in development
npm run db:migrate --workspace=@rumbo/db

# Apply the Prisma schema directly to the dev database
npm run db:push --workspace=@rumbo/db

# Disposable dev DB only: reset schema from Prisma, then reseed defaults
npx prisma db push --force-reset --accept-data-loss --schema packages/db/prisma/schema.prisma
npm run seed-defaults --workspace=@rumbo/billing
```

## Platform Admin Access

Grant platform admin access to an existing user:

```sh
npm run grant-platform-admin --workspace=@rumbo/auth -- user@example.com
```

This sets `User.isPlatformAdmin = true`. The `/admin` area is server-gated and returns 403 for non-admin users.

Platform-admin grants and revocations remain CLI-only. The admin UI can display platform-admin status but does not change it.

## Public & Operational Endpoints

- `/healthz` — DB ping + uptime JSON for uptime monitors (503 when the database is down)
- `/legal/terms`, `/legal/privacy` — draft legal pages (review by counsel before launch); linked from the footer and the signup terms checkbox
- `/support` — support contact page (`SUPPORT_EMAIL` env)
- `robots.txt` — public pages allowed, app surfaces disallowed
- Operations runbook (backups, restore, monitoring): `docs/reference/operations.md`

## Signup & Email Verification

- `/pricing` — public plan comparison (free / solo / team / partner)
- `/signup?tier=<key>` — tiered signup: team collects an organization name (user becomes MANAGER), partner collects a partner-account name (PartnerAccount + first client org); free/solo create a personal workspace. Terms acceptance is required and recorded (`User.termsAcceptedAt`). Paid intent is stored on the entitlement (`overrides.intendedTier`) until Stripe billing activates the tier.
- `/register` — legacy URL; redirects to `/signup?tier=free` (invite tokens carry through)
- New local accounts must verify their email: they can log in but app surfaces redirect to `/auth/verify-pending` (resend available) until the emailed `/auth/verify/:token` link is opened. OAuth accounts start verified. Existing users were backfilled as verified.
- Public auth endpoints (`POST /signup`, `/auth/local`, `/password/forgot`, `/auth/verify/resend`) are rate-limited per client IP (15-minute windows). Loopback is exempt so the QA suite and local smoke checks are unaffected; the app sets `trust proxy` so Apache-forwarded client IPs are used.

## Help & FAQ

- `/help` and `/help/<toolKey>` — published help articles (platform-level and per-tool); "Help & FAQ" links live in the tool/account sidebars.
- The "?" button in the page header opens the context-sensitive help drawer; pages declare `{% set helpContextKey = '...' %}` before including `partials/page-header.twig`. Resolution: exact context-key match (across all published articles) → tool articles → platform articles, served by `GET /help/api/context?key=…`.
- Admin authoring at `/admin/help` (list, publish/unpublish, delete) and `/admin/help/new` / `/admin/help/:id` (markdown editor with live preview). Articles have a tool scope (or platform), slug, context keys, and nav order; all mutations are audit-logged.
- Seed the starter content (idempotent): `npm run seed-help --workspace=@rumbo/db` (15 articles: 5 platform, 4 SLU, 6 Eval).
- Markdown rendering lives in the shared `@rumbo/markdown` package (markdown-it + sanitize-html); Eval re-imports it for response commentary.

## Account Management

Verified account routes:

- `/account` — signed-in user profile, email, password, access summary, active-org usage, and self-service account deletion (typed-email confirm; anonymizes the account, archives sole-member workspaces, blocked while a subscription is active)
- `/account/orgs/:orgId/members` — organization member management for permitted managers
- `/password/forgot` — request a password reset email for a local-password account
- `/password/reset/:token` — complete password reset with a valid reset token
- `/invites/:token` — organization invitation landing/acceptance

## Partner Area

Partner managers (users with a `PartnerMembership` role `MANAGER`; platform admins also pass) get a "Partner" entry in the header nav. Routes:

- `/partner` — dashboard: managed client organizations (inline-edit name/type, archive) and partner co-manager management per account
- `/partner/orgs/new` — create a client organization under the partner account (free tier; the partner gets manager access via partner-org access)

Archiving removes the partner's access; the organization itself is only soft-deleted when it has no direct members. All mutations are audit-logged.

## Billing / Entitlements

Stripe (hosted Checkout + Customer Portal):

- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Without them, `/billing` renders an unconfigured state and `POST /billing/webhook` returns 503.
- To make a tier purchasable, set `ProductTier.stripePriceId` (and `priceUsdMonthly` for display) to a Stripe Price from the dashboard. Configure the Customer Portal in Stripe to allow switching among those prices and cancel-at-period-end.
- `/billing` — current plan for the active org (managers, billing-responsible users, or personal-workspace owners); upgrade buttons create Checkout Sessions; "Manage billing" opens the portal (card, plan changes, invoices, cancel).
- `POST /billing/webhook` — mounted with a raw body parser before the JSON middleware; handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`. Subscription state mirrors onto `OrganizationEntitlement`; the tier follows the subscription's price; deletion downgrades to `free`. Local testing: `stripe listen --forward-to localhost:4000/billing/webhook`.
- Dunning is Stripe-native (Smart Retries + Stripe emails); terminal failure emits `subscription.deleted` → auto-downgrade. `past_due` shows a warning banner on `/billing`.
- Admin (`/admin/orgs/:orgId`): Stripe billing card (status, period, dashboard links), immediate subscription cancel, suspend/unsuspend (suspended orgs lose tool access for everyone but platform admins). Org delete stays blocked while a subscription is active.

Seed default product tiers, AI model config, and missing org entitlements:

```sh
npm run seed-defaults --workspace=@rumbo/billing
```

Set an organization's tier by ID, public ID, or slug:

```sh
npm run set-org-tier --workspace=@rumbo/billing -- org-slug free
npm run set-org-tier --workspace=@rumbo/billing -- org-slug solo admin@example.com
```

Initial tiers are `free`, `solo`, `team`, and `partner`. Sounds Like Us has a soft usage budget of 10 runs per 7 days. Over-budget organizations show an indicator but are not blocked from starting runs in Phase 07.

AI model config is keyed by `tool`, `callType`, `scope`, and `scopeId`, so the same call type can use different providers for different tools.

Verified admin routes:

- `/admin` — dashboard with platform metrics, recent jobs, failures, AI calls, and Sounds Like Us runs
- `/admin/users` — user and relationship visibility
- `/admin/users/:userId` — user detail, profile/status editing, and organization membership management
- `/admin/orgs` — organization, membership, and partner-access visibility
- `/admin/orgs/new` — create an organization directly (name, type, tier)
- `/admin/orgs/:orgId` — organization member management, entitlement controls (tier, billing responsibility, SLU usage budget, AI spend cap), "Act as this organization" (audit-logged support access with a persistent banner), and soft delete with typed-name confirmation
- `/admin/partners` — partner account list
- `/admin/partners/new` — create a partner account
- `/admin/partners/:partnerId` — partner detail: edit, add/remove partner managers (by existing-user email), grant/revoke managed-organization access
- `/admin/eval` — cross-org Eval run list with permanent cascade delete
- `/admin/jobs` — recent jobs, with optional `type` and `status` query filters
- `/admin/jobs/:jobId` — job detail with payload, result, AI calls, artifacts, error text, and artifact purge (deletes stored files, keeps the job record)
- `/admin/jobs/:jobId/debug` — raw JSON debug payload for a job
- `/admin/sounds-like-us` — Sounds Like Us runs through shared job records
- `/admin/ai-calls` — recent AI provider/model/token/cost metadata
- `/admin/product-controls` — feature flag and tool-specific AI model/provider configuration controls
- `/admin/audit-log` — recent product-control and entitlement audit entries
- `/admin/failures` — failed jobs

## Tools and per-tool access

Tools are registered in `@rumbo/config` (`packages/config/src/tools.js`). Access has two axes: org entitlement (`features[tool]` on the product tier) and a per-user `ToolGrant`. Platform admins assign per-tool roles on `/admin/users/:userId` (Tool access section). `slu` is `orgOpen` (any org member with the org entitled); `eval` requires an explicit grant. The same registry supplies global tool-switcher display metadata: `name`, `description`, `icon`, `path`, and `navOrder`.

## Eval

Seed the Eval provider/model catalog (idempotent):

```sh
node tools/eval/src/seed.js
```

Eval routes (require an `eval` tool grant; authoring/settings are manager-only):

- `/eval` — overview/dashboard for the active organization
- `/eval/settings/criteria` — reusable evaluation criteria (manager)
- `/eval/settings/models` — model catalog: provider, provider model, access method (manager)
- `/eval/evals` — evaluations list; `/eval/evals/new`; `/eval/evals/:publicId` detail + run history (manager)
- `/eval/evals/:publicId/runs/new` — launch a run (prompt + criteria + models + options); creates immutable snapshots (manager)
- `/eval/runs/:publicId` — run status: collection progress, per-response actions, lifecycle (manager)
- `/eval/responses/:publicId/manual` — paste a model response; `POST /eval/responses/:publicId/collect` enqueues live API collection (manager)
- `/eval/runs/:publicId/review` — tabbed review screen for assigned reviewers (autosave ratings/comments → JSON; submit finalizes)
- `/eval/runs/:publicId/report` — completed-run report: models×criteria heatmap, editable summary/recommendation, secure share toggle (manager)
- `/eval/share/:token` — public, read-only shared report (no auth; model names hidden); mounted outside the eval access gate
- `/eval/tasks` — your open tasks (reviews to complete, responses to collect)
- Eval overview shows in-app notifications (review assigned/reminder, eval completed, manual-response needed); managers can send review reminders from the run-status page. Emails use the shared SMTP sender and require `EMAIL_SMTP_*` configured (otherwise logged).

Live API collection runs as an `eval.collectResponse` job handled by `apps/worker` via `@rumbo/eval/worker`, calling the model under test through `@rumbo/ai` (cost logged to `AiCall`, org AI spend cap enforced, `eval.response_collection` usage recorded). Requires `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in the environment.
