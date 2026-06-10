// Platform-admin organization lifecycle: create and soft-delete.
// Mutations are audit-logged via AdminAuditLog (matching account-service.js).

import { db } from '@rumbo/db';
import { ensureOrgEntitlement } from '@rumbo/billing';

const ORG_TYPES = ['SOLO', 'NONPROFIT', 'AGENCY', 'ENTERPRISE'];

async function audit({ actorId, action, targetType, targetId, orgId = null, oldValue = null, newValue = null, reason = null }) {
  return db.adminAuditLog.create({
    data: { actorId, action, targetType, targetId, orgId, oldValue, newValue, reason },
  });
}

export async function uniqueOrgSlug(base) {
  const slug = String(base || 'org').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'org';
  const existing = await db.organization.findUnique({ where: { slug } });
  if (!existing) return slug;
  return `${slug}-${Date.now()}`;
}

export async function adminCreateOrganization({ name, organizationType = 'NONPROFIT', tierKey, actorId, reason = null }) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Organization name is required.');
  if (!ORG_TYPES.includes(organizationType)) throw new Error('Invalid organization type.');

  const slug = await uniqueOrgSlug(trimmed);
  const org = await db.organization.create({
    data: {
      name: trimmed,
      slug,
      organizationType,
      createdByUserId: actorId,
    },
  });
  await ensureOrgEntitlement(org.id, tierKey ? { tierKey } : undefined);

  await audit({
    actorId,
    action: 'org.created',
    targetType: 'organization',
    targetId: org.id,
    orgId: org.id,
    newValue: { name: org.name, slug: org.slug, organizationType, tierKey: tierKey ?? null },
    reason,
  });

  return org;
}

// Suspend / unsuspend: a suspended org loses tool access for everyone except
// platform admins (enforced in tool-access-service); members can still sign in.
export async function adminSetOrgSuspension({ orgId, suspend, actorId, reason = null }) {
  const org = await db.organization.findFirst({ where: { id: orgId, deletedAt: null } });
  if (!org) throw new Error('Organization not found.');

  const updated = await db.organization.update({
    where: { id: orgId },
    data: suspend
      ? { suspendedAt: new Date(), suspendedReason: reason || null }
      : { suspendedAt: null, suspendedReason: null },
  });

  await audit({
    actorId,
    action: suspend ? 'org.suspended' : 'org.unsuspended',
    targetType: 'organization',
    targetId: orgId,
    orgId,
    oldValue: { suspendedAt: org.suspendedAt },
    newValue: { suspendedAt: updated.suspendedAt },
    reason,
  });

  return updated;
}

// Soft delete: sets deletedAt so the org disappears from every deletedAt:null
// query (access lists, admin lists, nav). Data is retained. Blocked while a
// Stripe subscription is active — cancel it first (admin billing controls).
export async function adminSoftDeleteOrganization({ orgId, confirmName, actorId, reason = null }) {
  const org = await db.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    include: { entitlement: { select: { stripeSubscriptionStatus: true } } },
  });
  if (!org) throw new Error('Organization not found.');
  if (String(confirmName || '').trim() !== org.name) {
    throw new Error('Confirmation name does not match the organization name.');
  }
  const subStatus = org.entitlement?.stripeSubscriptionStatus;
  if (subStatus && !['canceled', 'incomplete_expired'].includes(subStatus)) {
    throw new Error('This organization has an active subscription. Cancel it before deleting.');
  }

  const updated = await db.organization.update({
    where: { id: org.id },
    data: { deletedAt: new Date() },
  });

  await audit({
    actorId,
    action: 'org.deleted',
    targetType: 'organization',
    targetId: org.id,
    orgId: org.id,
    oldValue: { name: org.name, slug: org.slug },
    reason,
  });

  return updated;
}
