// Help & FAQ pages plus the context API the help drawer fetches.

import { Router } from 'express';
import { requireAuth, requireVerified } from '@rumbo/auth';
import { getTool, isToolKey, listTools } from '@rumbo/config';
import { articlesForContext, listPublishedArticles } from '../services/help-service.js';

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.use(requireAuth, requireVerified);

router.get('/', asyncHandler(async (req, res) => {
  const articles = await listPublishedArticles(null);
  res.render('pages/help/index', {
    title: 'Help & FAQ',
    heading: 'Help & FAQ',
    articles,
    tools: listTools(),
    toolKey: null,
  });
}));

// JSON for the help drawer: ?key=<contextKey> (tool fallback inside).
router.get('/api/context', asyncHandler(async (req, res) => {
  const { articles, matched } = await articlesForContext(req.query.key);
  res.json({
    matched,
    articles: articles.map(a => ({ title: a.title, html: a.html })),
  });
}));

router.get('/:toolKey', asyncHandler(async (req, res) => {
  if (!isToolKey(req.params.toolKey)) {
    return res.status(404).render('pages/error', { status: 404, message: 'No help for that tool.' });
  }
  const tool = getTool(req.params.toolKey);
  const articles = await listPublishedArticles(tool.key);
  res.render('pages/help/index', {
    title: `${tool.name} help — Rumbo`,
    heading: `${tool.name} — Help & FAQ`,
    articles,
    tools: listTools(),
    toolKey: tool.key,
  });
}));

export default router;
