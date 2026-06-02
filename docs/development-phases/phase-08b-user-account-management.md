# Phase 08b — User Account Management

## Purpose

Add the missing user-account management layer for Rumbo before launch hardening.

Phase 06a established the shared user, organization, membership, partner, and permission model. Phase 06b and Phase 07b added platform-admin visibility and operational controls. This phase turns the existing identity model into usable account-management workflows for:

- users managing their own account,
- organization managers managing organization members,
- platform admins managing users, memberships, and access.

This phase replaces the current `/account` placeholder and fills the planning gap where user editing was not previously called out.

## Current state

- `/account` renders a placeholder profile/organization sidebar.
- Registration and login create users and ensure each user has at least one organization membership.
- Solo users receive an internal solo organization and manager membership.
- Admin `/admin/users` lists users but has no user detail or edit surface.
- Admin `/admin/orgs/:orgId` can edit entitlement and billing settings but cannot manage organization membership.
- Membership and invite tables already exist in the Prisma schema.
- Permission helpers already distinguish platform admin, partner manager, organization manager, and organization member roles.
- A CLI exists for granting platform admin access, but there is no UI for reviewing or changing platform-admin status.

## Product decisions

- Users can edit both display name and email address.
- Local-password users can change password while signed in.
- Self-service password recovery by email is in scope.
- AWS SES SMTP credentials are available in `.env`; implementation should use environment variables and should not hard-code credentials.
- Platform-admin grants and revocations remain CLI-only for now. Admin UI may display platform-admin status but must not mutate it.
- Organization managers can invite users by email.
- Removing a user from an organization is allowed even if it leaves the organization with zero managers.
- Account deactivation/suspension is in scope and should add the needed user-status schema.
- Solo organizations should be as invisible as possible in self-account UI.
- Partner-account management screens are out of scope for this phase.

## Personal organization direction

Every account should still belong to at least one organization for platform consistency, entitlement tracking, usage limits, jobs, and future migration paths.

For solo users, the organization should behave like an internal personal workspace rather than a visible team-management concept. The recommended implementation direction is:

- Keep the internal solo organization record.
- Keep the user associated with that organization.
- Do not show organization-management UI while the organization has no active manager or while it is effectively a one-person personal workspace.
- Platform admins can promote the user to an organization manager when the account is being upgraded into an organization/team workflow.
- Once an active manager exists, organization features such as member management and invites become visible to that manager.
- Platform admins can recover managerless organizations.

This may require changing the current registration behavior that gives solo users a manager membership by default. A clean implementation would either create the solo membership as `MEMBER`, or introduce an explicit way to hide personal-workspace manager affordances while preserving existing permission invariants. Prefer the simplest approach that keeps ordinary users from seeing organization-management UI until platform admin intentionally promotes the account.


## What this phase delivers

### Self-account management

- A real `/account` profile page replaces the placeholder.
- Users can view their name, email, auth method indicators, organization memberships, partner memberships, and platform-admin state if applicable.
- Users can edit display name and email address.
- Users can change local-account password while signed in.
- Users can request password-recovery email and complete password reset without being signed in.
- Users can see team/organization relationships when they are meaningful to the user.
- Personal solo organizations remain hidden or minimized unless the user has been promoted into an active organization-management role.

### Organization manager member management

- Organization managers can view members for organizations they manage.
- Organization managers can invite members by email.
- Organization managers can change member roles between `MANAGER` and `MEMBER` when permitted.
- Organization managers can remove members when permitted.
- Removing the final manager is allowed; the organization then becomes managerless until platform admin recovery or another explicit manager assignment.
- Partner managers can manage memberships only for organizations they are permitted to manage through partner access, if included in scope.

### Platform-admin user management

- Admin users list links to a user detail page.
- Platform admins can view a user's profile, auth accounts, organization memberships, partner memberships, jobs, and audit-relevant access flags.
- Platform admins can edit user profile fields such as display name, email address, and account status.
- Platform admins can manage organization memberships for a user.
- Platform admins can review platform-admin status but cannot grant or revoke it through UI.
- Platform admins do not need partner-account management screens in this phase.
- Admin user changes are audit-logged with actor, target user, old value, new value, timestamp, and optional reason.

