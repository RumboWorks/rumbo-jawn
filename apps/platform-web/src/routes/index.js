import { Router } from 'express';
import adminRoutes from './admin.js';
import accountRoutes from './account.js';
import authRoutes from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Rumbo' });
});

// Placeholder tool route — feature behavior added in Phase 04+
router.get('/slu', (req, res) => {
  res.render('pages/placeholder', { title: 'Sounds Like Us', tool: 'sounds-like-us' });
});

router.use('/admin', adminRoutes);
router.use('/account', accountRoutes);
router.use('/', authRoutes);

export default router;
