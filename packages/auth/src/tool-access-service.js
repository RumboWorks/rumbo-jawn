// Per-tool access resolution and middleware (Phase 10).
//
// Two axes gate tool access:
//   - org axis: getEffectiveEntitlement(orgId).features[tool] (does the org get the tool)
//   - user axis: ToolGrant(userId, orgId, tool) (what role this user has in the tool)
//
// Precedence (resolveToolRole and listAccessibleTools must stay in sync):
//   1. platform admin            ⇒ MANAGER (bypasses the org-entitlement gate)
//   2. org not entitled to tool  ⇒ null
//   3. partner manager of org    ⇒ MANAGER
//   4. explicit ToolGrant        ⇒ its role
//   5. orgOpen tool + membership ⇒ membership role
//   6. otherwise                 ⇒ null (no access)

import { db } from '@rumbo/db';
import { getEffectiveEntitlement } from '@rumbo/billing';
import { getTool, listTools } from '@rumbo/config';
import { loadActiveOrganization, primaryOrgIdForUser } from './org-context-service.js';

const ROLE_RANK = { MEMBER: 1, MANAGER: 2 };

// True if `role` meets or exceeds `minRole`.
export function toolRoleAtLeast(role, minRole) {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

async function isPartnerManagerOfOrg(userId, orgId) {
  const access = await db.partnerOrganizationAccess.findFirst({
    where: {
      orgId,
      removedAt: null,
      partnerAccount: { memberships: { some: { userId, role: 'MANAGER' } } },
    },
    select: { id: true },
  });
  return Boolean(access);
}

// Resolve a user's effective role within a tool for an org.
// Returns 'MANAGER' | 'MEMBER' | null.
export async function resolveToolRole(user, orgId, toolKey) {
  if (!user || !orgId) return null;
  const tool = getTool(toolKey);
  if (!tool) return null;

  if (user.isPlatformAdmin) return 'MANAGER';

  // Suspended orgs lose tool access for everyone except platform admins.
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { suspendedAt: true } });
  if (org?.suspendedAt) return null;

  const entitlement = await getEffectiveEntitlement(orgId);
  if (!entitlement?.features?.[toolKey]) return null;

  if (await isPartnerManagerOfOrg(user.id, orgId)) return 'MANAGER';

  const grant = await db.toolGrant.findUnique({
    where: { userId_orgId_tool: { userId: user.id, orgId, tool: toolKey } },
    select: { role: true },
  });
  if (grant) return grant.role;

  if (tool.orgOpen) {
    const membership = await db.membership.findFirst({
      where: { userId: user.id, orgId },
      select: { role: true },
    });
    if (membership) return membership.role;
  }

  return null;
}

// Tools the user can access in an org, each annotated with their role.
// Batched (one query per source) so it scales as the registry grows.
export async function listAccessibleTools(user, orgId) {
  if (!user || !orgId) return [];
  const tools = listTools();

  if (user.isPlatformAdmin) {
    return tools.map(tool => ({ ...tool, role: 'MANAGER' }));
  }

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { suspendedAt: true } });
  if (org?.suspendedAt) return [];

  const entitlement = await getEffectiveEntitlement(orgId);
  const features = entitlement?.features ?? {};

  const [grants, isPartnerManager, membership] = await Promise.all([
    db.toolGrant.findMany({ where: { userId: user.id, orgId }, select: { tool: true, role: true } }),
    isPartnerManagerOfOrg(user.id, orgId),
    db.membership.findFirst({ where: { userId: user.id, orgId }, select: { role: true } }),
  ]);
  const grantByTool = Object.fromEntries(grants.map(g => [g.tool, g.role]));

  const accessible = [];
  for (const tool of tools) {
    if (!features[tool.key]) continue;
    let role = null;
    if (isPartnerManager) role = 'MANAGER';
    else if (grantByTool[tool.key]) role = grantByTool[tool.key];
    else if (tool.orgOpen && membership) role = membership.role;
    if (role) accessible.push({ ...tool, role });
  }
  return accessible;
}

// Express middleware gating a tool router.
//   minRole       — 'MEMBER' (default) or 'MANAGER'
//   allowAnonymous — let unauthenticated requests pass to the router (e.g. a
//                    public marketing funnel); authenticated users are still
//                    checked. Used to keep Sounds Like Us's public landing open.
export function requireToolAccess(toolKey, { minRole = 'MEMBER', allowAnonymous = false } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        if (allowAnonymous) return next();
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
      }

      const organization = await loadActiveOrganization(req);
      const orgId = organization?.id ?? primaryOrgIdForUser(req.user);
      const role = await resolveToolRole(req.user, orgId, toolKey);

      if (!toolRoleAtLeast(role, minRole)) {
        return res.status(403).render('pages/error', {
          status: 403,
          message: 'You do not have access to this tool.',
        });
      }

      req.toolRole = role;
      req.toolOrgId = orgId;
      req.activeOrganization = organization;
      next();
    } catch (err) {
      next(err);
    }
  };
}
