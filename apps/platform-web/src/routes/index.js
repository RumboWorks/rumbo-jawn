import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Rumbo' });
});

// Placeholder tool routes — feature behavior added in Phase 04+
router.get('/slu', (req, res) => {
  res.render('pages/placeholder', { title: 'Sounds Like Us', tool: 'sounds-like-us' });
});

export default router;
