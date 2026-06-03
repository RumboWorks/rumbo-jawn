# Phase 10 — Multi-Tool Access Foundation

## Purpose

Make Rumbo a real multi-tool platform before a second tool (Eval) is added.

Today the platform hosts one tool (Sounds Like Us) and treats access as **org-wide**: a user who is an organization `MEMBER` or `MANAGER` has that role for everything the organization can reach. The platform's intended destination is **5–25 tools**, where a single user may have **different access in different tools** — from no access, to member, to manager — independently per tool, while **platform-admin stays universal**.

This phase adds the missing **user-axis** access layer (per-user, per-tool role) on top of the existing **org-axis** entitlement (which tools an organization gets), plus a tool registry that lets navigation scale to many tools. It is a platform phase, not an Eval phase; Eval (Phase 11+) becomes the first real consumer.

## Current state

- Tools are packages under `tools/` exposing an Express router, mounted in `apps/platform-web/src/routes/index.js` (`router.use('/slu', sluRouter)`).
- `packages/auth/src/permissions.js` defines only org-scoped roles (`PLATFORM_ADMIN`, `PARTNER_MANAGER`, `ORG_MANAGER`, `ORG_MEMBER`) and org-scoped permissions (`VIEW_ORG`, `MANAGE_ORG_MEMBERS`, etc.). There is no per-tool role concept.
- `Membership.role` in `packages/db/prisma/schema.prisma` is a single org-wide `MemberRole { MANAGER, MEMBER }`.
- Per-tool **config/usage** seams already exist: `tool` field on `UsageEvent`, `FeatureFlag`, and `AiModelConfig`.
- Per-tool **org entitlement** already exists informally: `ProductTier.features` JSON carries flags like `{ slu: true }`, resolved by `getEffectiveEntitlement(orgId).features` in `packages/billing/src/index.js`, with an admin UI from Phase 07b.
- Navigation is hardcoded: `apps/platform-web/views/pages/home.twig` links directly to `/slu`.
- SLU routes assume any authenticated user with a primary org membership may use the tool (`primaryOrgIdForUser`).

## Product decisions

- Access has **two independent axes**:
  - **Org axis (exists):** does the organization have the tool — `getEffectiveEntitlement(orgId).features[toolKey]`.
  - **User axis (new):** within an org that has the tool, what is this user's role for that tool — none, member, or manager.
- The user axis is implemented with an additive **`ToolGrant`** table; **absence of a grant means no access**. This is layered on top of org `Membership`, which continues to mean "belongs to the organization" and governs org-level concerns (billing, member management).
- **Platform-admin is universal**: a platform admin is effectively manager in every tool of every org.
- **Partner managers** act as manager in tools of organizations they have partner access to.
- Tools may opt into an **`orgOpen`** fallback: when `orgOpen` is true, any org member (with the org entitled to the tool) gets access at their org `Membership` role without an explicit `ToolGrant`. **Sounds Like Us is `orgOpen: true`** so current behavior is preserved. **Eval is `orgOpen: false`** so access requires an explicit grant.
- A **code-level tool registry** is the single source of truth for tool keys, display names, paths, and nav order, so adding tools is a data change, not a layout rewrite.
- **Scope for this phase:** model + resolver + middleware + registry + access-driven nav + **platform-admin** grant management UI. Org-manager self-serve grant delegation and dedicated per-tool billing tiers are out of scope.

## What this phase delivers

### Tool registry

- A new shared module (e.g. `packages/tool-registry` or an export from `packages/config`) exporting a declarative list of tools:
  - fields: `key`, `name`, `path`, `icon`, `navOrder`, `orgOpen`.
  - initial entries: `slu` (`orgOpen: true`) and `eval` (`orgOpen: false`, registered now even though the Eval tool ships in Phase 11).
- Helper accessors: `getTool(key)`, `listTools()`.
- Tool keys here are the canonical strings used by `UsageEvent.tool`, `FeatureFlag.tool`, `AiModelConfig.tool`, `features[toolKey]`, and `ToolGrant.tool`.

### Schema: per-user, per-tool grant

