# Phase 07b — Admin UI for Entitlements and Product Controls

## Purpose

Add admin UI editing for the billing, limits, feature flag, model/provider, and product-control foundations created in Phase 07.

Phase 07 creates the data model, shared services, soft over-budget indicators, spend-cap enforcement, and non-UI tuning mechanism. Phase 07b turns those controls into explicit admin workflows.

Do not start this phase until Phase 07 is finished, approved, and committed.

## What this phase delivers

### Organization controls

- Admin can view and edit an organization's tier: `Free`, `Solo`, `Team`, or `Partner`.
- Admin can assign or change billing responsibility to an eligible organization owner/manager.
- Admin can view and adjust org-level usage budgets.
- Admin can view and adjust org-level spend caps.
- Admin can see effective limits, current usage, over-budget state, spend, and billing-responsible person in one organization detail surface.

### Product and feature controls

- Admin can view and edit feature flags/product controls scoped by platform, tier, organization, and tool.
- Admin can inspect which setting wins when platform defaults, tier settings, and org overrides conflict.
- Admin can disable or re-enable a tool for a specific organization.

### AI/provider controls

- Admin can view model/provider config by call type.
- Admin can edit model/provider defaults and supported overrides.
- Admin UI should warn when a model/provider change could affect cost or availability.

### Auditability

- Every admin change to tier, billing responsibility, usage budget, spend cap, feature flag, or model/provider config is audit-logged.
- Audit log entries should include actor, target, old value, new value, timestamp, and reason/comment when provided.
- Admin can inspect recent product-control audit entries.

### UX expectations

- Keep the UI operational and dense, consistent with the Phase 06b admin surfaces.
- Prefer explicit forms, selects, toggles, and confirmation states.
- Avoid destructive actions unless there is a clear confirmation path.
- Use simple language around limits: "Over budget", "Budget", "Runs used", "Spend cap".

## Out of scope

- Stripe checkout, webhooks, invoices, payment collection, customer portal, coupons, discounts, taxes, and dunning.
- Fully automated billing lifecycle.
- Model Eval product-specific billing UI.
- Partner self-service billing dashboards.
- End-user plan upgrade flows.

## Acceptance criteria

- Admin can edit an organization's tier and billing-responsible owner/manager.
- Admin can edit usage budgets and spend caps.
- Admin can edit at least initial model/provider config through UI.
- Admin can edit feature flags/product controls without hard-coding Sounds Like Us-only behavior.
- Admin can inspect effective settings for an organization.
- Product-control changes are audit-logged and visible to admins.
- Phase 07's non-UI tuning path still works as a fallback.

## Implementation guidance

- Build on Phase 07 shared services rather than duplicating billing logic in admin routes.
- Use server-side authorization for all admin mutations.
- Validate that billing-responsible users are eligible organization owners/managers.
- Keep partner manager billing responsibility explicit; partner management access alone should not imply payment responsibility.
- Keep mutation endpoints small and auditable.
- Add Playwright coverage for at least one tier edit, one limit edit, and one audit-log entry.

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
