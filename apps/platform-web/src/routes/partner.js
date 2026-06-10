// Partner self-service area: partner managers see their accounts, create and
// manage client organizations, and manage partner co-managers.
// Mounted at /partner behind requirePartnerManager (req.partnerAccounts set).

import { Router } from 'express';
import {
  addPartnerMember,
  archivePartnerManagedOrg,
  createPartnerManagedOrg,
  getPartnerDashboard,
  getPartnerManagedOrg,
  removePartnerMember,
  requirePartnerManager,
  updatePartnerManagedOrg,
} from '@rumbo/auth';

const router = Router();

router.use(requirePartnerManager);

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const isAjax = req => req.xhr || (req.get('X-Requested-With') === 'XMLHttpRequest');

function renderRow(res, view, locals) {
  return new Promise((resolve, reject) => {
    res.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

function takeFlash(req) {
  const flash = {
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  };
  delete req.session.flash_error;
  delete req.session.flash_success;
  return flash;
}

// The actor must manage the partner account named in the request (platform
// admins pass; req.partnerAccounts comes from the middleware).
function managesAccount(req, partnerAccountId) {
  return req.user.isPlatformAdmin || req.partnerAccounts.some(account => account.id === partnerAccountId);
}

router.get('/', asyncHandler(async (req, res) => {
  const accounts = await getPartnerDashboard(req.user);
  res.render('pages/partner/index', {
    title: 'Partner',
    accounts,
    ...takeFlash(req),
  });
}));

router.get('/orgs/new', asyncHandler(async (req, res) => {
  const accounts = await getPartnerDashboard(req.user);
  res.render('pages/partner/org-new', {
    title: 'New client organization',
    accounts,
    ...takeFlash(req),
  });
}));

router.post('/orgs', asyncHandler(async (req, res) => {
  try {
    if (!managesAccount(req, req.body.partnerAccountId)) {
      throw new Error('You do not manage that partner account.');
    }
    await createPartnerManagedOrg({
      partnerAccountId: req.body.partnerAccountId,
      name: req.body.name,
      organizationType: req.body.organizationType || 'NONPROFIT',
      actor: req.user,
    });
    req.session.flash_success = 'Organization created.';
    return res.redirect('/partner');
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect('/partner/orgs/new');
  }
}));

router.post('/orgs/:orgId', asyncHandler(async (req, res) => {
  try {
    await updatePartnerManagedOrg({
      orgId: req.params.orgId,
      name: req.body.name,
      organizationType: req.body.organizationType,
      actor: req.user,
    });
    if (isAjax(req)) {
      const org = await getPartnerManagedOrg(req.user, req.params.orgId);
      const rowHtml = await renderRow(res, 'pages/partner/_org-row', { org });
      return res.json({ ok: true, rowHtml });
    }
    req.session.flash_success = 'Organization updated.';
  } catch (err) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: err.message });
    req.session.flash_error = err.message;
  }
  res.redirect('/partner');
}));

router.post('/orgs/:orgId/archive', asyncHandler(async (req, res) => {
  try {
    const { orgDeleted } = await archivePartnerManagedOrg({
      orgId: req.params.orgId,
      actor: req.user,
    });
    req.session.flash_success = orgDeleted
      ? 'Organization archived and removed (it had no direct members).'
      : 'Organization removed from your partner account. It continues independently.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/partner');
}));

router.post('/accounts/:partnerAccountId/members', asyncHandler(async (req, res) => {
  try {
    if (!managesAccount(req, req.params.partnerAccountId)) {
      throw new Error('You do not manage that partner account.');
    }
    await addPartnerMember({
      partnerAccountId: req.params.partnerAccountId,
      email: req.body.email,
      actorId: req.user.id,
    });
    req.session.flash_success = 'Partner manager added.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/partner');
}));

router.post('/accounts/:partnerAccountId/members/:membershipId/remove', asyncHandler(async (req, res) => {
  try {
    if (!managesAccount(req, req.params.partnerAccountId)) {
      throw new Error('You do not manage that partner account.');
    }
    await removePartnerMember({
      partnerMembershipId: req.params.membershipId,
      partnerAccountId: req.params.partnerAccountId,
      blockUserId: req.user.isPlatformAdmin ? null : req.user.id,
      actorId: req.user.id,
    });
    req.session.flash_success = 'Partner manager removed.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/partner');
}));

export default router;
