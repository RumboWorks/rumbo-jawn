import { db } from '@rumbo/db';
import { listAccessibleOrganizations } from './org-access-service.js';
import { Role } from './permissions.js';

export function primaryOrgIdForUser(user) {
  return user?.memberships?.[0]?.orgId ?? null;
}

export async function resolveActiveOrganization(user, requestedOrgId = null) {
  if (!user) return null;
  const organizations = await listAccessibleOrganizations(user);

  const requested = requestedOrgId
    ? organizations.find(org => org.id === requestedOrgId || org.publicId === requestedOrgId)
    : null;
  if (requested) return requested;

  // Platform admins may act as any org, not just those they belong to. The
  // accessible list stays membership/partner-scoped (it feeds the org
  // switcher), so resolve the requested org directly here.
  if (user.isPlatformAdmin && requestedOrgId) {
    const org = await db.organization.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: requestedOrgId }, { publicId: requestedOrgId }],
      },
    });
    if (org) {
      return {
        id: org.id,
        publicId: org.publicId,
        name: org.name,
        slug: org.slug,
        organizationType: org.organizationType,
        role: Role.PLATFORM_ADMIN,
      };
    }
  }

  if (organizations.length === 0) return null;
  const primaryOrgId = primaryOrgIdForUser(user);
  return organizations.find(org => org.id === primaryOrgId) ?? organizations[0];
}

export async function setActiveOrganization(req, orgId) {
  const organization = await resolveActiveOrganization(req.user, orgId);
  if (!organization || (organization.id !== orgId && organization.publicId !== orgId)) {
    throw new Error('You do not have access to that organization.');
  }

  // Platform admins may act as any org. Switching into an org they are not a
  // member of is support access — record it in the audit log (once per switch).
  const isActingAs = req.user.isPlatformAdmin
    && !(req.user.memberships ?? []).some(m => m.orgId === organization.id);
  if (isActingAs && req.session.activeOrgId !== organization.id) {
    await db.adminAuditLog.create({
      data: {
        actorId: req.user.id,
        action: 'admin.act_as_org',
        targetType: 'organization',
        targetId: organization.id,
        orgId: organization.id,
      },
    });
  }

  req.session.activeOrgId = organization.id;
  return organization;
}

export async function loadActiveOrganization(req) {
  const organization = await resolveActiveOrganization(req.user, req.session?.activeOrgId);
  if (req.session && organization) req.session.activeOrgId = organization.id;
  return organization;
}

export async function getOrganizationById(orgId) {
  return db.organization.findFirst({ where: { id: orgId, deletedAt: null } });
}
