# PM2 — Running sibling apps alongside Rumbo

This guide covers how to add a new Express app (e.g. `rumbo-crawler`) to the same server without conflicting with Rumbo's processes or ports. Each app owns its own ecosystem file and PM2 process names; they share nothing except the PM2 daemon.

## Port allocation

Rumbo uses port 4000 (web) and has no HTTP port for the worker. Reserve non-overlapping ports for each additional app:

| App | Process | Port |
|---|---|---|
| Rumbo | `rumbo-web` | 4000 |
| Rumbo | `rumbo-worker` | — |
| Crawler | `rumbo-crawler` | 4001 |
| *(next app)* | `rumbo-<name>` | 4002, … |

All ports are private. Apache proxies public traffic to them (see Apache section below). Never expose a raw app port publicly.

## Ecosystem file

Each app keeps its own `ecosystem.config.cjs` in its own root directory. Do not add entries to `/var/www/rumbo/ecosystem.config.cjs` — Rumbo's file is committed to this repository and its entries belong here.

Example `/var/www/rumbo-crawler/ecosystem.config.cjs`:

```js
// Must be .cjs when the package uses "type": "module".
module.exports = {
  apps: [
    {
      name: 'rumbo-crawler',
      script: './src/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 4001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
    },
  ],
};
```

Name convention: `rumbo-<appname>`, all lowercase, no spaces. This keeps all Rumbo-family apps visually grouped in `pm2 list`.

## Starting for the first time

Run these from the app's own directory so PM2 resolves relative paths correctly:

```sh
cd /var/www/rumbo-crawler
pm2 start ecosystem.config.cjs --env production
pm2 save   # persist the process list across reboots
```

`pm2 save` merges the new app into the saved process list without touching Rumbo's entries. Confirm with `pm2 list` — you should see `rumbo-web`, `rumbo-worker`, and `rumbo-crawler` all online.

## Standard per-app commands

Each app is managed by its PM2 name. These do not affect other processes:

```sh
pm2 restart rumbo-crawler
pm2 stop    rumbo-crawler
pm2 start   rumbo-crawler
pm2 logs    rumbo-crawler --lines 100
pm2 show    rumbo-crawler
```

## Cross-app commands

These operate on every process PM2 knows about — use them intentionally:

```sh
pm2 list           # status of all processes
pm2 restart all    # restart everything (Rumbo + all siblings)
pm2 stop all       # stop everything
pm2 save           # persist current process list (run after any start/delete)
pm2 startup        # (once, on a new server) generate the systemd/init script
```

## Startup persistence

If PM2 was already configured with `pm2 startup` for Rumbo, you do not need to run it again. Just `pm2 save` after starting the new app and the daemon will restore all listed processes on reboot.

If setting up a fresh server:

```sh
pm2 startup        # follow the printed instruction (usually: sudo env PATH=... pm2 startup ...)
pm2 start /var/www/rumbo/ecosystem.config.cjs --env production
pm2 start /var/www/rumbo-crawler/ecosystem.config.cjs --env production
pm2 save
```

## Environment variables

Each app reads its own `.env` (or however it loads config) — there is no shared env file. Common variables that must be consistent across apps on the same host:

- `NODE_ENV` — set uniformly via the `--env production` flag on `pm2 start`; the ecosystem file maps this to `env_production` entries.
- `DATABASE_URL` — if the crawler shares the Rumbo database, use the same connection string. If it has its own database, use a different one.

Do not hard-code `PORT` anywhere other than the ecosystem file; the app should read `process.env.PORT`.

## Apache reverse proxy

Add a vhost or a `Location` block for each app port. Minimal example for `rumbo-crawler` on a subdomain:

```apache
<VirtualHost *:443>
  ServerName crawler.example.com

  ProxyPass        / http://localhost:4001/
  ProxyPassReverse / http://localhost:4001/

  RequestHeader set X-Forwarded-Proto "https"
  RequestHeader set X-Forwarded-For   "%{REMOTE_ADDR}s"

  # TLS config (certbot / Let's Encrypt)
  SSLEngine on
  SSLCertificateFile    /etc/letsencrypt/live/crawler.example.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/crawler.example.com/privkey.pem
</VirtualHost>
```

If the app will be served under a path on the same domain as Rumbo (e.g. `example.com/crawler/`), add a `Location` block to Rumbo's existing vhost instead and set `app.set('trust proxy', 1)` in the crawler's Express setup (same as Rumbo does) so rate limiting and IP resolution work correctly.

## Health checks

Add a `GET /healthz` route to each sibling app (same pattern as Rumbo's) and point an uptime monitor at it. A sibling going down should not affect Rumbo's healthz response.

## Logs

PM2 writes per-process logs under `~/.pm2/logs/`:

```
~/.pm2/logs/rumbo-web-out.log
~/.pm2/logs/rumbo-web-error.log
~/.pm2/logs/rumbo-crawler-out.log
~/.pm2/logs/rumbo-crawler-error.log
```

To rotate logs without losing history, install `pm2-logrotate` once on the server:

```sh
pm2 install pm2-logrotate
```

It applies to all PM2-managed processes automatically.
