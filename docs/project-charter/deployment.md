# Deployment

## Current deployment direction

Use self-contained EC2 servers for MVP work.

Use Apache as reverse proxy.

Use PM2 to run Node processes.

Initial processes:

- `rumbo-web`
- `rumbo-worker`

Possible later process:

- `rumbo-python-worker`

## Future direction

The architecture should allow later movement toward a more modern distributed DevOps setup.

Do not require it for MVP.

## Subdomains and routing

Public app routes may use subdomains or paths.

Admin may start under `/admin`, but the architecture should allow later admin subdomain routing.

Do not couple physical hosting to product identity.

Apache or a future proxy should be able to route hostnames to the same app now and different services later.

## Environment

Use `.env` for secrets and major environment differences:

- dev/test/prod selection,
- database connection,
- OAuth secrets,
- Stripe keys,
- AI provider keys.

Use DB-backed configuration for tunable product/tool settings:

- tool limits,
- model choices,
- crawl page limits,
- cache TTLs,
- spend caps,
- feature flags,
- enabled add-ons,
- per-org overrides.
