import { Router } from 'express';
import { createJob } from '@rumbo/jobs';
import { getUsageBudgetStatus, UsageKey } from '@rumbo/billing';
import {
  listCriteria, getCriterion, createCriterion, updateCriterion, archiveCriterion,
  listProviders, listOrgModels, getOrgModel, createOrgModel, updateOrgModel, archiveOrgModel,
  getDashboardSummary,
} from './settings.service.js';
import {
  listEvals, getEvalRow, getEvalByPublicId, createEval, updateEval, archiveEval,
  launchRun, getRunByPublicId, getResponseByPublicId, saveManualResponse,
  setRunStatus, summarizeResponses, isLiveCollectable,
} from './evals.service.js';

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

// ---- Evaluations ----

router.get('/evals', requireManager, asyncHandler(async (req, res) => {
  const evals = await listEvals(req.toolOrgId);
  res.render('pages/eval/evals', {
    tool: 'eval',
    title: 'Evaluations',
    toolRole: req.toolRole,
    evals,
    flash: takeFlash(req),
  });
}));

router.get('/evals/new', requireManager, (req, res) => {
  res.render('pages/eval/eval-new', {
    tool: 'eval',
    title: 'New evaluation',
    toolRole: req.toolRole,
    flash: takeFlash(req),
  });
});

router.post('/evals', requireManager, asyncHandler(async (req, res) => {
  const title = (req.body.title ?? '').trim();
  if (!title) {
    req.session.flash_error = 'An evaluation needs a title.';
    return res.redirect('/eval/evals/new');
  }
  const ev = await createEval(req.toolOrgId, {
    title,
    description: (req.body.description ?? '').trim(),
    createdByUserId: req.user.id,
  });
  // Flow straight into launching the first run rather than dropping back to the
  // listing. (Authoring UX, incl. the multi-step wizard, is a tracked refinement.)
  req.session.flash_success = 'Evaluation created. Set up its first run.';
  res.redirect(`/eval/evals/${ev.publicId}/runs/new`);
}));

router.post('/evals/:publicId', requireManager, asyncHandler(async (req, res) => {
  const title = (req.body.title ?? '').trim();
  if (!title) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: 'An evaluation needs a title.' });
    req.session.flash_error = 'An evaluation needs a title.';
    return res.redirect('/eval/evals');
  }
  await updateEval(req.toolOrgId, req.params.publicId, { title, description: (req.body.description ?? '').trim() });
  if (isAjax(req)) {
    const ev = await getEvalRow(req.toolOrgId, req.params.publicId);
    const rowHtml = await renderRow(res, 'pages/eval/_eval-row', { ev });
    return res.json({ ok: true, rowHtml });
  }
  req.session.flash_success = 'Evaluation updated.';
  res.redirect('/eval/evals');
}));

router.post('/evals/:publicId/archive', requireManager, asyncHandler(async (req, res) => {
  await archiveEval(req.toolOrgId, req.params.publicId);
  if (isAjax(req)) return res.json({ ok: true, removed: true });
  req.session.flash_success = 'Evaluation archived.';
  res.redirect('/eval/evals');
}));

router.get('/evals/:publicId', requireManager, asyncHandler(async (req, res) => {
  const ev = await getEvalByPublicId(req.toolOrgId, req.params.publicId);
  if (!ev) return res.status(404).render('pages/error', { status: 404, message: 'Evaluation not found.' });
  res.render('pages/eval/eval-detail', {
    tool: 'eval',
    title: ev.title,
    toolRole: req.toolRole,
    eval: ev,
    flash: takeFlash(req),
  });
}));

// ---- Run creation ----

router.get('/evals/:publicId/runs/new', requireManager, asyncHandler(async (req, res) => {
  const ev = await getEvalByPublicId(req.toolOrgId, req.params.publicId);
  if (!ev) return res.status(404).render('pages/error', { status: 404, message: 'Evaluation not found.' });
  const [criteria, models] = await Promise.all([
    listCriteria(req.toolOrgId),
    listOrgModels(req.toolOrgId),
  ]);
  res.render('pages/eval/run-new', {
    tool: 'eval',
    title: `New run · ${ev.title}`,
    toolRole: req.toolRole,
    eval: ev,
    criteria,
    models,
    flash: takeFlash(req),
  });
}));

