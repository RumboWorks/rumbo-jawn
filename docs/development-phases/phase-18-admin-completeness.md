# Phase 18 — Admin Completeness and Act-as-Org

## Purpose

Platform admins can add/edit/remove everything without wandering through tool front-ends: org lifecycle, full partner-account CRUD (previously schema-only with no UI anywhere), audited act-as-org support access, and targeted destructive panels for tool data. Part of the finish-line plan (decision log 2026-06-10).

## What this phase delivers

- **Org lifecycle:** `GET/POST /admin/orgs/new` creates an org + entitlement (`adminCreateOrganization` in new `packages/auth/src/org-admin-service.js`); `POST /admin/orgs/:orgId/delete` soft-deletes (`deletedAt`) with typed-name confirmation, blocked while a Stripe subscription is active. Audit-logged (`org.created`, `org.deleted`).
- **Partner account CRUD:** `/admin/partners` (list), `/admin/partners/new`, `/admin/partners/:partnerId` (edit details, add/remove partner managers by existing-user email, grant/revoke `PartnerOrganizationAccess`). New `packages/auth/src/partner-service.js` holds all mutations (audit-logged) and is reused by the phase-19 `/partner` area.
- **Act-as-org:** platform admins can switch their active org to any org via "Act as this organization" on the admin org detail. A persistent warning banner (`partials/acting-as-banner.twig`, both layouts) shows the acted-as org with a "Return to my organization" action; the switch writes an `admin.act_as_org` audit entry; the acted-as org is appended to the org switcher while active.
- **Tool-data panels:** `GET /admin/eval` lists runs across all orgs with permanent cascade delete (`deleteEvalRunCascade` exported from `@rumbo/eval` — notifications removed explicitly since they reference the run by scalar id; everything else cascades). `POST /admin/jobs/:jobId/purge-artifacts` deletes stored artifact files + manifest rows, keeping the job record (`purgeJobArtifacts` in admin-service).
- **Admin flash messages:** new `pages/admin/_flash.twig` partial; mutation routes set session flash and redirect.

## Bugs found and fixed along the way

- **Act-as-org never actually worked.** `listAccessibleOrganizations` used `OR: [{}, …]` intending "platform admins match all orgs", but Prisma drops the empty object — admins could only switch into membership/partner orgs. Fixed by keeping the accessible list membership-scoped (it feeds the switcher) and adding a direct platform-admin lookup in `resolveActiveOrganization`. Caught by the new QA test.
- **`ensureOrgEntitlement` create race.** Concurrent requests for an org with no entitlement both attempted the create; the loser threw P2002 and 500'd the page. Now catches P2002 and reads the winner's row.
- **Flaky admin users-sort assertion.** The QA test re-sorted rendered name+email strings with JS `localeCompare` and expected MySQL's email-collation order — divergent on punctuation-vs-digit ordering. Now asserts against the database's own ordering.

## Out of scope

- Partner self-service screens (phase 19 — services are ready).
- Org suspend and subscription cancel (phase 21, Stripe).
- SLU/Eval admin panels beyond destructive ops — admins use act-as-org and the tool's own manager UI for content edits.

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Relevant commands/checks were run.
- [x] New routes are documented in `docs/reference/usage.md`.
- [x] Roadmap items are checked off.
- [x] No unplanned files were added directly under `docs/`.
- [x] The next phase still makes sense.

### Closeout notes

- New QA test drives the full loop end-to-end: admin creates an org → acts as it (banner + audit row asserted) → returns → creates a partner account → adds itself as manager → grants the org → opens `/admin/eval` → deletes the org with typed-name confirm. Suite: 30/30 passing.
- Admin view templates (org-new, partners, partner-new, partner-detail, eval-runs, `_flash`) were drafted by a lower-cost sub-agent from a markup spec and reviewed before landing — first use of the delegation approach agreed 2026-06-10.
- Verification: `npm run build`, `pm2 restart rumbo-web`, `npm run qa` (30/30).

Next phase recommendation: Proceed to Phase 19 — Partner Self-Service Area.
