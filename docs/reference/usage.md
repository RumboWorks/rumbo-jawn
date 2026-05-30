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

## Database (Prisma)

Run from `packages/db/`.

```sh
# Generate Prisma client after schema changes
npm run db:generate --workspace=@rumbo/db

# Run migrations in development
npm run db:migrate --workspace=@rumbo/db
```