### Email and password recovery

- Add email delivery infrastructure using environment-configured SMTP settings.
- Send organization invites by email.
- Send password-recovery emails for local-password accounts.
- Recovery tokens must be single-use, expire, and avoid storing raw tokens in the database.
- Email sends should fail safely and produce useful operator-visible errors during development.

### Account status

- Add user account status to support active and suspended/deactivated states.
- Suspended/deactivated users cannot sign in.
- Existing sessions for suspended/deactivated users should be invalidated or rejected on the next authenticated request.
- Admin UI exposes status changes with clear confirmation and audit logging.

### Shared services and permissions

- User/account mutations live in shared auth or platform services rather than inside view routes.
- Server-side authorization enforces:
  - self-only profile editing for normal users,
  - organization-manager permissions for org member management,
  - partner-manager permissions for managed organizations,
  - platform-admin permissions for global user management.
- Membership changes use the existing `Membership`, `PartnerMembership`, and `PartnerOrganizationAccess` tables.
- Mutations validate invariants such as unique membership, valid role, existing org/user, and recoverable managerless organizations.
- Mutations validate personal-workspace visibility rules so normal solo users do not unexpectedly see team-management controls.

## Out of scope

- Stripe customer portal, invoices, payment methods, or subscription-owner self-service.
- Full SCIM/SAML/enterprise identity management.
- Full account deletion/anonymization workflow.
- OAuth account linking/unlinking beyond displaying connected providers.
- Model Eval-specific user management.
- Complex custom roles beyond `MANAGER` and `MEMBER`.
- User impersonation.
- Bulk user import/export.
- Partner-account management screens.

## Acceptance criteria

- `/account` is no longer a placeholder.
- A signed-in user can view account details and edit display name and email address.
- A signed-in local-password user can change password while signed in.
- A local-password user can request password recovery by email and complete reset with a valid token.
- A signed-in user can view meaningful organization and partner relationships without solo personal-workspace clutter.
- An organization manager can view members for an organization they manage.
- An organization manager can invite users by email, change member roles, and remove members within approved guardrails.
- Removing the final manager does not break the app; managerless organizations are recoverable by platform admins.
- Platform admin `/admin/users` links to user detail pages.
- Platform admins can view and edit user profile fields and account status.
- Platform admins can view and manage user organization memberships according to the approved scope.
- Platform admins can view platform-admin status but cannot mutate it through UI.
- Membership and user changes are audit-logged where they affect access.
- Server-side authorization prevents normal users from editing other users or unauthorized organizations.
- Suspended/deactivated users cannot sign in or continue using authenticated pages.
- Existing registration, login, admin, SLU, entitlement, and product-control flows still pass QA.

## Implementation guidance

- Start by replacing the `/account` placeholder with read-only real data, then add low-risk edits.
- Keep destructive actions guarded by confirmation and server-side invariant checks.
- Prefer existing shared auth permission helpers; add new permissions only where the current set is insufficient.
- Keep routes dense and operational, consistent with current account/admin UI conventions.
- Treat user editing as platform-level functionality, not Sounds Like Us-specific functionality.
- Add a user status field for suspension/deactivation.
- Add environment-driven SMTP configuration for invites and password recovery.
- Add Playwright coverage for self-profile edit, password recovery, org manager access control, and platform-admin user detail/edit.

## Suggested implementation slices

1. Self-account read/edit profile.
2. Email/password changes and password recovery.
3. Account status schema and enforcement.
4. Organization member list, invites, and manager-only access checks.
5. Organization member role/change/remove workflows with managerless-org recovery rules.
6. Platform-admin user detail page.
7. Platform-admin user profile, status, and membership edit workflows.
8. Audit logging and QA coverage.

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
- [ ] The next phase still makes sense or has been revised.

### Valid outcomes

- Proceed to next phase.
- Stay in this phase and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.
