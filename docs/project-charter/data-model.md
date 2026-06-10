# Data Model

The implementation source of truth is `packages/db/prisma/schema.prisma`. This file records the direction and conventions; the schema records the detail.

## Shared platform data

Shared platform tables as built:

- `User` (status ACTIVE/SUSPENDED/DEACTIVATED, `isPlatformAdmin`, structured first/last name),
- `OAuthAccount`, `PasswordResetToken`, `Session`,
- `Organization` (soft-delete via `deletedAt`), `Membership` (MANAGER/MEMBER), `OrganizationInvite`, `ApprovedDomain`,
- `PartnerAccount`, `PartnerMembership`, `PartnerOrganizationAccess`,
- `ToolGrant` (per-user, per-org, per-tool role),
- `ProductTier` (limits/features JSON; seeded free/solo/team/partner), `OrganizationEntitlement` (tier, billing responsibility, AI spend cap, and Stripe subscription fields — `stripeCustomerId`, `stripeSubscriptionId`, price/status/period/cancel fields — present in the schema and activated by the Stripe billing phase),
- `UsageEvent` (org/tool/usageKey rolling-window metering),
- `Job`, `AiCall` (token + cost logging), `ArtifactManifest`,
- `AiModelConfig` (tool + callType keyed provider/model config), `FeatureFlag`,
- `AdminAuditLog`.

Subscription state lives on `OrganizationEntitlement` rather than a separate subscriptions table; Stripe is the system of record for payment history.

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

Convention: tool tables reference platform `User`/`Organization` via **scalar** `userId`/`organizationId` fields (indexed, no Prisma relation) so the shared models stay free of tool back-relations. `SluFeedback` established the pattern; all `Eval*` tables follow it. Relations are declared only among a tool's own tables.

Sounds Like Us (built) stores most data through the shared platform: analysis runs are `Job` rows (`type: 'slu.analysis'`), crawl/guidance outputs are `ArtifactManifest` + JSON files, and the only SLU-specific table is `SluFeedback` (rating, comment, selected workbench options).

Eval (built; phases 10–14) owns the `Eval*` tables:

- model catalog: `EvalProvider`, `EvalProviderModel`, `EvalOrgModel`,
- criteria: `EvalCriterion`,
- evaluations and runs: `Eval`, `EvalRun` (status lifecycle DRAFT → COLLECTING_RESPONSES → … → COMPLETED/ARCHIVED),
- immutable launch snapshots: `EvalPromptSnapshot`, `EvalCriterionSnapshot`, `EvalModelSnapshot`,
- responses and review: `EvalResponse`, `EvalReviewAssignment`, `EvalRating`, `EvalReviewComment`,
- output: `EvalReport` (with secure share token),
- workflow: `EvalTask`, `EvalNotification`.

## Storage split

Use database records for metadata, status, ownership, permissions, and queryable information.

Use JSON files for raw crawl output, AI artifacts, large generated payloads, and job artifacts.

Use artifact manifests to connect database records to stored files.

## ORM

Use Prisma.

Use MySQL for now.

Preserve the ability to move to Postgres or cloud databases later by avoiding unnecessary database-specific behavior.