router.post('/evals/:publicId/runs', requireManager, asyncHandler(async (req, res) => {
  const ev = await getEvalByPublicId(req.toolOrgId, req.params.publicId);
  if (!ev) return res.status(404).render('pages/error', { status: 404, message: 'Evaluation not found.' });

  const promptText = (req.body.promptText ?? '').trim();
  const criterionIds = [].concat(req.body.criterionIds ?? []).filter(Boolean);
  const modelIds = [].concat(req.body.modelIds ?? []).filter(Boolean);

  if (!promptText || criterionIds.length === 0 || modelIds.length === 0) {
    req.session.flash_error = 'A run needs a prompt, at least one criterion, and at least one model.';
    return res.redirect(`/eval/evals/${ev.publicId}/runs/new`);
  }

  const run = await launchRun(req.toolOrgId, ev.id, {
    promptText,
    criterionIds,
    modelIds,
    hideModelNames: req.body.hideModelNames === 'on',
    hidePeerReviews: req.body.hidePeerReviews === 'on',
    reviewClosesAt: (req.body.reviewClosesAt ?? '').trim() || null,
    launchedByUserId: req.user.id,
  });
  req.session.flash_success = `Run ${run.runNumber} launched. Collect responses below.`;
  res.redirect(`/eval/runs/${run.publicId}`);
}));

// ---- Run status & lifecycle ----

router.get('/runs/:publicId', requireManager, asyncHandler(async (req, res) => {
  const run = await getRunByPublicId(req.toolOrgId, req.params.publicId);
  if (!run) return res.status(404).render('pages/error', { status: 404, message: 'Run not found.' });
  const budget = await getUsageBudgetStatus(req.toolOrgId, { tool: 'eval', usageKey: UsageKey.EVAL_RESPONSE_COLLECTION });
  // Annotate each response with whether it can be collected via API (Twig can't
  // call helper functions on the snapshot directly).
  run.responses = run.responses.map(r => ({
    ...r,
    collected: r.responseText != null && r.responseText !== '',
    liveCollectable: isLiveCollectable(r.modelSnapshot),
  }));
  res.render('pages/eval/run-status', {
    tool: 'eval',
    title: `Run ${run.runNumber} · ${run.eval.title}`,
    toolRole: req.toolRole,
    run,
    progress: summarizeResponses(run),
    budget,
    flash: takeFlash(req),
  });
}));

router.post('/runs/:publicId/status', requireManager, asyncHandler(async (req, res) => {
  const run = await getRunByPublicId(req.toolOrgId, req.params.publicId);
  if (!run) return res.status(404).render('pages/error', { status: 404, message: 'Run not found.' });
  try {
    await setRunStatus(req.toolOrgId, run.id, req.body.status);
    req.session.flash_success = 'Run status updated.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/eval/runs/${run.publicId}`);
}));

// ---- Response collection ----

router.get('/responses/:publicId/manual', requireManager, asyncHandler(async (req, res) => {
  const response = await getResponseByPublicId(req.toolOrgId, req.params.publicId);
  if (!response) return res.status(404).render('pages/error', { status: 404, message: 'Response not found.' });
  res.render('pages/eval/response-manual', {
    tool: 'eval',
    title: 'Enter response',
    toolRole: req.toolRole,
    response,
    flash: takeFlash(req),
  });
}));

router.post('/responses/:publicId/manual', requireManager, asyncHandler(async (req, res) => {
  const response = await getResponseByPublicId(req.toolOrgId, req.params.publicId);
  if (!response) return res.status(404).render('pages/error', { status: 404, message: 'Response not found.' });
  const text = (req.body.responseText ?? '').trim();
  if (!text) {
    req.session.flash_error = 'Response text is required.';
    return res.redirect(`/eval/responses/${response.publicId}/manual`);
  }
  await saveManualResponse(req.toolOrgId, response.id, { text, userId: req.user.id });
  req.session.flash_success = 'Response saved.';
  res.redirect(`/eval/runs/${response.evalRun.publicId}`);
}));

router.post('/responses/:publicId/collect', requireManager, asyncHandler(async (req, res) => {
  const response = await getResponseByPublicId(req.toolOrgId, req.params.publicId);
  if (!response) return res.status(404).render('pages/error', { status: 404, message: 'Response not found.' });
  if (!isLiveCollectable(response.modelSnapshot)) {
    req.session.flash_error = `${response.modelSnapshot.displayName} cannot be collected via API; enter it manually.`;
    return res.redirect(`/eval/runs/${response.evalRun.publicId}`);
  }
  await createJob('eval.collectResponse', { responseId: response.id }, { userId: req.user.id, orgId: req.toolOrgId });
  req.session.flash_success = `Collecting ${response.modelSnapshot.displayName} via API…`;
  res.redirect(`/eval/runs/${response.evalRun.publicId}`);
}));

export default router;
