// Public, tokenized report share — mounted OUTSIDE requireToolAccess so it is
// reachable without signing in. Read-only; model names are always hidden
// (reveal: false) and the lookup is by share token only.

import { Router } from 'express';
import { getReportByShareToken } from './review.service.js';

const router = Router();

router.get('/:token', async (req, res, next) => {
  try {
    const data = await getReportByShareToken(req.params.token);
    if (!data) {
      return res.status(404).render('pages/error', { status: 404, message: 'This shared report is not available.' });
    }
    res.render('pages/eval/report-share', {
      tool: 'eval',
      title: 'Shared report',
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
