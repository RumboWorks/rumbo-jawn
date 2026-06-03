import { Router } from 'express';
import {
  listCriteria, getCriterion, createCriterion, updateCriterion, archiveCriterion,
  listProviders, listOrgModels, getOrgModel, createOrgModel, updateOrgModel, archiveOrgModel,
  getDashboardSummary,
} from './settings.service.js';

const router = Router();

const ACCESS_METHODS = ['PLATFORM_API', 'ORGANIZATION_API', 'MANUAL'];

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// The whole router is mounted behind requireToolAccess('eval'), so req.toolRole
// and req.toolOrgId are already set. Manager-only routes add this guard.
function requireManager(req, res, next) {
  if (req.toolRole === 'MANAGER') return next();
  return res.status(403).render('pages/error', {
    status: 403,
    message: 'Manager access is required for this action.',
  });
}

function takeFlash(req) {
  const flash = { error: req.session.flash_error ?? null, success: req.session.flash_success ?? null };
  delete req.session.flash_error;
  delete req.session.flash_success;
  return flash;
}

const isAjax = req => req.xhr || (req.get('X-Requested-With') === 'XMLHttpRequest');

// Render a row partial to an HTML string for an AJAX response.
function renderRow(res, view, locals) {
  return new Promise((resolve, reject) => {
    res.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

// ---- Landing / dashboard ----

router.get('/', asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.toolOrgId);
  res.render('pages/eval/index', {
    tool: 'eval',
    title: 'Eval',
    toolRole: req.toolRole,
    summary,
    flash: takeFlash(req),
  });
}));

// ---- Settings: evaluation criteria ----

router.get('/settings/criteria', requireManager, asyncHandler(async (req, res) => {
  const criteria = await listCriteria(req.toolOrgId);
  res.render('pages/eval/settings-criteria', {
    tool: 'eval',
    title: 'Eval criteria',
    toolRole: req.toolRole,
    criteria,
    flash: takeFlash(req),
  });
}));

router.get('/settings/criteria/new', requireManager, (req, res) => {
  res.render('pages/eval/criteria-new', {
    tool: 'eval',
    title: 'Add criterion',
    toolRole: req.toolRole,
    flash: takeFlash(req),
  });
});

router.post('/settings/criteria', requireManager, asyncHandler(async (req, res) => {
  const title = (req.body.title ?? '').trim();
  if (!title) {
    req.session.flash_error = 'A criterion needs a title.';
    return res.redirect('/eval/settings/criteria/new');
  }
  await createCriterion(req.toolOrgId, {
    title,
    description: (req.body.description ?? '').trim(),
    createdByUserId: req.user.id,
  });
  req.session.flash_success = 'Criterion added.';
  res.redirect('/eval/settings/criteria');
}));

router.post('/settings/criteria/:id', requireManager, asyncHandler(async (req, res) => {
  const title = (req.body.title ?? '').trim();
  if (!title) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: 'A criterion needs a title.' });
    req.session.flash_error = 'A criterion needs a title.';
    return res.redirect('/eval/settings/criteria');
  }
  await updateCriterion(req.toolOrgId, req.params.id, {
    title,
    description: (req.body.description ?? '').trim(),
  });
  if (isAjax(req)) {
    const c = await getCriterion(req.toolOrgId, req.params.id);
    const rowHtml = await renderRow(res, 'pages/eval/_criterion-row', { c });
    return res.json({ ok: true, rowHtml });
  }
  req.session.flash_success = 'Criterion updated.';
  res.redirect('/eval/settings/criteria');
}));

router.post('/settings/criteria/:id/archive', requireManager, asyncHandler(async (req, res) => {
  await archiveCriterion(req.toolOrgId, req.params.id);
  if (isAjax(req)) return res.json({ ok: true, removed: true });
  req.session.flash_success = 'Criterion archived.';
  res.redirect('/eval/settings/criteria');
}));

// ---- Settings: model catalog ----

router.get('/settings/models', requireManager, asyncHandler(async (req, res) => {
  const models = await listOrgModels(req.toolOrgId);
  res.render('pages/eval/settings-models', {
    tool: 'eval',
    title: 'Eval models',
    toolRole: req.toolRole,
    models,
    accessMethods: ACCESS_METHODS,
    flash: takeFlash(req),
  });
}));

router.get('/settings/models/new', requireManager, asyncHandler(async (req, res) => {
  const providers = await listProviders();
  res.render('pages/eval/models-new', {
    tool: 'eval',
    title: 'Add model',
    toolRole: req.toolRole,
    providers,
    accessMethods: ACCESS_METHODS,
    flash: takeFlash(req),
  });
}));

function readModelForm(req) {
  return {
    displayName: (req.body.displayName ?? '').trim(),
    accessMethod: ACCESS_METHODS.includes(req.body.accessMethod) ? req.body.accessMethod : null,
    providerId: (req.body.providerId ?? '').trim() || null,
    providerModelId: (req.body.providerModelId ?? '').trim() || null,
    notes: (req.body.notes ?? '').trim(),
  };
}

router.post('/settings/models', requireManager, asyncHandler(async (req, res) => {
  const form = readModelForm(req);
  if (!form.displayName || !form.accessMethod) {
    req.session.flash_error = 'A model needs a display name and access method.';
    return res.redirect('/eval/settings/models/new');
  }
  await createOrgModel(req.toolOrgId, { ...form, createdByUserId: req.user.id });
  req.session.flash_success = 'Model added.';
  res.redirect('/eval/settings/models');
}));

router.post('/settings/models/:id', requireManager, asyncHandler(async (req, res) => {
  const form = readModelForm(req);
  if (!form.displayName || !form.accessMethod) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: 'A model needs a display name and access method.' });
    req.session.flash_error = 'A model needs a display name and access method.';
    return res.redirect('/eval/settings/models');
  }
  await updateOrgModel(req.toolOrgId, req.params.id, form);
  if (isAjax(req)) {
    const model = await getOrgModel(req.toolOrgId, req.params.id);
    const rowHtml = await renderRow(res, 'pages/eval/_model-row', { model, accessMethods: ACCESS_METHODS });
    return res.json({ ok: true, rowHtml });
  }
  req.session.flash_success = 'Model updated.';
  res.redirect('/eval/settings/models');
}));

router.post('/settings/models/:id/archive', requireManager, asyncHandler(async (req, res) => {
  await archiveOrgModel(req.toolOrgId, req.params.id);
  if (isAjax(req)) return res.json({ ok: true, removed: true });
  req.session.flash_success = 'Model removed.';
  res.redirect('/eval/settings/models');
}));

export default router;
