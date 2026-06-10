// Stripe integration — hosted Checkout + Customer Portal, webhook sync.
// Stripe is the system of record for payment state; this service mirrors the
// subscription onto OrganizationEntitlement (tier + stripe* fields) so the
// rest of the platform only ever reads the entitlement.
//
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. Without them the app runs
// fine — billing pages render an "not configured" state and the webhook 503s.

import Stripe from 'stripe';
import { db } from '@rumbo/db';
import { setOrgTier, TierKey } from './index.js';

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!isStripeConfigured()) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY).');
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export async function tierForPriceId(priceId) {
  if (!priceId) return null;
  return db.productTier.findFirst({ where: { stripePriceId: priceId, isActive: true } });
}

// Purchasable tiers (have a Stripe price configured).
export async function listPurchasableTiers() {
  return db.productTier.findMany({
    where: { isActive: true, stripePriceId: { not: null } },
    orderBy: { priceUsdMonthly: 'asc' },
  });
}

export async function createCheckoutSession({ orgId, tierKey, userEmail, baseUrl }) {
  const stripe = getStripe();
  const tier = await db.productTier.findUnique({ where: { key: tierKey } });
  if (!tier?.stripePriceId) throw new Error('That plan is not purchasable yet.');
  const entitlement = await db.organizationEntitlement.findUnique({ where: { orgId } });
  if (!entitlement) throw new Error('Organization has no entitlement record.');

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: tier.stripePriceId, quantity: 1 }],
    client_reference_id: orgId,
    ...(entitlement.stripeCustomerId
      ? { customer: entitlement.stripeCustomerId }
      : { customer_email: userEmail }),
    metadata: { orgId, tierKey },
    subscription_data: { metadata: { orgId, tierKey } },
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing/cancelled`,
  });
}

export async function createPortalSession({ orgId, returnUrl }) {
  const stripe = getStripe();
  const entitlement = await db.organizationEntitlement.findUnique({ where: { orgId } });
  if (!entitlement?.stripeCustomerId) throw new Error('No billing account exists for this organization yet.');
  return stripe.billingPortal.sessions.create({
    customer: entitlement.stripeCustomerId,
    return_url: returnUrl,
  });
}

function toDate(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

async function entitlementForSubscription(subscription) {
  const orgId = subscription.metadata?.orgId;
  if (orgId) {
    const byOrg = await db.organizationEntitlement.findUnique({ where: { orgId } });
    if (byOrg) return byOrg;
  }
  return db.organizationEntitlement.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
}

// Mirror a Stripe subscription onto the org entitlement, including the tier
// implied by its current price. Idempotent — safe for replayed events.
export async function syncEntitlementFromSubscription(subscription) {
  const entitlement = await entitlementForSubscription(subscription);
  if (!entitlement) return null;

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id ?? null;

  await db.organizationEntitlement.update({
    where: { id: entitlement.id },
    data: {
      stripeCustomerId: customerId ?? entitlement.stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeSubscriptionStatus: subscription.status,
      stripeCurrentPeriodStart: toDate(subscription.current_period_start),
      stripeCurrentPeriodEnd: toDate(subscription.current_period_end),
      stripeCancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    },
  });

  // Active/trialing subscriptions drive the tier from the price; everything
  // else leaves the tier to the deleted handler (downgrade) or admin action.
  if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
    const tier = await tierForPriceId(priceId);
    if (tier) {
      await setOrgTier({
        orgId: entitlement.orgId,
        tierKey: tier.key,
        actorId: null,
        reason: `stripe:subscription.${subscription.status}`,
      });
    }
  }

  return entitlement;
}

async function handleSubscriptionDeleted(subscription) {
  const entitlement = await entitlementForSubscription(subscription);
  if (!entitlement) return;

  await db.organizationEntitlement.update({
    where: { id: entitlement.id },
    data: {
      stripeSubscriptionStatus: 'canceled',
      stripeCancelAtPeriodEnd: false,
    },
  });
  await setOrgTier({
    orgId: entitlement.orgId,
    tierKey: TierKey.FREE,
    actorId: null,
    reason: 'stripe:subscription.deleted',
  });
}

async function handleCheckoutCompleted(session) {
  const orgId = session.client_reference_id || session.metadata?.orgId;
  if (!orgId) return;
  const entitlement = await db.organizationEntitlement.findUnique({ where: { orgId } });
  if (!entitlement) return;

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

  await db.organizationEntitlement.update({
    where: { id: entitlement.id },
    data: {
      stripeCustomerId: customerId ?? entitlement.stripeCustomerId,
      stripeSubscriptionId: subscriptionId ?? entitlement.stripeSubscriptionId,
    },
  });

  // If the session carries the expanded subscription, sync now; otherwise the
  // customer.subscription.created/updated events (sent alongside) finish it.
  if (session.subscription && typeof session.subscription === 'object') {
    await syncEntitlementFromSubscription(session.subscription);
  }
}

async function handlePaymentFailed(invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
  if (!customerId) return;
  const entitlement = await db.organizationEntitlement.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!entitlement) return;
  await db.organizationEntitlement.update({
    where: { id: entitlement.id },
    data: { stripeSubscriptionStatus: 'past_due' },
  });
}

// Dispatch a verified webhook event. Unknown event types are ignored.
export async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncEntitlementFromSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      break;
  }
  return { received: true, type: event.type };
}

// Verify the raw webhook body signature and parse the event.
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Stripe webhook is not configured (STRIPE_WEBHOOK_SECRET).');
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

// Admin-triggered immediate cancel; the subscription.deleted webhook performs
// the downgrade, but we also sync defensively in case webhooks lag.
export async function adminCancelSubscription({ orgId, actorId = null, reason = null }) {
  const stripe = getStripe();
  const entitlement = await db.organizationEntitlement.findUnique({ where: { orgId } });
  if (!entitlement?.stripeSubscriptionId) throw new Error('This organization has no Stripe subscription.');
  const subscription = await stripe.subscriptions.cancel(entitlement.stripeSubscriptionId);
  await handleSubscriptionDeleted(subscription);
  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'org.subscription_cancelled',
      targetType: 'organization',
      targetId: orgId,
      orgId,
      oldValue: { stripeSubscriptionId: entitlement.stripeSubscriptionId },
      reason,
    },
  });
  return subscription;
}
