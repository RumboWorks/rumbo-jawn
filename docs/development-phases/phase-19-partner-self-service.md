# Phase 19 — Partner Self-Service Area

## Purpose

Partner managers (agencies/consultants) manage their client organizations themselves at `/partner` — previously the partner model existed only in the schema and access precedence, with no UI anywhere. Part of the finish-line plan (decision log 2026-06-10).

## What this phase delivers

- **Middleware:** `requirePartnerManager` (`packages/auth/src/middleware.js`) — passes platform admins or users with a MANAGER `PartnerMembership`; loads `req.partnerAccounts`.
- **Routes** (`apps/platform-web/src/routes/partner.js`, mounted at `/partner`):
  - `GET /partner` — dashboard: per-account client-org list (inline-edit rows per the platform convention) and partner co-manager management.
  - `GET /partner/orgs/new` + `POST /partner/orgs` — create a client org (org + free entitlement + `PartnerOrganizationAccess`).
  - `POST /partner/orgs/:orgId` — inline edit name/type (content-negotiated `{ok, rowHtml}`).
  - `POST /partner/orgs/:orgId/archive` — revokes partner access; soft-deletes the org only when it has zero direct members (it otherwise continues independently). Confirmation dialog.
  - `POST /partner/accounts/:id/members` (+ `/remove`) — co-manager add by existing-user email / remove, with a self-removal lockout guard and a membership-belongs-to-account assertion.
- **Services** (`packages/auth/src/partner-service.js` additions): `getPartnerDashboard`, `getPartnerManagedOrg`, `createPartnerManagedOrg`, `updatePartnerManagedOrg`, `archivePartnerManagedOrg`, all authorization-checked against the actor's managed accounts and audit-logged.
- **Nav:** "Partner" header link for partner managers (`res.locals.isPartnerManager` from the already-loaded `partnerMemberships` — no extra query).
- **Billing model decision (recorded in the plan):** one subscription per PartnerAccount on the partner's primary org; managed client orgs stay free-tier. Phase 21 implements it.

## Out of scope

- Partner branding (logo/color fields exist on the schema, no UI).
- Partner-tier signup creating the PartnerAccount (phase 20).
- Org-member management inside client orgs — partner managers already resolve manager-level access through the existing precedence and use the org's own screens via the org switcher.

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] New routes are documented in `docs/reference/usage.md`.
- [x] Roadmap items are checked off.
- [x] No unplanned files were added directly under `docs/`.
- [x] The next phase still makes sense.

### Closeout notes

- Partner view templates were drafted by a lower-cost sub-agent from a markup spec (second use of the delegation approach) and reviewed before landing.
- QA test drives the full loop: nav link visibility → empty dashboard → create client org → inline-edit it over fetch → add/remove a co-manager → archive (org removed, having no members) → 403 for non-partner users. Suite: 31/31 passing.
- Verification: `pm2 restart rumbo-web`; `npm run qa` (31/31).

Next phase recommendation: Proceed to Phase 20 — Email Verification and Public Signup.
