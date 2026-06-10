// Email verification: single-use hashed tokens (mirrors PasswordResetToken).
// Users may log in unverified but requireVerified blocks app surfaces until
// the emailed link is opened.

import crypto from 'crypto';
import { db } from '@rumbo/db';
import { buildAbsoluteUrl, sendEmail } from './email-service.js';

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 48;
const RESEND_COOLDOWN_MINUTES = 2;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function addHours(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

export async function sendVerificationEmail(user) {
  if (user.emailVerifiedAt) return { sent: false, alreadyVerified: true };

  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: addHours(TOKEN_TTL_HOURS),
    },
  });

  const verifyUrl = buildAbsoluteUrl(`/auth/verify/${token}`);
  await sendEmail({
    to: user.email,
    subject: 'Verify your Rumbo email address',
    text: `Confirm this email address to start using Rumbo. The link expires in ${TOKEN_TTL_HOURS} hours.\n\n${verifyUrl}`,
    html: `<p>Confirm this email address to start using Rumbo. The link expires in ${TOKEN_TTL_HOURS} hours.</p><p><a href="${verifyUrl}">Verify email address</a></p>`,
  });

  return { sent: true };
}

// Re-send, with a short cooldown so the button can't spam the mailbox.
export async function resendVerificationEmail(userId) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (user.emailVerifiedAt) return { sent: false, alreadyVerified: true };

  const cutoff = new Date(Date.now() - RESEND_COOLDOWN_MINUTES * 60 * 1000);
  const recent = await db.emailVerificationToken.findFirst({
    where: { userId, createdAt: { gt: cutoff } },
    select: { id: true },
  });
  if (recent) throw new Error('A verification email was just sent — check your inbox (and spam folder).');

  return sendVerificationEmail(user);
}

// Consume a token: marks the user verified. Returns the user.
export async function verifyEmailToken(token) {
  const tokenHash = hashToken(String(token || ''));
  const row = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row || row.consumedAt || row.expiresAt < new Date()) {
    throw new Error('Verification link is invalid or expired.');
  }

  const [user] = await db.$transaction([
    db.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: row.user.emailVerifiedAt ?? new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  return user;
}
