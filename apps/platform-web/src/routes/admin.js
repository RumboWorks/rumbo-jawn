import { Router } from 'express';
import {
  addPartnerMember,
  adminAddUserMembership,
  adminCreateOrganization,
  adminRemoveToolGrant,
  adminRemoveUserMembership,
  adminSetOrgSuspension,
  adminSoftDeleteOrganization,
  adminUpdateUser,
  adminUpsertToolGrant,
  createOrgInvite,
  createPartnerAccount,
  getPartnerAccountDetail,
  grantPartnerOrgAccess,
  listPartnerAccounts,
  removeMembership,
  removePartnerMember,
  requirePlatformAdmin,
  revokePartnerOrgAccess,
  Role,
  setMembershipRole,
  updatePartnerAccount,
} from '@rumbo/auth';
import { deleteEvalRunCascade, listEvalRunsForAdmin, PURGE_AFTER_DAYS, restoreEvalRun, trashEvalRun } from '@rumbo/eval';
import { listTools } from '@rumbo/config';
import {
  deleteHelpArticle,
  getHelpArticle,
  listHelpArticlesForAdmin,
  previewMarkdown,
  setHelpArticlePublished,
  upsertHelpArticle,
} from '../services/help-service.js';
import {
  adminCancelSubscription,
  setOrgBillingResponsible,
  setOrgSpendCap,
  setOrgSluBudget,
  setOrgTier,
  upsertAiModelConfig,
  upsertFeatureFlag,
} from '@rumbo/billing';
import {
  getAdminDashboard,
  getAdminAiModelConfig,
  getAdminFeatureFlag,
  getAdminJobDetail,
  getAdminOrganizationDetail,
  getAdminProductControls,
  getAdminUserDetail,
  listAdminAuditLogs,
  listAdminAiCalls,
  listAdminJobs,
  auditAdminAction,
  listAdminOrganizations,
  listAdminOrgOptions,
  listAdminProductTiers,
  listAdminUsers,
  purgeJobArtifacts,
} from '../services/admin-service.js';

const router = Router();

router.use(requirePlatformAdmin);

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function redirectBack(req, res, fallback) {
  res.redirect(req.get('Referer') || fallback);
}

router.get('/', asyncHandler(async (req, res) => {
  const dashboard = await getAdminDashboard();
  res.render('pages/admin/index', {
    title: 'Admin',
    active: 'dashboard',
    dashboard,
  });
}));

const USER_SORT_KEYS = ['email', 'isPlatformAdmin', 'jobs', 'createdAt'];

router.get('/users', asyncHandler(async (req, res) => {
  const q = (req.query.q ?? '').trim();
  const requestedPage = parseInt(req.query.page, 10) || 1;
  const sort = USER_SORT_KEYS.includes(req.query.sort) ? req.query.sort : null;
  const dir = req.query.dir === 'desc' ? 'desc' : 'asc';
  const { users, total, page, pageCount, pageSize } = await listAdminUsers({
    search: q || undefined,
    page: requestedPage,
    sort,
    dir,
  });
  res.render('pages/admin/users', {
    title: 'Admin users',
    active: 'users',
    users,
    q,
    sort,
    dir,
    total,
    page,
    pageCount,
    pageSize,
  });
}));

router.get('/users/:userId', asyncHandler(async (req, res) => {
  const userDetail = await getAdminUserDetail(req.params.userId);
  if (!userDetail) return res.status(404).render('pages/error', { status: 404, message: 'User not found' });
  res.render('pages/admin/user-detail', {
    title: `${userDetail.email} admin`,
    active: 'users',
    userDetail,
  });
}));

