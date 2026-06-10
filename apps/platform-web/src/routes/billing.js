// Billing for the active organization: hosted Stripe Checkout to upgrade,
// hosted Customer Portal for card changes / plan switches / self-cancel.
// The webhook (exported separately, mounted with a raw body parser before
// express.json) mirrors Stripe state onto the entitlement.

import { Router } from 'express';
import {
  buildAbsoluteUrl,
  can,
  loadActiveOrganization,
  Permission,
  requireAuth,
  requireVerified,
  resolveRole,
} from '@rumbo/auth';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
  isStripeConfigured,
  listPurchasableTiers,
  verifyWebhookSignature,
} from '@rumbo/billing';
import { db } from '@rumbo/db';

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function takeFlash(req) {
  const flash = {
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  };
  delete req.session.flash_error;
  delete req.session.flash_success;
  return flash;
}

// Billing is manager territory: org managers, partner managers, platform
// admins, or the designated billing-responsible user. Personal SOLO
// workspaces are the exception — their owner is deliberately a MEMBER
// (phase 08b hides org-management UI), but the workspace is theirs to pay for.
async function billingContext(req) {
  const organization = await loadActiveOrganization(req);
  if (!organization) return { organization: null, allowed: false };
  const role = await resolveRole(req.user, organization.id);
  const entitlement = await db.organizationEntitlement.findUnique({
    where: { orgId: organization.id },
    include: { tier: true },
  });
  const allowed = can(role, Permission.EDIT_ORG)
    || entitlement?.billingResponsibleUserId === req.user.id
    || (organization.organizationType === 'SOLO' && role !== null);
  return { organization, entitlement, allowed };
}

router.use(requireAuth, requireVerified);

router.get('/', asyncHandler(async (req, res) => {
  const { organization, entitlement, allowed } = await billingContext(req);
  if (!organization || !allowed) {
    return res.status(403).render('pages/error', { status: 403, message: 'Billing is managed by organization managers.' });
  }
  const purchasableTiers = await listPurchasableTiers();
  res.render('pages/account/billing', {
    title: 'Billing',
    organization,
    entitlement,
    purchasableTiers,
    intendedTier: entitlement?.overrides?.intendedTier ?? null,
    stripeConfigured: isStripeConfigured(),
    hasSubscription: Boolean(entitlement?.stripeSubscriptionId
      && !['canceled', 'incomplete_expired'].includes(entitlement?.stripeSubscriptionStatus ?? '')),
    ...takeFlash(req),
  });
}));

router.post('/checkout', asyncHandler(async (req, res) => {
  const { organization, allowed } = await billingContext(req);
  if (!organization || !allowed) {
    return res.status(403).render('pages/error', { status: 403, message: 'Billing is managed by organization managers.' });
  }
  try {
    const session = await createCheckoutSession({
      orgId: organization.id,
      tierKey: req.body.tierKey,
      userEmail: req.user.email,
      baseUrl: buildAbsoluteUrl('').replace(/\/$/, ''),
    });
    return res.redirect(303, session.url);
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect('/billing');
  }
}));

router.post('/portal', asyncHandler(async (req, res) => {
  const { organization, allowed } = await billingContext(req);
  if (!organization || !allowed) {
    return res.status(403).render('pages/error', { status: 403, message: 'Billing is managed by organization managers.' });
  }
  try {
    const session = await createPortalSession({
      orgId: organization.id,
      returnUrl: buildAbsoluteUrl('/billing'),
    });
    return res.redirect(303, session.url);
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect('/billing');
  }
}));

router.get('/success', (req, res) => {
  req.session.flash_success = 'Payment set up — your plan activates as soon as Stripe confirms it (usually seconds).';
  res.redirect('/billing');
});

router.get('/cancelled', (req, res) => {
  req.session.flash_error = 'Checkout was cancelled. No changes were made.';
  res.redirect('/billing');
});

export default router;

// Raw-body webhook handler — mounted in src/index.js BEFORE express.json so
// stripe.webhooks.constructEvent receives the unparsed buffer.
export async function handleStripeWebhook(req, res) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'webhook not configured' });
  }
  let event;
  try {
    event = verifyWebhookSignature(req.body, req.get('stripe-signature'));
  } catch (err) {
    return res.status(400).json({ error: `signature verification failed: ${err.message}` });
  }
  try {
    const result = await handleWebhookEvent(event);
    return res.json(result);
  } catch (err) {
    console.error('stripe webhook handler error', err);
    return res.status(500).json({ error: 'webhook handler error' });
  }
}
