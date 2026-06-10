# Operations

Production runbook: monitoring, backups, restore, and process management. Companion to `docs/project-charter/deployment.md` (architecture) and `docs/reference/usage.md` (commands).

## Processes

PM2 runs two apps from `ecosystem.config.cjs`:

- `rumbo-web` — Express app on port 4000 (behind the Apache reverse proxy). Restart after server-code **or Twig template** changes (templates are cached in-process).
- `rumbo-worker` — background job runner (SLU analyses, Eval live collection). Restart after worker/handler changes.

```sh
pm2 restart rumbo-web
pm2 restart rumbo-worker
pm2 logs rumbo-web --lines 100
```

Rebuild assets after JS/SCSS changes: `npm run build --workspace=rumbo-web`.

## Health & monitoring

- `GET /healthz` — no auth, no session. Returns `{ ok: true, db: "up", uptimeSeconds }` or 503 when the database is unreachable. Point an external uptime monitor (UptimeRobot, Pingdom, a cron + curl) at it; alert on non-200.
- Watch `pm2 logs` for `stripe webhook handler error` lines and Prisma errors — both indicate state-sync problems worth immediate attention.
- The admin dashboard (`/admin`) shows failed-job counts and AI spend; `/admin/failures` lists failed jobs newest-first.

## Backups

Two things hold state: the MySQL database and the storage root (crawl/AI artifacts as JSON files).

Nightly database dump (run as a cron on the host; keep ~14 days):

```sh
mysqldump --single-transaction --routines rumbo_dev | gzip > /var/backups/rumbo/rumbo-$(date +%F).sql.gz
find /var/backups/rumbo -name 'rumbo-*.sql.gz' -mtime +14 -delete
```

Storage root sync (path from `STORAGE_ROOT`; defaults to `./storage` — on EC2 this should point outside the app directory, see deferred-work):

```sh
rsync -a --delete /path/to/storage/ /var/backups/rumbo/storage/
```

For off-host durability, push both to S3 (`aws s3 sync /var/backups/rumbo s3://<bucket>/rumbo/`).

## Restore

1. Stop the app: `pm2 stop rumbo-web rumbo-worker`.
2. Restore the database: `gunzip < rumbo-YYYY-MM-DD.sql.gz | mysql rumbo_dev`.
3. Restore the storage root: `rsync -a /var/backups/rumbo/storage/ /path/to/storage/`.
4. `npm run db:generate --workspace=@rumbo/db` if the schema version moved.
5. Start: `pm2 start rumbo-web rumbo-worker`; check `/healthz` and sign in.

A full restore rehearsal is pending: the `rumbo_dev` MySQL user lacks `CREATE DATABASE` (the same limitation that blocks Prisma's shadow DB), so restoring into a scratch database needs a privileged user first. Tracked for phase 09 launch hardening.

## Deploy

Deploys are git-based on the host:

1. `git pull` (or `git checkout <tag>`).
2. `npm install` (only when dependencies changed).
3. Apply any schema change additively (see gotchas below), then `npm run db:generate --workspace=@rumbo/db`.
4. `npm run build --workspace=rumbo-web`.
5. `pm2 restart rumbo-web rumbo-worker`.
6. Check `/healthz`, sign in, and click through one tool page.

## Rollback

1. Note the bad commit: `git log --oneline -3`.
2. `git checkout <last-good-commit>` (every phase is one commit, so the last-good point is always a phase boundary).
3. `npm run build --workspace=rumbo-web`; `pm2 restart rumbo-web rumbo-worker`.
4. Schema changes are additive-only, so a code rollback runs safely against the newer schema — extra columns/tables are simply unused. Only restore the database (see Restore) if data itself was corrupted.

## Known operational gotchas

- **Do not** run `prisma db push --force-reset` against a database with real data; the dev DB also has pre-existing FK drift that makes plain `db push` fail. Apply schema changes additively: `prisma migrate diff --from-url <DATABASE_URL> --to-schema-datamodel prisma/schema.prisma --script`, extract only the new statements, then `prisma db execute --file …`.
- Email: with no SMTP configured (or `EMAIL_TRANSPORT=log`), `sendEmail` logs `[email:…]` lines instead of sending — safe for dev, silent in prod if misconfigured. Verify SMTP env on deploy.
- Stripe: `/billing/webhook` returns 503 until `STRIPE_WEBHOOK_SECRET` is set; subscription state only syncs while the webhook is reachable from Stripe.
- Rate limits key on client IP and skip loopback; they require `trust proxy` (set in `src/index.js`) and Apache forwarding `X-Forwarded-For`.