router.post('/users/:userId/profile', asyncHandler(async (req, res) => {
  await adminUpdateUser({
    userId: req.params.userId,
    actorId: req.user.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    status: req.body.status,
    statusReason: req.body.statusReason || null,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/users/${req.params.userId}`);
}));

router.post('/users/:userId/memberships', asyncHandler(async (req, res) => {
  await adminAddUserMembership({
    userId: req.params.userId,
    orgId: req.body.orgId,
    role: req.body.role || 'MEMBER',
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/users/${req.params.userId}`);
}));

router.post('/users/:userId/memberships/:membershipId/remove', asyncHandler(async (req, res) => {
  await adminRemoveUserMembership({
    membershipId: req.params.membershipId,
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/users/${req.params.userId}`);
}));

router.post('/users/:userId/tool-grants', asyncHandler(async (req, res) => {
  await adminUpsertToolGrant({
    userId: req.params.userId,
    orgId: req.body.orgId,
    tool: req.body.tool,
    role: req.body.role || 'MEMBER',
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/users/${req.params.userId}`);
}));

router.post('/users/:userId/tool-grants/:grantId/remove', asyncHandler(async (req, res) => {
  await adminRemoveToolGrant({
    grantId: req.params.grantId,
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/users/${req.params.userId}`);
}));

function takeFlash(req) {
  const flash = {
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  };
  delete req.session.flash_error;
  delete req.session.flash_success;
  return flash;
}

router.get('/orgs', asyncHandler(async (req, res) => {
  const orgs = await listAdminOrganizations();
  res.render('pages/admin/orgs', {
    title: 'Admin organizations',
    active: 'orgs',
    orgs,
    ...takeFlash(req),
  });
}));

router.get('/orgs/new', asyncHandler(async (req, res) => {
  const tiers = await listAdminProductTiers();
  res.render('pages/admin/org-new', {
    title: 'New organization',
    active: 'orgs',
    tiers,
    ...takeFlash(req),
  });
}));

router.post('/orgs', asyncHandler(async (req, res) => {
  try {
    const org = await adminCreateOrganization({
      name: req.body.name,
      organizationType: req.body.organizationType || 'NONPROFIT',
      tierKey: req.body.tierKey || null,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Organization created.';
    return res.redirect(`/admin/orgs/${org.id}`);
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect('/admin/orgs/new');
  }
}));

router.post('/orgs/:orgId/suspend', asyncHandler(async (req, res) => {
  try {
    await adminSetOrgSuspension({
      orgId: req.params.orgId,
      suspend: true,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Organization suspended — tool access is blocked.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/unsuspend', asyncHandler(async (req, res) => {
  try {
    await adminSetOrgSuspension({
      orgId: req.params.orgId,
      suspend: false,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Organization unsuspended.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/cancel-subscription', asyncHandler(async (req, res) => {
  try {
    await adminCancelSubscription({
      orgId: req.params.orgId,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Subscription cancelled; the organization drops to the free tier.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/delete', asyncHandler(async (req, res) => {
  try {
    await adminSoftDeleteOrganization({
      orgId: req.params.orgId,
      confirmName: req.body.confirmName,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Organization deleted.';
    return res.redirect('/admin/orgs');
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect(`/admin/orgs/${req.params.orgId}`);
  }
}));

router.get('/orgs/:orgId', asyncHandler(async (req, res) => {
  const org = await getAdminOrganizationDetail(req.params.orgId);
  if (!org) return res.status(404).render('pages/error', { status: 404, message: 'Organization not found' });
  res.render('pages/admin/org-detail', {
    title: `${org.name} admin`,
    active: 'orgs',
    org,
    ...takeFlash(req),
  });
}));

router.post('/orgs/:orgId/tier', asyncHandler(async (req, res) => {
  await setOrgTier({
    orgId: req.params.orgId,
    tierKey: req.body.tierKey,
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/billing-responsible', asyncHandler(async (req, res) => {
  await setOrgBillingResponsible({
    orgId: req.params.orgId,
    membershipId: req.body.membershipId || null,
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/usage-budget', asyncHandler(async (req, res) => {
  await setOrgSluBudget({
    orgId: req.params.orgId,
    limit: req.body.limit,
    windowDays: req.body.windowDays,
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/spend-cap', asyncHandler(async (req, res) => {
  await setOrgSpendCap({
    orgId: req.params.orgId,
    aiSpendCapUsd: req.body.aiSpendCapUsd,
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/invites', asyncHandler(async (req, res) => {
  await createOrgInvite({
    orgId: req.params.orgId,
    email: req.body.email,
    role: req.body.role || 'MEMBER',
    invitedByUserId: req.user.id,
    actorRole: Role.PLATFORM_ADMIN,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/memberships/:membershipId/role', asyncHandler(async (req, res) => {
  await setMembershipRole({
    orgId: req.params.orgId,
    membershipId: req.params.membershipId,
    role: req.body.role,
    actorId: req.user.id,
    actorRole: Role.PLATFORM_ADMIN,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

router.post('/orgs/:orgId/memberships/:membershipId/remove', asyncHandler(async (req, res) => {
  await removeMembership({
    orgId: req.params.orgId,
    membershipId: req.params.membershipId,
    actorId: req.user.id,
    actorRole: Role.PLATFORM_ADMIN,
    reason: req.body.reason || null,
  });
  redirectBack(req, res, `/admin/orgs/${req.params.orgId}`);
}));

// ---- Partner accounts ----

router.get('/partners', asyncHandler(async (req, res) => {
  const partners = await listPartnerAccounts();
  res.render('pages/admin/partners', {
    title: 'Partner accounts',
    active: 'partners',
    partners,
    ...takeFlash(req),
  });
}));

router.get('/partners/new', asyncHandler(async (req, res) => {
  res.render('pages/admin/partner-new', {
    title: 'New partner account',
    active: 'partners',
    ...takeFlash(req),
  });
}));

router.post('/partners', asyncHandler(async (req, res) => {
  try {
    const partner = await createPartnerAccount({
      name: req.body.name,
      supportEmail: req.body.supportEmail || null,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Partner account created.';
    return res.redirect(`/admin/partners/${partner.id}`);
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect('/admin/partners/new');
  }
}));

router.get('/partners/:partnerId', asyncHandler(async (req, res) => {
  const partner = await getPartnerAccountDetail(req.params.partnerId);
  if (!partner) return res.status(404).render('pages/error', { status: 404, message: 'Partner account not found' });
  const orgOptions = await listAdminOrgOptions();
  res.render('pages/admin/partner-detail', {
    title: `${partner.name} partner`,
    active: 'partners',
    partner,
    orgOptions,
    ...takeFlash(req),
  });
}));

router.post('/partners/:partnerId', asyncHandler(async (req, res) => {
  try {
    await updatePartnerAccount({
      partnerAccountId: req.params.partnerId,
      name: req.body.name,
      supportEmail: req.body.supportEmail || null,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Partner account updated.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/partners/${req.params.partnerId}`);
}));

router.post('/partners/:partnerId/members', asyncHandler(async (req, res) => {
  try {
    await addPartnerMember({
      partnerAccountId: req.params.partnerId,
      email: req.body.email,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Partner manager added.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/partners/${req.params.partnerId}`);
}));

router.post('/partners/:partnerId/members/:membershipId/remove', asyncHandler(async (req, res) => {
  try {
    await removePartnerMember({
      partnerMembershipId: req.params.membershipId,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Partner manager removed.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/partners/${req.params.partnerId}`);
}));

router.post('/partners/:partnerId/org-access', asyncHandler(async (req, res) => {
  try {
    await grantPartnerOrgAccess({
      partnerAccountId: req.params.partnerId,
      orgId: req.body.orgId,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Organization access granted.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/partners/${req.params.partnerId}`);
}));

router.post('/partners/:partnerId/org-access/:accessId/remove', asyncHandler(async (req, res) => {
  try {
    await revokePartnerOrgAccess({
      accessId: req.params.accessId,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = 'Organization access revoked.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/partners/${req.params.partnerId}`);
}));

// ---- Help & FAQ content ----

router.get('/help', asyncHandler(async (req, res) => {
  const tool = req.query.tool === '' ? null : (req.query.tool ?? undefined);
  const articles = await listHelpArticlesForAdmin({ tool });
  res.render('pages/admin/help-articles', {
    title: 'Help articles',
    active: 'help',
    articles,
    toolFilter: req.query.tool ?? '',
    tools: listTools(),
    ...takeFlash(req),
  });
}));

router.get('/help/new', asyncHandler(async (req, res) => {
  res.render('pages/admin/help-article-edit', {
    title: 'New help article',
    active: 'help',
    article: null,
    tools: listTools(),
    ...takeFlash(req),
  });
}));

router.post('/help/preview', asyncHandler(async (req, res) => {
  res.json({ html: previewMarkdown(req.body.bodyMarkdown ?? '') });
}));

router.post('/help', asyncHandler(async (req, res) => {
  try {
    const article = await upsertHelpArticle({
      id: req.body.id || null,
      tool: req.body.tool || null,
      slug: req.body.slug,
      title: req.body.title,
      bodyMarkdown: req.body.bodyMarkdown,
      contextKeys: req.body.contextKeys,
      navOrder: req.body.navOrder,
      isPublished: req.body.isPublished === 'on',
    });
    await auditAdminAction({
      actorId: req.user.id,
      action: req.body.id ? 'help.article_updated' : 'help.article_created',
      targetType: 'help_article',
      targetId: article.id,
      newValue: { tool: article.tool, slug: article.slug, title: article.title, isPublished: article.isPublished },
    });
    req.session.flash_success = 'Help article saved.';
    return res.redirect(`/admin/help/${article.id}`);
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect(req.body.id ? `/admin/help/${req.body.id}` : '/admin/help/new');
  }
}));

router.post('/help/:articleId/publish', asyncHandler(async (req, res) => {
  try {
    const article = await setHelpArticlePublished(req.params.articleId, req.body.publish === '1');
    await auditAdminAction({
      actorId: req.user.id,
      action: article.isPublished ? 'help.article_published' : 'help.article_unpublished',
      targetType: 'help_article',
      targetId: article.id,
    });
    req.session.flash_success = article.isPublished ? 'Article published.' : 'Article unpublished.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/admin/help');
}));

router.post('/help/:articleId/delete', asyncHandler(async (req, res) => {
  try {
    const article = await deleteHelpArticle(req.params.articleId);
    await auditAdminAction({
      actorId: req.user.id,
      action: 'help.article_deleted',
      targetType: 'help_article',
      targetId: req.params.articleId,
      oldValue: { tool: article.tool, slug: article.slug, title: article.title },
    });
    req.session.flash_success = 'Article deleted.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/admin/help');
}));

router.get('/help/:articleId', asyncHandler(async (req, res) => {
  const article = await getHelpArticle(req.params.articleId);
  if (!article) return res.status(404).render('pages/error', { status: 404, message: 'Help article not found' });
  res.render('pages/admin/help-article-edit', {
    title: `${article.title} — help article`,
    active: 'help',
    article,
    tools: listTools(),
    ...takeFlash(req),
  });
}));

// ---- Eval data (cross-org destructive ops) ----

router.get('/eval', asyncHandler(async (req, res) => {
  const allRuns = await listEvalRunsForAdmin();
  res.render('pages/admin/eval-runs', {
    title: 'Eval runs',
    active: 'eval',
    runs: allRuns.filter(run => !run.deletedAt),
    trashedRuns: allRuns.filter(run => run.deletedAt),
    purgeAfterDays: PURGE_AFTER_DAYS,
    ...takeFlash(req),
  });
}));

router.post('/eval/runs/:runId/trash', asyncHandler(async (req, res) => {
  try {
    const { run, evalArchived } = await trashEvalRun({ runId: req.params.runId });
    await auditAdminAction({
      actorId: req.user.id,
      action: 'eval.run_trashed',
      targetType: 'eval_run',
      targetId: req.params.runId,
      orgId: run.organizationId,
      oldValue: { evalTitle: run.eval.title, runNumber: run.runNumber, status: run.status },
      newValue: { evalArchived },
      reason: req.body.reason || null,
    });
    req.session.flash_success = `Moved run ${run.runNumber} of "${run.eval.title}" to the trash`
      + `${evalArchived ? ' (its evaluation had no other runs and was archived)' : ''}.`;
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/admin/eval');
}));

router.post('/eval/runs/:runId/restore', asyncHandler(async (req, res) => {
  try {
    const { run, evalRestored } = await restoreEvalRun({ runId: req.params.runId });
    await auditAdminAction({
      actorId: req.user.id,
      action: 'eval.run_restored',
      targetType: 'eval_run',
      targetId: req.params.runId,
      orgId: run.organizationId,
      newValue: { evalTitle: run.eval.title, runNumber: run.runNumber, evalRestored },
      reason: req.body.reason || null,
    });
    req.session.flash_success = `Restored run ${run.runNumber} of "${run.eval.title}".`;
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/admin/eval');
}));

router.post('/eval/runs/:runId/purge', asyncHandler(async (req, res) => {
  try {
    const run = await deleteEvalRunCascade({ runId: req.params.runId });
    await auditAdminAction({
      actorId: req.user.id,
      action: 'eval.run_deleted',
      targetType: 'eval_run',
      targetId: req.params.runId,
      orgId: run.organizationId,
      oldValue: { evalTitle: run.eval.title, runNumber: run.runNumber, status: run.status },
      reason: req.body.reason || null,
    });
    req.session.flash_success = `Permanently deleted run ${run.runNumber} of "${run.eval.title}".`;
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/admin/eval');
}));

router.get('/product-controls', asyncHandler(async (req, res) => {
  const controls = await getAdminProductControls();
  res.render('pages/admin/product-controls', {
    title: 'Product controls',
    active: 'product-controls',
    controls,
  });
}));

router.get('/product-controls/ai-model-config/new', asyncHandler(async (req, res) => {
  res.render('pages/admin/ai-model-config-edit', {
    title: 'New AI model config',
    active: 'product-controls',
    config: null,
  });
}));

router.get('/product-controls/ai-model-config/:configId', asyncHandler(async (req, res) => {
  const config = await getAdminAiModelConfig(req.params.configId);
  if (!config) return res.status(404).render('pages/error', { status: 404, message: 'AI model config not found' });
  res.render('pages/admin/ai-model-config-edit', {
    title: `${config.callType} model config`,
    active: 'product-controls',
    config,
  });
}));

router.post('/product-controls/feature-flags', asyncHandler(async (req, res) => {
  const flag = await upsertFeatureFlag({
    id: req.body.id || null,
    key: req.body.key,
    scope: req.body.scope || 'platform',
    scopeId: req.body.scopeId || '',
    tool: req.body.tool || '',
    enabled: req.body.enabled === 'on',
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  res.redirect(`/admin/product-controls/feature-flags/${flag.id}`);
}));

router.post('/product-controls/ai-model-config', asyncHandler(async (req, res) => {
  const config = await upsertAiModelConfig({
    id: req.body.id || null,
    tool: req.body.tool || 'platform',
    callType: req.body.callType,
    provider: req.body.provider,
    model: req.body.model,
    scope: req.body.scope || 'platform',
    scopeId: req.body.scopeId || '',
    temperature: req.body.temperature || null,
    maxTokens: req.body.maxTokens || null,
    enabled: req.body.enabled === 'on',
    actorId: req.user.id,
    reason: req.body.reason || null,
  });
  res.redirect(`/admin/product-controls/ai-model-config/${config.id}`);
}));

router.get('/product-controls/feature-flags/new', asyncHandler(async (req, res) => {
  res.render('pages/admin/feature-flag-edit', {
    title: 'New feature flag',
    active: 'product-controls',
    flag: null,
  });
}));

router.get('/product-controls/feature-flags/:flagId', asyncHandler(async (req, res) => {
  const flag = await getAdminFeatureFlag(req.params.flagId);
  if (!flag) return res.status(404).render('pages/error', { status: 404, message: 'Feature flag not found' });
  res.render('pages/admin/feature-flag-edit', {
    title: `${flag.key} feature flag`,
    active: 'product-controls',
    flag,
  });
}));

router.get('/audit-log', asyncHandler(async (req, res) => {
  const auditLogs = await listAdminAuditLogs();
  res.render('pages/admin/audit-log', {
    title: 'Audit log',
    active: 'audit-log',
    auditLogs,
  });
}));

router.get('/jobs', asyncHandler(async (req, res) => {
  const type = typeof req.query.type === 'string' && req.query.type.trim() ? req.query.type.trim() : null;
  const status = typeof req.query.status === 'string' && req.query.status.trim() ? req.query.status.trim() : null;
  const jobs = await listAdminJobs({ type, status });
  res.render('pages/admin/jobs', {
    title: 'Admin jobs',
    active: 'jobs',
    jobs,
    filters: { type, status },
    breadcrumbLabel: 'jobs',
    breadcrumbHref: '/admin/jobs',
  });
}));

router.get('/sounds-like-us', asyncHandler(async (req, res) => {
  const jobs = await listAdminJobs({ type: 'slu.analysis' });
  res.render('pages/admin/jobs', {
    title: 'Sounds Like Us runs',
    active: 'slu',
    jobs,
    filters: { type: 'slu.analysis', status: null },
    pageHeading: 'Sounds Like Us runs',
    pageDescription: 'Recent Sounds Like Us analyses shown through the shared platform job records.',
    breadcrumbLabel: 'slu runs',
    breadcrumbHref: '/admin/sounds-like-us',
  });
}));

router.get('/ai-calls', asyncHandler(async (req, res) => {
  const aiCalls = await listAdminAiCalls();
  res.render('pages/admin/ai-calls', {
    title: 'Admin AI calls',
    active: 'ai-calls',
    aiCalls,
  });
}));

router.get('/failures', asyncHandler(async (req, res) => {
  const jobs = await listAdminJobs({ status: 'FAILED' });
  res.render('pages/admin/jobs', {
    title: 'Admin failures',
    active: 'failures',
    jobs,
    filters: { type: null, status: 'FAILED' },
    pageHeading: 'Failures',
    pageDescription: 'Jobs that ended in a failed state, newest first.',
    breadcrumbLabel: 'failures',
    breadcrumbHref: '/admin/failures',
  });
}));

router.post('/jobs/:jobId/purge-artifacts', asyncHandler(async (req, res) => {
  try {
    const { purged } = await purgeJobArtifacts({
      jobId: req.params.jobId,
      actorId: req.user.id,
      reason: req.body.reason || null,
    });
    req.session.flash_success = `Purged ${purged} artifact${purged === 1 ? '' : 's'}.`;
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect(`/admin/jobs/${req.params.jobId}`);
}));

router.get('/jobs/:jobId/debug', asyncHandler(async (req, res) => {
  const job = await getAdminJobDetail(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json({
    id: job.id,
    type: job.type,
    status: job.status,
    user: job.user ? { id: job.user.id, email: job.user.email, name: job.user.name } : null,
    org: job.org ? { id: job.org.id, publicId: job.org.publicId, name: job.org.name, slug: job.org.slug } : null,
    payload: job.payload,
    result: job.result,
    errorMsg: job.errorMsg,
    aiCalls: job.aiCalls,
    artifacts: job.artifacts,
  });
}));

router.get('/jobs/:jobId', asyncHandler(async (req, res) => {
  const job = await getAdminJobDetail(req.params.jobId);
  if (!job) {
    return res.status(404).render('pages/error', { status: 404, message: 'Job not found' });
  }

  res.render('pages/admin/job-detail', {
    title: `Job ${job.id}`,
    active: 'jobs',
    job,
    ...takeFlash(req),
  });
}));

export default router;
