# Phase 06a — Identity, Organizations, and Access Foundation

## Purpose

Bring Rumbo's shared user, organization, partner, and permission model in line with the Model Eval prototype before building central admin observability.

This is platform work. Sounds Like Us remains the first active tool, and Model Eval remains out of implementation scope, but this phase prepares Rumbo to later host Model Eval as a sibling tool inside the same platform.

## Why this comes before Phase 06b

Central admin and observability depend on the platform's access model.

Before building admin views for users, organizations, jobs, AI calls, costs, errors, and tool runs, the platform needs a durable answer for:

- platform admins,
- solo organizations,
- organization managers and members,
- partner accounts,
- partner managers who can manage client organizations,
- server-side permission resolution.

## Source model

Use the relevant identity/access concepts from `/var/www/model-eval-dev/app/development/` and the implemented prototype code under `/var/www/model-eval-dev/app/web/`.

Do not copy Model Eval's tool-specific evaluation schema into Rumbo during this phase.

## What this phase delivers

- Updated shared Prisma schema for platform identity/access.
- `User.isPlatformAdmin`.
- Organization type support, including `solo` organizations.
- Organization memberships using manager/member semantics.
- Partner account tables.
- Partner membership tables.
- Partner-to-organization access tables.
- Shared permission service for resolving a user's effective role in an organization.
- Admin route gate based on platform admin status.
- Signup/login behavior that ensures every user belongs to at least one organization.
- Existing user/org data migrated to the new semantics.
- Documentation updates for the platform data model and access rules.

## Out of scope

- Full admin dashboards and observability UI. That moves to Phase 06b.
- Model Eval tool implementation.
- Full invite workflow unless required to keep existing auth working.
- Billing or subscription ownership.
- Complex role-management UI.
- Platform admin impersonation.
- Partner self-service UI.

## Implementation notes

- Keep Rumbo's current string/cuid ID style rather than copying the prototype's integer IDs.
- Rename or migrate membership role semantics to `MANAGER` and `MEMBER`.
- Map existing `OWNER` and `ADMIN` memberships to `MANAGER`.
- Map existing `MEMBER` memberships to `MEMBER`.
- Keep approved-domain auto-approval, but make auto-approved users members unless a future rule says otherwise.
- Solo users should get an internal solo organization and a manager membership.
- Server-side authorization must not rely on hidden UI alone.
- Organization-scoped queries should accept or derive explicit organization context.

## Acceptance criteria

- New users always end up with at least one organization membership.
- Solo users get a solo organization and manager membership.
- Existing users can still log in after migration.
- Existing jobs remain associated with their existing users/orgs.
- Platform admin access checks use `User.isPlatformAdmin`.
- Permission service can resolve:
  - platform admin,
  - organization manager,
  - organization member,
  - partner manager for a managed organization,
  - no access.
- Partner-managed organization access is represented in shared platform tables.
- Phase 06b central admin can be built on this model without another schema redesign.

## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [ ] All acceptance criteria pass.
- [ ] Relevant commands/checks were run.
- [ ] Manual QA notes are recorded.
- [ ] New commands are documented in `docs/reference/usage.md`, if commands exist.
- [ ] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [ ] Roadmap items are checked off, added, or moved.
- [ ] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [ ] Working notes created during this phase were promoted, linked, archived, or deleted.
- [ ] No unplanned files were added directly under `docs/`.
- [ ] Phase 06b still makes sense or has been revised.

