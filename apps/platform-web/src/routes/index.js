import { Router } from 'express';
import { requireToolAccess, listAccessibleTools, primaryOrgIdForUser } from '@rumbo/auth';
import adminRoutes from './admin.js';
import accountRoutes from './account.js';
import authRoutes from './auth.js';
import { sluRouter } from '@rumbo/sounds-like-us';
import { evalRouter } from '@rumbo/eval';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const tools = req.isAuthenticated()
      ? await listAccessibleTools(req.user, primaryOrgIdForUser(req.user))
      : [];
    res.render('pages/home', { title: 'Rumbo', tools });
  } catch (err) {
    next(err);
  }
});

// Sounds Like Us is orgOpen and keeps a public marketing funnel, so anonymous
// visitors pass through; authenticated users are still access-checked.
router.use('/slu', requireToolAccess('slu', { allowAnonymous: true }), sluRouter);
router.use('/eval', requireToolAccess('eval'), evalRouter);
router.use('/admin', adminRoutes);
router.use('/account', accountRoutes);
router.use('/', authRoutes);

export default router;
