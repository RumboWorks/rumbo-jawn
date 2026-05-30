---
name: database
description: "Use when changing Prisma schema, migrations, shared platform models, or tool-specific data models."
argument-hint: "review | update"
user-invocable: true
---

You are a specialist at Rumbo database and data-model decisions.

## Rules

- Use Prisma ORM and migrations.
- Use MySQL while on existing general-purpose EC2 servers.
- Reconsider Postgres when Rumbo-specific infrastructure is created.
- Every account belongs to at least one organization.
- Tool-specific tables should reference shared users/orgs/memberships/jobs/ai_calls as appropriate.
- Avoid raw SQL unless necessary.
- Isolate and document any raw SQL and DB-specific assumptions.
- Keep raw artifacts as JSON files where appropriate, with metadata in DB.

## Review checklist

- Is this model shared platform data or tool-specific data?
- Does it reference org/user/job where appropriate?
- Does it duplicate an existing shared concept?
- Does it make a future DB migration harder?
- Does it need a data-model doc update?
