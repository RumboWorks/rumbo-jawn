# Phase 07 — Org Entitlements, Usage Limits, and Billing Readiness

## Purpose

Add the platform foundation for product tiers, org-level usage limits, spend caps, model/provider configuration, and Stripe-ready billing data.

This phase builds on Phase 06a's identity and access model:

- users are global identities,
- every user belongs to at least one organization,
- solo users have internal solo organizations,
- partner managers may manage client organizations,
- platform admins can see and configure the platform.

The billing and limits model should be organization-centered. Users are not the billing container.

## Product defaults for this phase

Use these defaults unless the phase is explicitly revised:

- The billable unit is `Organization`.
- Solo organizations can have free/paid entitlements like any other organization, even if the UI does not emphasize org language.
- Billing responsibility can be attached to any owner/manager of an organization.
- Partner accounts can manage organizations, and partner managers may be billing-responsible for managed organizations when explicitly attached.
- Partner managers do not bypass organization limits.
- Platform admins can override limits and product controls.
- User-facing limits should be simple counts and clear availability messages, not token accounting.
- Cost controls should still enforce AI spend caps server-side, even if users do not see token/cost details.
- Initial product tiers are `Free`, `Solo`, `Team`, and `Partner`.
- Initial Sounds Like Us limit is 10 runs per 7 days.
- Being over the usage limit is a soft warning in this phase, surfaced as a small "over budget" indicator. It should not block job creation yet.

## Product questions to confirm during implementation

Confirmed answers for this phase:

- Billing responsibility can attach to any organization owner/manager.
- Tiers are `Free`, `Solo`, `Team`, and `Partner`.
- Initial Sounds Like Us limit is 10 runs per 7 days.
- Usage overages are soft warnings in Phase 07.
- Admin UI editing is deferred to Phase 07b. Phase 07 should use DB-backed defaults, seeds, and/or support scripts for tuning.

## What this phase delivers

### Data model

- Product tier records.
- Organization subscription/entitlement records, including optional billing-responsible user/member references.
- Organization-level usage counter records by tool, usage key, and period.
- Organization-level spend cap records or fields.
- DB-backed AI model/provider configuration by call type, with optional org/tier overrides if feasible.
- DB-backed feature flags or product controls scoped by platform, tier, organization, and tool.
- Stripe-ready fields such as customer ID, subscription ID, price ID, subscription status, current period dates, and cancel-at-period-end.
- Admin audit log for changes to limits, tiers, model/provider config, feature flags, and billing-related org state.

### Enforcement

- Evaluate basic org-level usage limits before creating tool jobs.
- Record soft overage state without blocking job creation.
- Enforce org spend caps inside the shared AI call path before making provider calls.
- Record usage in a way that supports monthly limits and future billing reporting.
- Preserve org context for every enforced tool action.
- Make enforcement server-side; client UI should not be trusted for limits.

### Admin/config

- Admin can inspect an organization's tier, effective limits, usage, spend, and relevant billing fields.
- Admin can inspect limits and model choices.
- DB-backed config plus documented support scripts can tune initial limits and model choices.
- Admin UI editing of limits, tiers, billing responsibility, feature flags, and model choices is deferred to Phase 07b.
- Admin changes that affect product access or cost are audit-logged.
- Existing central admin pages should surface enough limit/billing context to debug blocked orgs.

### Tool integration

- Sounds Like Us job creation checks org entitlements before enqueueing `slu.analysis`.
- Sounds Like Us should show a small "over budget" indicator when an org is above the configured usage budget.
- Sounds Like Us should still allow job creation while the Phase 07 overage policy is soft.
- Tool-specific limit keys should be namespaced, for example `slu.analysis.rolling_7d`.
- Shared services should remain generic so Model Eval can later add its own keys without changing the billing architecture.

## Out of scope

- Full Stripe checkout, customer portal, webhook processing, invoicing, or payment collection unless this phase is explicitly revised.
- Model Eval billing implementation.
- Partner-sponsored billing flows, unless explicitly added after answering the partner billing question.
- Complex user-facing token accounting.
- Usage-based metered billing.
- Tax, coupons, trials, discounts, invoices, dunning, and revenue recognition.
- Fully polished paid-plan marketing pages.
- Admin UI editing of billing, limits, product controls, and model config; this moves to Phase 07b.

## Acceptance criteria

- Platform can evaluate basic organization-level usage limits for Sounds Like Us.
- Sounds Like Us shows a small over-budget indicator when an org has exceeded 10 runs in 7 days.
- Sounds Like Us still allows job creation while the overage policy is soft.
- Platform can enforce an organization-level AI spend cap before provider calls.
- Usage records are queryable by organization, tool, usage key, and rolling or fixed period.
- Admin can inspect each organization's tier, effective limits, usage, and spend.
- Initial limits and model choices can be tuned through a documented safe non-UI mechanism.
- Stripe-ready schema/config exists without requiring live Stripe automation.
- Feature flags/product controls can be scoped without hard-coding Sounds Like Us-only behavior.
- Product access changes are audit-logged.
- User-facing over-budget messaging is simple and does not expose token math.
- Partner manager access does not bypass organization limits.
- Billing responsibility can be represented for an owner/manager attached to an organization.

## Implementation guidance

- Prefer shared packages/services for entitlements, usage, billing readiness, and AI config.
- Keep Sounds Like Us integration thin: ask shared services for budget status, show a warning if over budget, and continue creating the job while Phase 07 policy is soft.
- Do not put billing logic inside Sounds Like Us internals.
- Do not use permanent user roles as billing state.
- Keep paid/free/tier data attached to organizations.
- Treat platform-admin overrides as explicit configuration, not invisible bypass behavior.
- Do not implement admin edit forms in Phase 07; capture those in Phase 07b.
- Keep schema names generic enough for sibling tools.
- Use Prisma schema changes and a clean dev DB reset if appropriate; current dev data remains disposable unless the user says otherwise.

## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Relevant commands/checks were run.
- [x] Manual QA notes are recorded.
- [x] New commands are documented in `docs/reference/usage.md`, if commands exist.
- [x] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [x] Roadmap items are checked off, added, or moved.
- [x] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [x] Working notes created during this phase were promoted, linked, archived, or deleted.
- [x] No unplanned files were added directly under `docs/`.
- [x] The next phase still makes sense or has been revised.

### Valid outcomes

- Proceed to next phase.
- Stay in this phase and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.
