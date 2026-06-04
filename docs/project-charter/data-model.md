# Data Model Direction

## Shared platform data

Shared platform tables should include, at minimum:

- users,
- organizations,
- memberships,
- partner accounts,
- partner memberships,
- partner organization access,
- subscriptions,
- product tiers,
- organization entitlements,
- usage events,
- jobs,
- AI calls,
- provider/model configuration,
- usage limits,
- feature flags,
- admin audit logs,
- artifact manifests.

Every account should belong to at least one organization. Solo users operate through an internal solo organization with a manager membership, even when the product UI does not need to emphasize organization language.

Users are global identities. Access is determined by relationships rather than a single permanent user type:

- platform administration through `User.isPlatformAdmin`,
- direct organization membership,
- partner-account membership,
- partner access to managed organizations.

Users store structured `firstName` and `lastName` profile fields while retaining `name` as the canonical full display-name compatibility field. New local registrations collect both structured fields; OAuth profiles populate them when providers supply given and family names.

Organization memberships use manager/member semantics. Organization managers can administer an organization; organization members have standard org access. Partner managers can act with manager-level rights inside organizations their partner account manages.

Billing and product entitlements are organization-centered. Solo organizations use the same entitlement model as other organizations. Billing responsibility may attach to an eligible organization owner/manager, including explicitly attached partner managers for managed organizations. Partner management access alone does not bypass organization limits.

Usage limits should be stored as organization/tool/key/period records so sibling tools can add their own usage keys. User-facing limits should stay simple; internal cost controls can still enforce AI spend caps.

AI provider/model configuration should include both `tool` and `callType`. Do not force tools to encode the tool name into the call type just to select different models.

Organization-scoped data must always include organization context and must be queried with server-side permission checks.

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
