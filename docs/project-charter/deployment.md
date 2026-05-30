# Deployment

## Current deployment target

- Self-contained EC2 Ubuntu server.
- Apache reverse proxy.
- PM2 process manager.
- Node Express app.
- MySQL.
- Local filesystem storage.

## PM2 processes

Expected MVP processes:

```text
rumbo-web
rumbo-worker
```

Possible future process:

```text
rumbo-python-worker
```

## Apache routing

Start with one app/server. Apache may route multiple hostnames to the same PM2 app.

Examples:

```text
admin.example.com        -> rumbo-web / admin routes
sounds.example.com       -> rumbo-web / Sounds Like Us routes
eval.example.com         -> rumbo-web / Model Eval routes
```

Later, these hostnames can point to separate servers without changing the public URL strategy.

## Environment/config

Use `.env` for:

- environment selection
- secrets
- DB connection
- OAuth provider secrets
- Stripe keys
- AI provider keys

Use DB-backed config for:

- tool limits
- model/provider choices
- crawl limits
- cache TTLs
- spend caps
- feature flags
- enabled add-ons
- per-org overrides

## Future distribution seams

The code should not assume all pieces must always run on one server. Preserve seams for:

- web app split by tool/subdomain
- worker split
- Python service/worker
- cloud DB
- S3-compatible storage
- external queue
