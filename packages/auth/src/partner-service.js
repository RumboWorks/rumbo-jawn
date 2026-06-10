// Partner accounts: CRUD + membership + managed-org access. Used by the
// platform-admin partner pages and the partner self-service area. Mutations
// are audit-logged via AdminAuditLog (matching account-service.js).

import { db } from '@rumbo/db';
import { findUserByEmail } from './user-service.js';

async function audit({ actorId, action, targetType, targetId, orgId = null, oldValue = null, newValue = null, reason = null }) {
  return db.adminAuditLog.create({
    data: { actorId, action, targetType, targetId, orgId, oldValue, newValue, reason },
  });
}

export async function listPartnerAccounts() {
  const partners = await db.partnerAccount.findMany({
    orderBy: { name: 'asc' },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      orgAccesses: { where: { removedAt: null }, include: { org: true } },
    },
  });
  return partners.map(partner => ({
    ...partner,
    activeOrgAccesses: partner.orgAccesses.filter(access => !access.org.deletedAt),
  }));
}

export async function getPartnerAccountDetail(partnerAccountId) {
  const partner = await db.partnerAccount.findUnique({
    where: { id: partnerAccountId },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      orgAccesses: {
        where: { removedAt: null },
        include: { org: { include: { entitlement: { include: { tier: true } }, _count: { select: { memberships: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!partner) return null;
  return {
    ...partner,
    orgAccesses: partner.orgAccesses.filter(access => !access.org.deletedAt),
  };
}

// Partner accounts a user manages (used by requirePartnerManager and nav).
export async function listPartnerAccountsForUser(userId) {
  return db.partnerAccount.findMany({
    where: { memberships: { some: { userId, role: 'MANAGER' } } },
    orderBy: { name: 'asc' },
  });
}

export async function createPartnerAccount({ name, supportEmail = null, actorId, reason = null }) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Partner name is required.');

  const partner = await db.partnerAccount.create({
    data: { name: trimmed, supportEmail: supportEmail || null },
  });

  await audit({
    actorId,
    action: 'partner.created',
    targetType: 'partner_account',
    targetId: partner.id,
    newValue: { name: partner.name, supportEmail: partner.supportEmail },
    reason,
  });

  return partner;
}

export async function updatePartnerAccount({ partnerAccountId, name, supportEmail, actorId, reason = null }) {
  const partner = await db.partnerAccount.findUnique({ where: { id: partnerAccountId } });
  if (!partner) throw new Error('Partner account not found.');
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Partner name is required.');

  const updated = await db.partnerAccount.update({
    where: { id: partnerAccountId },
    data: { name: trimmed, supportEmail: supportEmail || null },
  });

  await audit({
    actorId,
    action: 'partner.updated',
    targetType: 'partner_account',
    targetId: partnerAccountId,
    oldValue: { name: partner.name, supportEmail: partner.supportEmail },
    newValue: { name: updated.name, supportEmail: updated.supportEmail },
    reason,
  });

  return updated;
}

export async function addPartnerMember({ partnerAccountId, email, actorId, reason = null }) {
  const partner = await db.partnerAccount.findUnique({ where: { id: partnerAccountId } });
  if (!partner) throw new Error('Partner account not found.');
  const user = await findUserByEmail(String(email || '').trim().toLowerCase());
  if (!user) throw new Error('No user exists with that email address. They must register first.');

  const membership = await db.partnerMembership.upsert({
    where: { partnerAccountId_userId: { partnerAccountId, userId: user.id } },
    update: {},
    create: { partnerAccountId, userId: user.id, role: 'MANAGER' },
  });

  await audit({
    actorId,
    action: 'partner.member_added',
    targetType: 'partner_membership',
    targetId: membership.id,
    newValue: { partnerAccountId, userId: user.id, email: user.email },
    reason,
  });

  return membership;
}

export async function removePartnerMember({ partnerMembershipId, actorId, reason = null }) {
  const membership = await db.partnerMembership.findUnique({ where: { id: partnerMembershipId } });
  if (!membership) throw new Error('Partner membership not found.');
  await db.partnerMembership.delete({ where: { id: partnerMembershipId } });

  await audit({
    actorId,
    action: 'partner.member_removed',
    targetType: 'partner_membership',
    targetId: partnerMembershipId,
    oldValue: { partnerAccountId: membership.partnerAccountId, userId: membership.userId },
    reason,
  });

  return membership;
}

export async function grantPartnerOrgAccess({ partnerAccountId, orgId, actorId, reason = null }) {
  const [partner, org] = await Promise.all([
    db.partnerAccount.findUnique({ where: { id: partnerAccountId } }),
    db.organization.findFirst({ where: { id: orgId, deletedAt: null } }),
  ]);
  if (!partner) throw new Error('Partner account not found.');
  if (!org) throw new Error('Organization not found.');

  const existing = await db.partnerOrganizationAccess.findFirst({
    where: { partnerAccountId, orgId, removedAt: null },
  });
  if (existing) return existing;

  const access = await db.partnerOrganizationAccess.create({
    data: { partnerAccountId, orgId, createdByUserId: actorId },
  });

  await audit({
    actorId,
    action: 'partner.org_access_granted',
    targetType: 'partner_org_access',
    targetId: access.id,
    orgId,
    newValue: { partnerAccountId, orgId },
    reason,
  });

  return access;
}

export async function revokePartnerOrgAccess({ accessId, actorId, reason = null }) {
  const access = await db.partnerOrganizationAccess.findUnique({ where: { id: accessId } });
  if (!access || access.removedAt) throw new Error('Partner organization access not found.');

  const updated = await db.partnerOrganizationAccess.update({
    where: { id: accessId },
    data: { removedAt: new Date() },
  });

  await audit({
    actorId,
    action: 'partner.org_access_revoked',
    targetType: 'partner_org_access',
    targetId: accessId,
    orgId: access.orgId,
    oldValue: { partnerAccountId: access.partnerAccountId, orgId: access.orgId },
    reason,
  });

  return updated;
}
