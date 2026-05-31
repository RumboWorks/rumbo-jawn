import { Router } from 'express';
import adminRoutes from './admin.js';
import accountRoutes from './account.js';
import authRoutes from './auth.js';
import { sluRouter } from '@rumbo/sounds-like-us';

const router = Router();

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Rumbo' });
});

router.use('/slu', sluRouter);
router.use('/admin', adminRoutes);
router.use('/account', accountRoutes);
router.use('/', authRoutes);

export default router;
