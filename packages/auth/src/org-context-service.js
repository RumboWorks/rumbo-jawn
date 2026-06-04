import { db } from '@rumbo/db';
import { listAccessibleOrganizations } from './org-access-service.js';

export function primaryOrgIdForUser(user) {
  return user?.memberships?.[0]?.orgId ?? null;
}

export async function resolveActiveOrganization(user, requestedOrgId = null) {
  if (!user) return null;
  const organizations = await listAccessibleOrganizations(user);
  if (organizations.length === 0) return null;

  const requested = requestedOrgId
    ? organizations.find(org => org.id === requestedOrgId || org.publicId === requestedOrgId)
    : null;
  if (requested) return requested;

  const primaryOrgId = primaryOrgIdForUser(user);
  return organizations.find(org => org.id === primaryOrgId) ?? organizations[0];
}

export async function setActiveOrganization(req, orgId) {
  const organization = await resolveActiveOrganization(req.user, orgId);
  if (!organization || (organization.id !== orgId && organization.publicId !== orgId)) {
    throw new Error('You do not have access to that organization.');
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
