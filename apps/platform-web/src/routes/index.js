import { Router } from 'express';
import { requireToolAccess, listAccessibleTools, loadActiveOrganization, setActiveOrganization } from '@rumbo/auth';
import adminRoutes from './admin.js';
import accountRoutes from './account.js';
import authRoutes from './auth.js';
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
    res.redirect(req.body.returnTo || '/');
  } catch (err) {
    next(err);
  }
});

// Sounds Like Us is orgOpen and keeps a public marketing funnel, so anonymous
// visitors pass through; authenticated users are still access-checked.
router.use('/slu', requireToolAccess('slu', { allowAnonymous: true }), sluRouter);
// Public tokenized report share — mounted before the gated /eval router.
router.use('/eval/share', evalShareRouter);
router.use('/eval', requireToolAccess('eval'), evalRouter);
router.use('/admin', adminRoutes);
router.use('/account', accountRoutes);
router.use('/', authRoutes);

export default router;