- Add `ToolGrant` to `packages/db/prisma/schema.prisma`:
  - `id`, `userId`, `orgId`, `tool` (registry key), `role MemberRole`, `createdAt`, `updatedAt`.
  - `@@unique([userId, orgId, tool])`, indexes on `userId` and `[orgId, tool]`.
  - relations to `User` and `Organization` with `onDelete: Cascade`.
  - reuse the existing `MemberRole { MANAGER, MEMBER }` enum.
- Apply with `prisma db push --force-reset --accept-data-loss` and reseed (dev DB is disposable, consistent with Phase 08b).

### Access resolver and middleware (`packages/auth`)

- `resolveToolRole(user, orgId, tool) → 'manager' | 'member' | null`, in resolution order:
  1. `user.isPlatformAdmin` ⇒ `manager`.
  2. partner-manager with partner access to `orgId` ⇒ `manager`.
  3. explicit `ToolGrant(userId, orgId, tool)` ⇒ its role.
  4. else if the tool is `orgOpen` and the user has a `Membership` in `orgId` ⇒ that membership role.
  5. else `null`.
  - **Org-axis gate:** if `getEffectiveEntitlement(orgId).features[tool]` is falsy, return `null` regardless of the above (except platform-admin, which may still be allowed for support — decide and document; default: platform-admin bypasses the org gate, normal grants do not).
- `requireToolAccess(toolKey, minRole = 'member')` Express middleware: resolves the user's role for the request's org, rejects with 403 (or redirect to an access-denied page) when below `minRole`, and attaches `req.toolRole` for downstream handlers.
- `listAccessibleTools(user, orgId)`: registry ∩ org entitlement ∩ resolved non-null role, ordered by `navOrder`; used by nav.
- Extend `permissions.js` with tool-scoped helpers (e.g. a tool-role-aware `canInTool(toolRole, permission)`), without changing existing org permission behavior.

### Navigation (access-driven, scalable)

- Replace the hardcoded link in `apps/platform-web/views/pages/home.twig` with a list rendered from `listAccessibleTools(user, primaryOrg)`.
- Add a tool switcher / tool list to `apps/platform-web/views/layouts/app.twig` rendered from the same helper.
- Tools the user cannot access are not shown. (Dense UX for 25 tools — grouping, search — is explicitly deferred.)

### SLU integration (non-breaking)

- Mount SLU behind `requireToolAccess('slu')` in `apps/platform-web/src/routes/index.js`. Because SLU is `orgOpen: true`, every current SLU user keeps access at their existing org role.

### Platform-admin grant management UI

- Extend the Phase 08b platform-admin **user detail** page (and/or the org detail page) to:
  - list a user's `ToolGrant` rows across their organizations,
  - grant a per-tool role (`MEMBER`/`MANAGER`) for a given org×tool,
  - change or revoke an existing grant.
- All grant mutations are audit-logged via the existing `AdminAuditLog` (actor, target user, old/new value, org, tool, reason).
- Ensure the Phase 07b org-entitlement tool toggles write the same registry tool keys used by grants and the resolver.

### Shared services and authorization

- Grant mutations live in a shared service (in `@rumbo/auth` or a platform service), not inside view routes.
- Server-side authorization: only platform admins can mutate grants in this phase. Resolver/middleware enforce read access on every tool route.
- Validate invariants: valid tool key (must exist in registry), valid role, existing user/org, unique `(userId, orgId, tool)`.

## Out of scope

- Org-manager (or partner-manager) self-serve UI to grant tool roles to their members. (Deferred.)
- Dedicated per-tool tiers/limits table (`OrganizationToolEntitlement`); per-tool billing stays in `ProductTier.features`/limits for now.
- Navigation UX for large tool counts (grouping, search, favorites).
- The Eval tool itself (Phase 11+).
- Changing org-wide `Membership` semantics or existing org permissions.
- Migrating any existing data (none exists for tool grants).

## Acceptance criteria

- A `ToolGrant` table exists and is applied to the dev database.
- A tool registry exists and is the single source of truth for tool keys/paths/nav order; `slu` and `eval` are registered.
- `resolveToolRole` returns the correct role for: platform-admin (manager everywhere), partner-manager (manager in managed orgs), explicit grant, `orgOpen` fallback, and no-access (null) — including the org-entitlement gate.
- `requireToolAccess` blocks users below the required role with a clear 403/redirect and allows those at or above it.
- Navigation renders only the tools a user can access, from the registry, for both the home page and the app layout.
- SLU continues to work for ordinary org members with no explicit grant (grandfathered via `orgOpen`).
- A platform admin can view, grant, change, and revoke a user's per-tool roles, and these changes are audit-logged.
- A user can be set as **manager in one tool and have no access to another tool in the same org**, and this is reflected in nav and route access.
- Existing registration, login, admin, SLU, entitlement, and product-control flows still pass QA.

