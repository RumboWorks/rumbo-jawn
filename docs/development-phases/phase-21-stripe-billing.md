# Phase 21 — Stripe Billing

## Purpose

Paid tiers become purchasable: Stripe-hosted Checkout for upgrades, the Customer Portal for card changes / plan switches / self-cancel, webhooks syncing subscription state onto the entitlement model the platform already reads. Plus the admin levers: suspend, cancel, and the existing delete guard. Part of the finish-line plan (decision log 2026-06-10: hosted surfaces, minimal code/PCI footprint).

## What this phase delivers

- **Schema (additive):** `ProductTier.stripePriceId` + `priceUsdMonthly`; `Organization.suspendedAt` + `suspendedReason`. The `OrganizationEntitlement` stripe fields (present since phase 07) are now live.
- **`packages/billing/src/stripe-service.js`:** lazy Stripe client, `createCheckoutSession` (price from `ProductTier.stripePriceId`, `client_reference_id`/metadata = orgId), `createPortalSession`, `verifyWebhookSignature`, `handleWebhookEvent`, `syncEntitlementFromSubscription` (idempotent; tier follows the subscription's price for active/trialing/past_due), `adminCancelSubscription`. Subscription deletion downgrades the org to free (`setOrgTier`, audited with a `stripe:` reason). `invoice.payment_failed` marks `past_due`.
- **Webhook:** `POST /billing/webhook` mounted in `src/index.js` with `express.raw` BEFORE the global `express.json()` (signature verification needs the raw buffer). 503 when unconfigured; 400 on bad signatures.
- **`/billing`** (`src/routes/billing.js` + `pages/account/billing.twig`): current plan/status/renewal, `past_due` warning, the signup `intendedTier` nudge, upgrade buttons (Checkout) or "Manage billing" (Portal). Permission: org managers, partner managers, platform admins, billing-responsible users — and personal SOLO workspace owners (deliberately MEMBERs since phase 08b, but the workspace is theirs to pay for). "Billing" added to the account sidebar.
- **Suspension:** `adminSetOrgSuspension` (audited); suspended orgs resolve no tool access for anyone except platform admins (`tool-access-service`); admin org detail gains Stripe-billing and Suspension panels; immediate-cancel button; org delete remains blocked while a subscription is active (cancel first).
- **Dunning policy (recorded):** Stripe Smart Retries + Stripe-hosted dunning emails; no custom dunning (deferred-work).
- `.env.example` documents `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (and the email vars, previously undocumented).

## Activation checklist (when real Stripe keys exist — pending, tracked for phase 09)

1. Create Products/Prices in Stripe; set each `ProductTier.stripePriceId` + `priceUsdMonthly`.
2. Configure the Customer Portal (allowed price switches, cancel-at-period-end).
3. Set env keys; add the webhook endpoint in Stripe pointing at `/billing/webhook`.
4. Test-mode end-to-end: `stripe listen --forward-to localhost:4000/billing/webhook`, checkout with a test card, portal plan switch, portal cancel, `stripe trigger invoice.payment_failed`.

## Out of scope

- Custom dunning emails, proration policy, seat limits (deferred-work).
- Partner-tier billing nuance beyond the recorded model (one subscription on the partner's primary org; client orgs stay free).

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass (configured-Stripe paths verified at the service level; live checkout pends real keys per the activation checklist).
- [x] Schema applied additively; `db:generate` run; real data preserved.
- [x] New routes/env documented in `docs/reference/usage.md` and `.env.example`.
- [x] Roadmap items are checked off.
- [x] The next phase still makes sense.

### Closeout notes

- QA additions: billing page renders for a personal-workspace owner (unconfigured state); webhook 503s without config; `handleWebhookEvent` tested directly — `customer.subscription.updated` with a QA price flips the tier and mirrors all stripe fields, `customer.subscription.deleted` downgrades to free; suspension blocks `/slu` with 403 and unsuspension restores it. Suite: 35/35 passing.
- Verification: additive SQL via `prisma db execute`; `db:generate`; build; `pm2 restart rumbo-web`; `npm run qa` 35/35.

Next phase recommendation: Proceed to Phase 22 — Context-Sensitive Help and Help & FAQ.
