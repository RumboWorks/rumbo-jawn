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
```

## Platform Admin Access

Grant platform admin access to an existing user:

```sh
npm run grant-platform-admin --workspace=@rumbo/auth -- user@example.com
```

This sets `User.isPlatformAdmin = true`. The `/admin` area is server-gated and returns 403 for non-admin users.

Verified admin routes:

- `/admin` — dashboard with platform metrics, recent jobs, failures, AI calls, and Sounds Like Us runs
- `/admin/users` — user and relationship visibility
- `/admin/orgs` — organization, membership, and partner-access visibility
- `/admin/jobs` — recent jobs, with optional `type` and `status` query filters
- `/admin/jobs/:jobId` — job detail with payload, result, AI calls, artifacts, and error text
- `/admin/jobs/:jobId/debug` — raw JSON debug payload for a job
- `/admin/sounds-like-us` — Sounds Like Us runs through shared job records
- `/admin/ai-calls` — recent AI provider/model/token/cost metadata
- `/admin/failures` — failed jobs