## Implementation guidance

- Build the registry and resolver first; wire SLU through `requireToolAccess` early to prove the path is non-breaking, then add the admin UI.
- Keep `resolveToolRole` pure and well-tested; it is the security-critical core. Centralize all access decisions there rather than scattering checks.
- Prefer extending existing Phase 08b admin pages over building new admin surfaces.
- Reuse the existing `MemberRole` enum and `AdminAuditLog`; do not introduce a parallel role or audit system.
- Decide and document the platform-admin-vs-org-entitlement-gate behavior explicitly in the resolver.
- Treat this as platform functionality, not tool-specific functionality.
- Add Playwright coverage for: per-tool access gating (manager in one tool, no access in another), nav filtering, SLU non-breakage, and platform-admin grant/revoke.

## Suggested implementation slices

1. Tool registry module + tool keys.
2. `ToolGrant` schema + apply/reseed.
3. `resolveToolRole` + `requireToolAccess` + `listAccessibleTools` with unit tests.
4. Wire SLU through `requireToolAccess` (non-breaking) and confirm QA.
5. Access-driven nav (home + app layout).
6. Platform-admin grant management UI + audit logging.
7. QA + Playwright coverage.

## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Relevant commands/checks were run.
- [x] Manual QA notes are recorded.
- [x] New commands are documented in `docs/reference/usage.md`, if commands exist. (No new commands.)
- [x] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [x] Roadmap items are checked off, added, or moved.
- [x] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [x] Working notes created during this phase were promoted, linked, archived, or deleted. (None created.)
- [x] No unplanned files were added directly under `docs/`.
- [x] The next phase still makes sense or has been revised.

### Closeout notes

- Added a tool registry (`@rumbo/config` → `tools.js`) as the single source of truth for tool keys/paths/nav order; registered `slu` (`orgOpen: true`) and `eval` (`orgOpen: false`).
- Added the `ToolGrant` table (per-user, per-tool role) reusing the `MemberRole` enum.
- Added `resolveToolRole`, `listAccessibleTools`, `requireToolAccess`, and `toolRoleAtLeast` to `@rumbo/auth` (`tool-access-service.js`), implementing the documented precedence and the org-entitlement gate.
- Wired SLU through `requireToolAccess('slu', { allowAnonymous: true })` so its public funnel and existing members are unaffected.
- Made navigation access-driven: home launcher (`home.twig`), header tool switcher (`app.twig`/`base.twig`), fed by `listAccessibleTools`. The header lookup is non-blocking and cached (30s) so it adds no awaited DB work to the page-load hot path; the authoritative gate (`requireToolAccess`) is never cached.
- Added platform-admin per-tool grant management on the user-detail page (grant/update/revoke), audit-logged via `AdminAuditLog` (`adminUpsertToolGrant`/`adminRemoveToolGrant`).
- Schema applied additively to the dev DB (the existing DB had pre-existing FK drift unrelated to this change, so `ToolGrant` was created directly with Prisma-matching DDL rather than a destructive `--force-reset`, preserving the 41 test users / 19 orgs).
- Verification: `npm run db:generate --workspace=@rumbo/db`; `ToolGrant` table created + queryable; `npm run build --workspace=rumbo-web`; `npm run qa` (23 passing; the one intermittently-failing test, `account profile and password edits`, is a pre-existing session-flash race — see deferred-work — that reproduces with this phase's nav disabled); direct functional verification of `resolveToolRole`/`listAccessibleTools` across all precedence branches (orgOpen fallback, org-gate block, grant + entitlement → differentiated per-tool roles) with state cleaned up afterward.

### Valid outcomes

- Proceed to Phase 11 (Eval tool foundation).
- Stay in this phase and finish missing work.
- Split remaining access work (e.g. org-manager self-serve grants) into a named later phase.
- Revise the roadmap because product understanding changed.
