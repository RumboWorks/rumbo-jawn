// Tiered self-service signup provisioning. Decides what structure a new
// account gets based on the chosen tier:
//   free / solo  → personal SOLO workspace (same as the classic register flow)
//   team         → a named org with the user as MANAGER
//   partner      → a PartnerAccount (user as partner MANAGER) plus a first org
// Paid intent (solo/team/partner) is recorded on the entitlement overrides;
// the Stripe billing phase flips the actual tier after checkout.

import { db } from '@rumbo/db';
import { ensureOrgEntitlement } from '@rumbo/billing';
import { ensureOrgMembership } from './user-service.js';
import { uniqueOrgSlug } from './org-admin-service.js';

export const SIGNUP_TIERS = Object.freeze(['free', 'solo', 'team', 'partner']);
export const PAID_TIERS = Object.freeze(['solo', 'team', 'partner']);

async function recordIntendedTier(orgId, tier) {
  if (tier === 'free') return;
  const entitlement = await db.organizationEntitlement.findUnique({ where: { orgId } });
  if (!entitlement) return;
  await db.organizationEntitlement.update({
    where: { orgId },
    data: { overrides: { ...(entitlement.overrides ?? {}), intendedTier: tier } },
  });
}

export async function provisionSignup({ user, tier, orgName = null, partnerName = null }) {
  if (!SIGNUP_TIERS.includes(tier)) throw new Error('Choose a plan to continue.');

  if (tier === 'free' || tier === 'solo') {
    await ensureOrgMembership(user);
    const membership = await db.membership.findFirst({ where: { userId: user.id } });
    if (membership) await recordIntendedTier(membership.orgId, tier);
    return { tier };
  }

  if (tier === 'team') {
    const name = String(orgName || '').trim();
    if (!name) throw new Error('Organization name is required for a team plan.');
    const org = await db.organization.create({
      data: {
        name,
        slug: await uniqueOrgSlug(name),
        organizationType: 'NONPROFIT',
        createdByUserId: user.id,
      },
    });
    await db.membership.create({ data: { userId: user.id, orgId: org.id, role: 'MANAGER' } });
    await ensureOrgEntitlement(org.id);
    await recordIntendedTier(org.id, tier);
    return { tier, orgId: org.id };
  }

  // partner
  const name = String(partnerName || '').trim();
  if (!name) throw new Error('Partner account name is required for a partner plan.');
  const partner = await db.partnerAccount.create({ data: { name } });
  await db.partnerMembership.create({
    data: { partnerAccountId: partner.id, userId: user.id, role: 'MANAGER' },
  });
  const org = await db.organization.create({
    data: {
      name,
      slug: await uniqueOrgSlug(name),
      organizationType: 'AGENCY',
      createdByUserId: user.id,
    },
  });
  await db.membership.create({ data: { userId: user.id, orgId: org.id, role: 'MANAGER' } });
  await db.partnerOrganizationAccess.create({
    data: { partnerAccountId: partner.id, orgId: org.id, createdByUserId: user.id },
  });
  await ensureOrgEntitlement(org.id);
  await recordIntendedTier(org.id, tier);
  return { tier, orgId: org.id, partnerAccountId: partner.id };
}
