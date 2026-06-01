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

export async function listAccessibleOrganizations(user) {
  if (!user) return [];

  const orgs = await db.organization.findMany({
    where: {
      deletedAt: null,
      OR: [
        user.isPlatformAdmin ? {} : null,
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
      ].filter(Boolean),
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

