import { db } from '@rumbo/db';
import { Role } from './permissions.js';

export async function resolveRole(user, orgId) {
  if (!user || !orgId) return null;
  if (user.isPlatformAdmin) return Role.PLATFORM_ADMIN;

  const membership = await db.membership.findFirst({
    where: { userId: user.id, orgId },
    select: { role: true },
  });

  if (membership) {
    return membership.role === 'MANAGER' ? Role.ORG_MANAGER : Role.ORG_MEMBER;
  }

  const partnerAccess = await db.partnerOrganizationAccess.findFirst({
    where: {
      orgId,
      removedAt: null,
      partnerAccount: {
        memberships: {
          some: { userId: user.id, role: 'MANAGER' },
        },
      },
    },
    select: { id: true },
  });

  return partnerAccess ? Role.PARTNER_MANAGER : null;
}

// Orgs the user belongs to or partner-manages — feeds the org switcher.
// Deliberately NOT every org for platform admins (that list would not scale);
// admins reach any org via resolveActiveOrganization's direct lookup
// (the admin org-detail "Act as this organization" action).
export async function listAccessibleOrganizations(user) {
  if (!user) return [];

  const orgs = await db.organization.findMany({
    where: {
      deletedAt: null,
      OR: [
        { memberships: { some: { userId: user.id } } },
        {
          partnerAccesses: {
            some: {
              removedAt: null,
              partnerAccount: {
                memberships: { some: { userId: user.id, role: 'MANAGER' } },
              },
            },
          },
        },
      ],
    },
    include: {
      memberships: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return orgs.map(org => {
    const directMembership = org.memberships?.[0];
    return {
      id: org.id,
      publicId: org.publicId,
      name: org.name,
      slug: org.slug,
      organizationType: org.organizationType,
      role: user.isPlatformAdmin ? Role.PLATFORM_ADMIN : directMembership?.role ?? Role.PARTNER_MANAGER,
    };
  });
}

