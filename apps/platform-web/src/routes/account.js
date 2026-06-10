import { Router } from 'express';
import {
  acceptInvite,
  changeOwnPassword,
  createOrgInvite,
  deleteOwnAccount,
  getAccountOverview,
  getManagedOrganization,
  loadActiveOrganization,
  removeMembership,
  requireAuth,
  resolveRole,
  setMembershipRole,
  updateOwnProfile,
  updateNavigationOrientation,
} from '@rumbo/auth';
import { getUsageBudgetStatus, UsageKey } from '@rumbo/billing';

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function redirectBack(req, res, fallback) {
  res.redirect(req.get('Referer') || fallback);
}

const isAjax = req => req.xhr || (req.get('X-Requested-With') === 'XMLHttpRequest');

function renderRow(res, view, locals) {
  return new Promise((resolve, reject) => {
    res.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const account = await getAccountOverview(req.user.id);
  const organization = await loadActiveOrganization(req);
  const usage = organization
    ? {
        orgName: organization.name,
        slu: await getUsageBudgetStatus(organization.id, { tool: 'slu', usageKey: UsageKey.SLU_ANALYSIS_ROLLING_7D }),
        eval: await getUsageBudgetStatus(organization.id, { tool: 'eval', usageKey: UsageKey.EVAL_RESPONSE_COLLECTION }),
      }
    : null;
  res.render('pages/account/index', {
    title: 'Account',
    account,
    usage,
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  });
  delete req.session.flash_error;
  delete req.session.flash_success;
}));

router.post('/delete', asyncHandler(async (req, res) => {
  try {
    await deleteOwnAccount({ userId: req.user.id, confirmEmail: req.body.confirmEmail });
  } catch (err) {
    req.session.flash_error = err.message;
    return res.redirect('/account');
  }
  req.logout(() => {
    req.session.destroy(() => res.redirect('/'));
  });
}));

router.post('/profile', asyncHandler(async (req, res) => {
  try {
    await updateOwnProfile(req.user.id, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
    });
    if (isAjax(req)) {
      const account = await getAccountOverview(req.user.id);
      const rowHtml = await renderRow(res, 'pages/account/_profile-row', { account });
      return res.json({ ok: true, rowHtml });
    }
    req.session.flash_success = 'Profile updated.';
  } catch (err) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: err.message });
    req.session.flash_error = err.message;
  }
  res.redirect('/account');
}));

router.post('/password', asyncHandler(async (req, res) => {
  try {
    await changeOwnPassword(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    if (isAjax(req)) {
      const account = await getAccountOverview(req.user.id);
      const rowHtml = await renderRow(res, 'pages/account/_password-row', { account });
      return res.json({ ok: true, rowHtml });
    }
    req.session.flash_success = 'Password updated.';
  } catch (err) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: err.message });
    req.session.flash_error = err.message;
  }
  res.redirect('/account');
}));

router.post('/preferences/navigation', asyncHandler(async (req, res) => {
  try {
    const saved = await updateNavigationOrientation(req.user.id, String(req.body.orientation || '').toUpperCase());
    req.user.navOrientation = saved.navOrientation;
    res.json({ ok: true, orientation: saved.navOrientation.toLowerCase() });
  } catch (err) {
    res.status(422).json({ ok: false, error: err.message });
  }
}));

router.get('/invites/:token/accept', asyncHandler(async (req, res) => {
  try {
    await acceptInvite({ token: req.params.token, userId: req.user.id });
    req.session.flash_success = 'Invitation accepted.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  res.redirect('/account');
}));

router.get('/orgs/:orgId/members', asyncHandler(async (req, res) => {
  const { org, actorRole } = await getManagedOrganization({ user: req.user, orgId: req.params.orgId });
  if (!org) return res.status(403).render('pages/error', { status: 403, message: 'Forbidden' });
  res.render('pages/account/org-members', {
    title: `${org.name} members`,
    org,
    actorRole,
    flash_error: req.session.flash_error ?? null,
    flash_success: req.session.flash_success ?? null,
  });
  delete req.session.flash_error;
  delete req.session.flash_success;
}));

router.post('/orgs/:orgId/invites', asyncHandler(async (req, res) => {
  const actorRole = await resolveRole(req.user, req.params.orgId);
  try {
    await createOrgInvite({
      orgId: req.params.orgId,
      email: req.body.email,
      role: req.body.role || 'MEMBER',
      invitedByUserId: req.user.id,
      actorRole,
    });
    req.session.flash_success = 'Invitation sent.';
  } catch (err) {
    req.session.flash_error = err.message;
  }
  redirectBack(req, res, `/account/orgs/${req.params.orgId}/members`);
}));

router.post('/orgs/:orgId/memberships/:membershipId/role', asyncHandler(async (req, res) => {
  const actorRole = await resolveRole(req.user, req.params.orgId);
  try {
    await setMembershipRole({
      orgId: req.params.orgId,
      membershipId: req.params.membershipId,
      role: req.body.role,
      actorId: req.user.id,
      actorRole,
      reason: req.body.reason || null,
    });
    if (isAjax(req)) {
      const { org } = await getManagedOrganization({ user: req.user, orgId: req.params.orgId });
      const membership = org?.memberships.find(m => m.id === req.params.membershipId);
      if (!membership) return res.status(404).json({ ok: false, error: 'Membership not found.' });
      const rowHtml = await renderRow(res, 'pages/account/_member-row', { org, membership });
      return res.json({ ok: true, rowHtml });
    }
    req.session.flash_success = 'Member role updated.';
  } catch (err) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: err.message });
    req.session.flash_error = err.message;
  }
  redirectBack(req, res, `/account/orgs/${req.params.orgId}/members`);
}));

router.post('/orgs/:orgId/memberships/:membershipId/remove', asyncHandler(async (req, res) => {
  const actorRole = await resolveRole(req.user, req.params.orgId);
  try {
    await removeMembership({
      orgId: req.params.orgId,
      membershipId: req.params.membershipId,
      actorId: req.user.id,
      actorRole,
      reason: req.body.reason || null,
    });
    if (isAjax(req)) return res.json({ ok: true, removed: true });
    req.session.flash_success = 'Member removed.';
  } catch (err) {
    if (isAjax(req)) return res.status(422).json({ ok: false, error: err.message });
    req.session.flash_error = err.message;
  }
  redirectBack(req, res, `/account/orgs/${req.params.orgId}/members`);
}));

export default router;
