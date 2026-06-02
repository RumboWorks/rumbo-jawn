import { ensureOrgEntitlement } from '@rumbo/billing';
import { db } from '@rumbo/db';

// Find a user by email, or return null.
export async function findUserByEmail(email) {
  return db.user.findUnique({ where: { email } });
}

// Find a user by OAuth provider + providerId.
export async function findUserByOAuth(provider, providerId) {
  const account = await db.oAuthAccount.findUnique({
    where: { provider_providerId: { provider, providerId } },
    include: { user: true },
  });
  return account?.user ?? null;
}

// Find or create a user from an OAuth profile.
// Looks up by providerId first, then by email, then creates new.
export async function findOrCreateOAuthUser({ provider, providerId, email, name, avatarUrl }) {
  const existing = await findUserByOAuth(provider, providerId);
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
    return existing;
  }

  let user = await findUserByEmail(email);
  if (!user) {
    user = await db.user.create({ data: { email, name, avatarUrl } });
    await ensureOrgMembership(user);
  }

  await db.oAuthAccount.create({ data: { provider, providerId, userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

// Ensure a user belongs to at least one org.
// Checks approved-domain auto-approval; otherwise creates a personal org.
export async function ensureOrgMembership(user) {
  const existing = await db.membership.findFirst({ where: { userId: user.id } });
  if (existing) return;

  const domain = user.email.split('@')[1];
  const approved = domain
    ? await db.approvedDomain.findFirst({
        where: { domain },
        include: { org: true },
      })
    : null;

  if (approved) {
    await db.membership.create({
      data: { userId: user.id, orgId: approved.orgId, role: 'MEMBER' },
    });
    await ensureOrgEntitlement(approved.orgId);
  } else {
    const slug = await uniqueOrgSlug(user.email.split('@')[0]);
    const org = await db.organization.create({
      data: {
        name: `${user.name ?? user.email}'s workspace`,
        slug,
        organizationType: 'SOLO',
        createdByUserId: user.id,
      },
    });
    await db.membership.create({ data: { userId: user.id, orgId: org.id, role: 'MANAGER' } });
    await ensureOrgEntitlement(org.id);
  }
}

// Load a user with their org memberships — used by passport serializeUser / deserializeUser.
export async function loadUser(id) {
  return db.user.findUnique({
    where: { id },
    include: {
      memberships: { include: { org: true } },
      partnerMemberships: { include: { partnerAccount: true } },
    },
  });
}

// Generate a unique org slug from a base string.
async function uniqueOrgSlug(base) {
  const slug = base.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
  const existing = await db.organization.findUnique({ where: { slug } });
  if (!existing) return slug;
  return `${slug}-${Date.now()}`;
}
