# Data Model Direction

## Shared platform data

Shared platform tables should include, at minimum:

- users,
- organizations,
- memberships,
- subscriptions,
- jobs,
- AI calls,
- provider/model configuration,
- usage limits,
- artifact manifests.

Every account should belong to at least one organization.

Tool-specific tables should reference shared platform tables rather than duplicating user, org, auth, billing, or job concepts.

## Tool-specific data

Sounds Like Us may need tables for:

- analysis runs,
- source URLs,
- source documents,
- generated guidance profiles,
- output variants,
- user selections/options,
- feedback.

Model Eval may later need tables for:

- evaluation projects,
- models,
- prompts,
- artifacts,
- criteria/rubrics,
- scores,
- reviewers,
- reports.

Model Eval is out of scope for initial MVP implementation.

## Storage split

Use database records for metadata, status, ownership, permissions, and queryable information.

Use JSON files for raw crawl output, AI artifacts, large generated payloads, and job artifacts.

Use artifact manifests to connect database records to stored files.

## ORM

Use Prisma.

Use MySQL for now.

Preserve the ability to move to Postgres or cloud databases later by avoiding unnecessary database-specific behavior.
