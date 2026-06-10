import { Router } from 'express';
import { requireToolAccess, requireVerified, listAccessibleTools, loadActiveOrganization, setActiveOrganization } from '@rumbo/auth';
import adminRoutes from './admin.js';
import accountRoutes from './account.js';
import authRoutes from './auth.js';
import partnerRoutes from './partner.js';
import billingRoutes from './billing.js';
import { sluRouter } from '@rumbo/sounds-like-us';
import { evalRouter, evalShareRouter } from '@rumbo/eval';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const organization = req.isAuthenticated() ? await loadActiveOrganization(req) : null;
    const tools = req.isAuthenticated()
      ? await listAccessibleTools(req.user, organization?.id)
      : [];
    res.render('pages/home', { title: 'Rumbo', tools, organization });
  } catch (err) {
    next(err);
  }
});

router.post('/organization/switch', async (req, res, next) => {
  try {
    await setActiveOrganization(req, req.body.orgId);
    const redirectTo = req.body.returnTo || '/';
    if (req.session) {
      return req.session.save(() => res.redirect(redirectTo));
    }
    return res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
});

// Sounds Like Us is orgOpen and keeps a public marketing funnel, so anonymous
// visitors pass through; authenticated users are still access-checked.
// requireVerified passes anonymous requests and blocks signed-in unverified
// accounts (they're parked at /auth/verify-pending until the email link).
router.use('/slu', requireVerified, requireToolAccess('slu', { allowAnonymous: true }), sluRouter);
// Public tokenized report share — mounted before the gated /eval router.
router.use('/eval/share', evalShareRouter);
router.use('/eval', requireVerified, requireToolAccess('eval'), evalRouter);
router.use('/admin', requireVerified, adminRoutes);
router.use('/partner', requireVerified, partnerRoutes);
router.use('/billing', billingRoutes);
router.use('/account', requireVerified, accountRoutes);
router.use('/', authRoutes);

export default router;
