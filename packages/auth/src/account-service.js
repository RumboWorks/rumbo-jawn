import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '@rumbo/db';
import { isToolKey } from '@rumbo/config';
import { can, Permission, Role } from './permissions.js';
import { buildAbsoluteUrl, sendEmail } from './email-service.js';
import { findUserByEmail, ensureOrgMembership } from './user-service.js';
import { resolveRole } from './org-access-service.js';
import { normalizePersonName } from './names.js';

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MINUTES = 60;
const INVITE_TTL_DAYS = 14;

export const UserStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function addMinutes(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

async function audit({ actorId, action, targetType, targetId, orgId = null, oldValue = null, newValue = null, reason = null }) {
  return db.adminAuditLog.create({
    data: { actorId, action, targetType, targetId, orgId, oldValue, newValue, reason },
  });
}

export function isActiveUser(user) {
  return !user || !user.status || user.status === UserStatus.ACTIVE;
}

export async function getAccountOverview(userId) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      oauthAccounts: true,
      memberships: {
        include: {
          org: {
            include: {
              memberships: { select: { role: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      partnerMemberships: { include: { partnerAccount: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!user) return null;

  const visibleMemberships = user.memberships.filter((membership) => {
    const org = membership.org;
    if (org.organizationType !== 'SOLO') return true;
    return membership.role === 'MANAGER';
  });

  return {
    ...user,
    visibleMemberships,
    hasPassword: Boolean(user.passwordHash),
    authProviders: user.oauthAccounts.map(account => account.provider),
  };
}

export async function updateOwnProfile(userId, { name, firstName, lastName, email }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (!isActiveUser(user)) throw new Error('Account is not active.');

  const nextEmail = normalizeEmail(email);
  if (!nextEmail) throw new Error('Email is required.');
  const existing = await findUserByEmail(nextEmail);
  if (existing && existing.id !== userId) throw new Error('That email address is already in use.');

  const personName = normalizePersonName({ name, firstName, lastName });
  if (!personName.firstName || !personName.lastName) throw new Error('First and last name are required.');
  return db.user.update({
    where: { id: userId },
    data: { ...personName, email: nextEmail },
  });
}

export async function updateNavigationOrientation(userId, orientation) {
  if (!['HORIZONTAL', 'VERTICAL'].includes(orientation)) {
    throw new Error('Invalid navigation orientation.');
  }
  return db.user.update({
    where: { id: userId },
    data: { navOrientation: orientation },
    select: { navOrientation: true },
  });
}

export async function changeOwnPassword(userId, { currentPassword, newPassword }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) throw new Error('Password change is only available for local-password accounts.');
  if (!isActiveUser(user)) throw new Error('Account is not active.');
  if (String(newPassword || '').length < 8) throw new Error('New password must be at least 8 characters.');

  const matches = await bcrypt.compare(String(currentPassword || ''), user.passwordHash);
  if (!matches) throw new Error('Current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  return { changed: true };
}

export async function requestPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = normalizedEmail ? await findUserByEmail(normalizedEmail) : null;
  if (!user || !user.passwordHash || !isActiveUser(user)) {
    return { sent: false };
  }

  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('base64url');
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: addMinutes(RESET_TOKEN_TTL_MINUTES),
    },
  });

  const resetUrl = buildAbsoluteUrl(`/password/reset/${token}`);
  await sendEmail({
    to: user.email,
    subject: 'Reset your Rumbo password',
    text: `Use this link to reset your Rumbo password. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.\n\n${resetUrl}`,
    html: `<p>Use this link to reset your Rumbo password. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });

  return { sent: true };
}

export async function resetPasswordWithToken(token, newPassword) {
  if (String(newPassword || '').length < 8) throw new Error('New password must be at least 8 characters.');
  const tokenHash = hashToken(String(token || ''));
  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new Error('Password reset link is invalid or expired.');
  }
  if (!isActiveUser(resetToken.user)) throw new Error('Account is not active.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return resetToken.user;
}

export async function createOrgInvite({ orgId, email, role = 'MEMBER', invitedByUserId, actorRole }) {
  if (!can(actorRole, Permission.MANAGE_ORG_MEMBERS)) throw new Error('You do not have permission to invite members.');
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required.');
  if (!['MANAGER', 'MEMBER'].includes(role)) throw new Error('Invalid member role.');

  const invite = await db.organizationInvite.create({
    data: {
      orgId,
      email: normalizedEmail,
      role,
      invitedByUserId,
      expiresAt: addDays(INVITE_TTL_DAYS),
    },
    include: { org: true },
  });

  const inviteUrl = buildAbsoluteUrl(`/invites/${invite.inviteToken}`);
  await sendEmail({
    to: invite.email,
    subject: `You're invited to ${invite.org.name} on Rumbo`,
    text: `You've been invited to ${invite.org.name} on Rumbo.\n\nAccept the invitation: ${inviteUrl}`,
    html: `<p>You've been invited to ${invite.org.name} on Rumbo.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  });

  await audit({
    actorId: invitedByUserId,
    action: 'org.member.invited',
    targetType: 'organization_invite',
    targetId: invite.id,
    orgId,
    newValue: { email: invite.email, role: invite.role },
  });

  return invite;
}

export async function getManagedOrganization({ user, orgId }) {
  const actorRole = await resolveRole(user, orgId);
  if (!can(actorRole, Permission.MANAGE_ORG_MEMBERS)) return { org: null, actorRole };

  const org = await db.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      invites: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        include: { invitedBy: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return { org, actorRole };
}

export async function getInviteByToken(token) {
  if (!token) return null;
  return db.organizationInvite.findUnique({
    where: { inviteToken: token },
    include: { org: true },
  });
}

export async function acceptInvite({ token, userId }) {
  const invite = await getInviteByToken(token);
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error('Invitation is invalid or expired.');
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    throw new Error('This invitation was sent to a different email address.');
  }

  await db.$transaction([
    db.membership.upsert({
      where: { userId_orgId: { userId, orgId: invite.orgId } },
      update: { role: invite.role },
      create: { userId, orgId: invite.orgId, role: invite.role },
    }),
    db.organizationInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);

  await audit({
    actorId: userId,
    action: 'org.member.invite_accepted',
    targetType: 'organization_invite',
    targetId: invite.id,
    orgId: invite.orgId,
    newValue: { userId, role: invite.role },
  });

  return invite;
}

export async function createUserFromInviteIfNeeded(user, inviteToken) {
  if (!inviteToken) {
    await ensureOrgMembership(user);
    return;
  }

  const invite = await getInviteByToken(inviteToken);
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date() || normalizeEmail(invite.email) !== normalizeEmail(user.email)) {
    await ensureOrgMembership(user);
    return;
  }

  await acceptInvite({ token: inviteToken, userId: user.id });
}

export async function setMembershipRole({ orgId, membershipId, role, actorId, actorRole, reason = null }) {
  if (!can(actorRole, Permission.MANAGE_ORG_MEMBERS)) throw new Error('You do not have permission to manage members.');
  if (!['MANAGER', 'MEMBER'].includes(role)) throw new Error('Invalid member role.');

  const before = await db.membership.findUnique({ where: { id: membershipId } });
  if (!before || before.orgId !== orgId) throw new Error('Membership not found.');
  const updated = await db.membership.update({ where: { id: membershipId }, data: { role } });

  await audit({
    actorId,
    action: 'org.member.role_changed',
    targetType: 'membership',
    targetId: membershipId,
    orgId,
    oldValue: { userId: before.userId, role: before.role },
    newValue: { userId: updated.userId, role: updated.role },
    reason,
  });

  return updated;
}

export async function removeMembership({ orgId, membershipId, actorId, actorRole, reason = null }) {
  if (!can(actorRole, Permission.MANAGE_ORG_MEMBERS)) throw new Error('You do not have permission to manage members.');

  const membership = await db.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.orgId !== orgId) throw new Error('Membership not found.');
  await db.membership.delete({ where: { id: membershipId } });

  await audit({
    actorId,
    action: 'org.member.removed',
    targetType: 'membership',
    targetId: membershipId,
    orgId,
    oldValue: { userId: membership.userId, role: membership.role },
    reason,
  });

  return membership;
}

// Self-service deletion: anonymizes the account in place (GDPR-style) rather
// than hard-deleting rows, so jobs/audit history keep valid references.
// Solo workspaces where this user was the only member are soft-deleted.
// Blocked while any sole-member org still has an active subscription — the
// user must cancel billing first (via /billing) so Stripe doesn't keep
// charging an orphaned org.
export async function deleteOwnAccount({ userId, confirmEmail }) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          org: {
            include: {
              entitlement: { select: { stripeSubscriptionStatus: true } },
              _count: { select: { memberships: true } },
            },
          },
        },
      },
    },
  });
  if (!user) throw new Error('User not found.');
  if (normalizeEmail(confirmEmail) !== normalizeEmail(user.email)) {
    throw new Error('Confirmation email does not match your account email.');
  }

  const soleMemberOrgs = user.memberships
    .filter(m => m.org._count.memberships === 1 && !m.org.deletedAt)
    .map(m => m.org);
  const withActiveSubscription = soleMemberOrgs.find((org) => {
    const status = org.entitlement?.stripeSubscriptionStatus;
    return status && !['canceled', 'incomplete_expired'].includes(status);
  });
  if (withActiveSubscription) {
    throw new Error('Cancel your subscription first (Billing → Manage billing), then delete your account.');
  }

  const anonymizedEmail = `deleted-${user.id}@deleted.invalid`;
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        name: null,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        passwordHash: null,
        emailVerifiedAt: null,
        status: UserStatus.DEACTIVATED,
        statusReason: 'Account deleted by user',
        statusChangedAt: new Date(),
      },
    }),
    db.oAuthAccount.deleteMany({ where: { userId } }),
    db.passwordResetToken.deleteMany({ where: { userId } }),
    db.emailVerificationToken.deleteMany({ where: { userId } }),
    // Drop every session referencing this user (passport stores the id in the
    // serialized session JSON).
    db.session.deleteMany({ where: { data: { contains: userId } } }),
    ...soleMemberOrgs.map(org => db.organization.update({
      where: { id: org.id },
      data: { deletedAt: new Date() },
    })),
  ]);

  await audit({
    actorId: userId,
    action: 'user.self_deleted',
    targetType: 'user',
    targetId: userId,
    oldValue: { email: user.email },
    newValue: { email: anonymizedEmail, soleMemberOrgsArchived: soleMemberOrgs.length },
  });

  return { deleted: true };
}

export async function adminUpdateUser({ userId, actorId, name, firstName, lastName, email, status, statusReason = null, reason = null }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (!Object.values(UserStatus).includes(status)) throw new Error('Invalid account status.');

  const nextEmail = normalizeEmail(email);
  if (!nextEmail) throw new Error('Email is required.');
  const existing = await findUserByEmail(nextEmail);
  if (existing && existing.id !== userId) throw new Error('That email address is already in use.');

  const personName = normalizePersonName({ name, firstName, lastName });
  if (!personName.firstName || !personName.lastName) throw new Error('First and last name are required.');
  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...personName,
      email: nextEmail,
      status,
      statusReason: status === UserStatus.ACTIVE ? null : statusReason || null,
      statusChangedAt: status !== user.status ? new Date() : user.statusChangedAt,
    },
  });

  await audit({
    actorId,
    action: 'user.profile_changed',
    targetType: 'user',
    targetId: userId,
    oldValue: { name: user.name, firstName: user.firstName, lastName: user.lastName, email: user.email, status: user.status, statusReason: user.statusReason },
    newValue: { name: updated.name, firstName: updated.firstName, lastName: updated.lastName, email: updated.email, status: updated.status, statusReason: updated.statusReason },
    reason,
  });

  return updated;
}

export async function adminAddUserMembership({ userId, orgId, role, actorId, reason = null }) {
  if (!['MANAGER', 'MEMBER'].includes(role)) throw new Error('Invalid member role.');
  const membership = await db.membership.upsert({
    where: { userId_orgId: { userId, orgId } },
    update: { role },
    create: { userId, orgId, role },
  });

  await audit({
    actorId,
    action: 'user.membership_upserted',
    targetType: 'membership',
    targetId: membership.id,
    orgId,
    newValue: { userId, role },
    reason,
  });

  return membership;
}

export async function adminRemoveUserMembership({ membershipId, actorId, reason = null }) {
  const membership = await db.membership.findUnique({ where: { id: membershipId } });
  if (!membership) throw new Error('Membership not found.');
  await db.membership.delete({ where: { id: membershipId } });

  await audit({
    actorId,
    action: 'user.membership_removed',
    targetType: 'membership',
    targetId: membershipId,
    orgId: membership.orgId,
    oldValue: { userId: membership.userId, role: membership.role },
    reason,
  });

  return membership;
}

// ---- Per-tool access grants (Phase 10) ----

// Grant or update a user's role for a tool within an org. Validates that the
// tool key is registered and the user belongs to the org. Audit-logged.
export async function adminUpsertToolGrant({ userId, orgId, tool, role, actorId, reason = null }) {
  if (!isToolKey(tool)) throw new Error('Unknown tool.');
  if (!['MANAGER', 'MEMBER'].includes(role)) throw new Error('Invalid tool role.');

  const membership = await db.membership.findFirst({ where: { userId, orgId }, select: { id: true } });
  if (!membership) throw new Error('User is not a member of this organization.');

  const existing = await db.toolGrant.findUnique({
    where: { userId_orgId_tool: { userId, orgId, tool } },
    select: { role: true },
  });

  const grant = await db.toolGrant.upsert({
    where: { userId_orgId_tool: { userId, orgId, tool } },
    update: { role },
    create: { userId, orgId, tool, role },
  });

  await audit({
    actorId,
    action: 'user.tool_grant_upserted',
    targetType: 'tool_grant',
    targetId: grant.id,
    orgId,
    oldValue: existing ? { userId, tool, role: existing.role } : null,
    newValue: { userId, tool, role },
    reason,
  });

  return grant;
}

// Revoke a user's tool grant. Audit-logged.
export async function adminRemoveToolGrant({ grantId, actorId, reason = null }) {
  const grant = await db.toolGrant.findUnique({ where: { id: grantId } });
  if (!grant) throw new Error('Tool grant not found.');
  await db.toolGrant.delete({ where: { id: grantId } });

  await audit({
    actorId,
    action: 'user.tool_grant_removed',
    targetType: 'tool_grant',
    targetId: grantId,
    orgId: grant.orgId,
    oldValue: { userId: grant.userId, tool: grant.tool, role: grant.role },
    reason,
  });

  return grant;
}
