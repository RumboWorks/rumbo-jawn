import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('pages/account/index', { title: 'Account' });
});

export default router;
