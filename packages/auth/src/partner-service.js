// Partner accounts: CRUD + membership + managed-org access. Used by the
// platform-admin partner pages and the partner self-service area. Mutations
// are audit-logged via AdminAuditLog (matching account-service.js).

import { db } from '@rumbo/db';
import { ensureOrgEntitlement } from '@rumbo/billing';
import { findUserByEmail } from './user-service.js';
import { uniqueOrgSlug } from './org-admin-service.js';

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

// `partnerAccountId` (optional) asserts the membership belongs to that account
// — pass it from routes scoped to one account. `blockUserId` (optional)
// prevents removing that user (self-lockout guard for partner managers).
export async function removePartnerMember({ partnerMembershipId, partnerAccountId = null, blockUserId = null, actorId, reason = null }) {
  const membership = await db.partnerMembership.findUnique({ where: { id: partnerMembershipId } });
  if (!membership) throw new Error('Partner membership not found.');
  if (partnerAccountId && membership.partnerAccountId !== partnerAccountId) {
    throw new Error('Partner membership not found.');
  }
  if (blockUserId && membership.userId === blockUserId) {
    throw new Error('You cannot remove yourself. Ask another manager or platform support.');
  }
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

// ---- Partner-manager self-service (the /partner area) ----

// True when the actor manages the partner account (platform admins pass).
async function managesPartnerAccount(actor, partnerAccountId) {
  if (actor.isPlatformAdmin) return true;
  const membership = await db.partnerMembership.findFirst({
    where: { partnerAccountId, userId: actor.id, role: 'MANAGER' },
    select: { id: true },
  });
  return Boolean(membership);
}

// The actor's active access row for an org through any partner account they
// manage — the authorization check for editing/archiving a managed org.
async function partnerAccessForOrg(actor, orgId) {
  return db.partnerOrganizationAccess.findFirst({
    where: {
      orgId,
      removedAt: null,
      partnerAccount: actor.isPlatformAdmin
        ? undefined
        : { memberships: { some: { userId: actor.id, role: 'MANAGER' } } },
    },
  });
}

// Dashboard data: each managed partner account with its active orgs.
export async function getPartnerDashboard(actor) {
  const accounts = await db.partnerAccount.findMany({
    where: actor.isPlatformAdmin
      ? undefined
      : { memberships: { some: { userId: actor.id, role: 'MANAGER' } } },
    orderBy: { name: 'asc' },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      orgAccesses: {
        where: { removedAt: null },
        include: {
          org: {
            include: {
              entitlement: { include: { tier: true } },
              _count: { select: { memberships: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  return accounts.map(account => ({
    ...account,
    orgAccesses: account.orgAccesses.filter(access => !access.org.deletedAt),
  }));
}

// One managed org with the display fields the partner org row renders.
export async function getPartnerManagedOrg(actor, orgId) {
  const access = await partnerAccessForOrg(actor, orgId);
  if (!access) return null;
  return db.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    include: {
      entitlement: { include: { tier: true } },
      _count: { select: { memberships: true } },
    },
  });
}

export async function createPartnerManagedOrg({ partnerAccountId, name, organizationType = 'NONPROFIT', actor, reason = null }) {
  if (!(await managesPartnerAccount(actor, partnerAccountId))) {
    throw new Error('You do not manage that partner account.');
  }
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Organization name is required.');
  if (!['SOLO', 'NONPROFIT', 'AGENCY', 'ENTERPRISE'].includes(organizationType)) {
    throw new Error('Invalid organization type.');
  }

  const slug = await uniqueOrgSlug(trimmed);
  const org = await db.organization.create({
    data: { name: trimmed, slug, organizationType, createdByUserId: actor.id },
  });
  await ensureOrgEntitlement(org.id);
  await db.partnerOrganizationAccess.create({
    data: { partnerAccountId, orgId: org.id, createdByUserId: actor.id },
  });

  await audit({
    actorId: actor.id,
    action: 'partner.org_created',
    targetType: 'organization',
    targetId: org.id,
    orgId: org.id,
    newValue: { name: org.name, slug: org.slug, partnerAccountId },
    reason,
  });

  return org;
}

export async function updatePartnerManagedOrg({ orgId, name, organizationType, actor, reason = null }) {
  const access = await partnerAccessForOrg(actor, orgId);
  if (!access) throw new Error('You do not manage that organization.');
  const org = await db.organization.findFirst({ where: { id: orgId, deletedAt: null } });
  if (!org) throw new Error('Organization not found.');

  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Organization name is required.');
  const nextType = organizationType && ['SOLO', 'NONPROFIT', 'AGENCY', 'ENTERPRISE'].includes(organizationType)
    ? organizationType
    : org.organizationType;

  const updated = await db.organization.update({
    where: { id: orgId },
    data: { name: trimmed, organizationType: nextType },
  });

  await audit({
    actorId: actor.id,
    action: 'partner.org_updated',
    targetType: 'organization',
    targetId: orgId,
    orgId,
    oldValue: { name: org.name, organizationType: org.organizationType },
    newValue: { name: updated.name, organizationType: updated.organizationType },
    reason,
  });

  return updated;
}

// Removes the partner's access to the org. If nobody belongs to the org
// directly, it is soft-deleted too; otherwise it continues independently.
export async function archivePartnerManagedOrg({ orgId, actor, reason = null }) {
  const access = await partnerAccessForOrg(actor, orgId);
  if (!access) throw new Error('You do not manage that organization.');

  await db.partnerOrganizationAccess.update({
    where: { id: access.id },
    data: { removedAt: new Date() },
  });

  const memberCount = await db.membership.count({ where: { orgId } });
  let orgDeleted = false;
  if (memberCount === 0) {
    await db.organization.update({ where: { id: orgId }, data: { deletedAt: new Date() } });
    orgDeleted = true;
  }

  await audit({
    actorId: actor.id,
    action: 'partner.org_archived',
    targetType: 'organization',
    targetId: orgId,
    orgId,
    oldValue: { partnerAccountId: access.partnerAccountId },
    newValue: { orgDeleted },
    reason,
  });

  return { orgDeleted };
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
