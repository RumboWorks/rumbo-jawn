import { Router } from 'express';
import {
  listCriteria, createCriterion, updateCriterion, archiveCriterion,
  listProviders, listOrgModels, createOrgModel, updateOrgModel, archiveOrgModel,
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

router.post('/settings/criteria', requireManager, asyncHandler(async (req, res) => {
  const title = (req.body.title ?? '').trim();
  if (!title) {
    req.session.flash_error = 'A criterion needs a title.';
  } else {
    await createCriterion(req.toolOrgId, {
      title,
      description: (req.body.description ?? '').trim(),
      createdByUserId: req.user.id,
    });
    req.session.flash_success = 'Criterion added.';
  }
  res.redirect('/eval/settings/criteria');
}));

router.post('/settings/criteria/:id', requireManager, asyncHandler(async (req, res) => {
  const title = (req.body.title ?? '').trim();
  if (!title) {
    req.session.flash_error = 'A criterion needs a title.';
  } else {
    await updateCriterion(req.toolOrgId, req.params.id, {
      title,
      description: (req.body.description ?? '').trim(),
    });
    req.session.flash_success = 'Criterion updated.';
  }
  res.redirect('/eval/settings/criteria');
}));

router.post('/settings/criteria/:id/archive', requireManager, asyncHandler(async (req, res) => {
  await archiveCriterion(req.toolOrgId, req.params.id);
  req.session.flash_success = 'Criterion archived.';
  res.redirect('/eval/settings/criteria');
}));

// ---- Settings: model catalog ----

router.get('/settings/models', requireManager, asyncHandler(async (req, res) => {
  const [models, providers] = await Promise.all([
    listOrgModels(req.toolOrgId),
    listProviders(),
  ]);
  res.render('pages/eval/settings-models', {
    tool: 'eval',
    title: 'Eval models',
    toolRole: req.toolRole,
    models,
    providers,
    accessMethods: ACCESS_METHODS,
    flash: takeFlash(req),
  });
}));

function readModelForm(req) {
  const displayName = (req.body.displayName ?? '').trim();
  const accessMethod = ACCESS_METHODS.includes(req.body.accessMethod) ? req.body.accessMethod : null;
  return {
    displayName,
    accessMethod,
    providerId: (req.body.providerId ?? '').trim() || null,
    providerModelId: (req.body.providerModelId ?? '').trim() || null,
    notes: (req.body.notes ?? '').trim(),
  };
}

router.post('/settings/models', requireManager, asyncHandler(async (req, res) => {
  const form = readModelForm(req);
  if (!form.displayName || !form.accessMethod) {
    req.session.flash_error = 'A model needs a display name and access method.';
  } else {
    await createOrgModel(req.toolOrgId, { ...form, createdByUserId: req.user.id });
    req.session.flash_success = 'Model added.';
  }
  res.redirect('/eval/settings/models');
}));

router.post('/settings/models/:id', requireManager, asyncHandler(async (req, res) => {
  const form = readModelForm(req);
  if (!form.displayName || !form.accessMethod) {
    req.session.flash_error = 'A model needs a display name and access method.';
  } else {
    await updateOrgModel(req.toolOrgId, req.params.id, form);
    req.session.flash_success = 'Model updated.';
  }
  res.redirect('/eval/settings/models');
}));

router.post('/settings/models/:id/archive', requireManager, asyncHandler(async (req, res) => {
  await archiveOrgModel(req.toolOrgId, req.params.id);
  req.session.flash_success = 'Model removed.';
  res.redirect('/eval/settings/models');
}));

export default router;
