import { Router } from 'express';
import {
  adminAddUserMembership,
  adminRemoveToolGrant,
  adminRemoveUserMembership,
  adminUpdateUser,
  adminUpsertToolGrant,
  createOrgInvite,
  removeMembership,
  requirePlatformAdmin,
  Role,
  setMembershipRole,
} from '@rumbo/auth';
import {
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
  listAdminOrganizations,
  listAdminUsers,
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

router.get('/users', asyncHandler(async (req, res) => {
  const users = await listAdminUsers();
  res.render('pages/admin/users', {
    title: 'Admin users',
    active: 'users',
    users,
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

router.get('/orgs', asyncHandler(async (req, res) => {
  const orgs = await listAdminOrganizations();
  res.render('pages/admin/orgs', {
    title: 'Admin organizations',
    active: 'orgs',
    orgs,
  });
}));

router.get('/orgs/:orgId', asyncHandler(async (req, res) => {
  const org = await getAdminOrganizationDetail(req.params.orgId);
  if (!org) return res.status(404).render('pages/error', { status: 404, message: 'Organization not found' });
  res.render('pages/admin/org-detail', {
    title: `${org.name} admin`,
    active: 'orgs',
    org,
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
  });
}));

export default router;
