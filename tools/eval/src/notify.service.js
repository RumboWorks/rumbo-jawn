// Eval tasks + notifications (in-app and email). Tasks are concrete work items
// in a user's inbox; notifications drive the in-app list and emailed alerts.
// Email uses the shared platform sender (honors EMAIL_TRANSPORT=log in dev) and
// is best-effort — a failed send never breaks the triggering action.

import { db } from '@rumbo/db';
import { sendEmail, buildAbsoluteUrl } from '@rumbo/auth';

const REMINDER_MIN_GAP_MS = 60 * 60 * 1000; // don't re-remind a reviewer within an hour

async function emailUser(userId, subject, text) {
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return;
    await sendEmail({ to: user.email, subject, text });
  } catch (err) {
    console.error('[eval:notify] email failed:', err.message);
  }
}

// Create an in-app notification and (optionally) send a best-effort email.
async function notify({ recipientUserId, organizationId, evalRunId = null, taskId = null, type, email = null }) {
  await db.evalNotification.create({
    data: { recipientUserId, organizationId, evalRunId, taskId, notificationType: type, channel: 'IN_APP', sentAt: email ? new Date() : null },
  });
  if (email) await emailUser(recipientUserId, email.subject, email.text);
}

// ---- Task creation wired into run transitions ----

// New reviewers were added: give each a review task + notification + email.
export async function onReviewersAdded(organizationId, run, addedUserIds) {
  const reviewUrl = buildAbsoluteUrl(`/eval/runs/${run.publicId}/review`);
  for (const userId of addedUserIds) {
    const task = await db.evalTask.create({
      data: { organizationId, assignedUserId: userId, evalRunId: run.id, taskType: 'REVIEW_RESPONSES', status: 'OPEN' },
    });
    await notify({
      recipientUserId: userId, organizationId, evalRunId: run.id, taskId: task.id, type: 'REVIEW_ASSIGNED',
      email: { subject: `You're assigned to review "${run.eval.title}"`, text: `You've been asked to review run ${run.runNumber} of "${run.eval.title}".\n\nReview it here: ${reviewUrl}` },
    });
  }
}

// On launch: a manual-collection task for each manual response, assigned to the
// launcher (in-app only — the manager just launched, no need to email).
export async function onRunLaunched(organizationId, run, manualResponses, launchedByUserId) {
  for (const r of manualResponses) {
    const task = await db.evalTask.create({
      data: { organizationId, assignedUserId: launchedByUserId, evalRunId: run.id, responseId: r.id, taskType: 'COLLECT_MANUAL_RESPONSE', status: 'OPEN' },
    });
    await notify({ recipientUserId: launchedByUserId, organizationId, evalRunId: run.id, taskId: task.id, type: 'MANUAL_RESPONSE_NEEDED' });
  }
}

// ---- Task completion ----

export function completeReviewTask(organizationId, evalRunId, userId) {
  return db.evalTask.updateMany({
    where: { organizationId, evalRunId, assignedUserId: userId, taskType: 'REVIEW_RESPONSES', status: 'OPEN' },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}

export function completeManualTask(organizationId, responseId) {
  return db.evalTask.updateMany({
    where: { organizationId, responseId, taskType: 'COLLECT_MANUAL_RESPONSE', status: 'OPEN' },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}

export function cancelRunTasks(organizationId, evalRunId) {
  return db.evalTask.updateMany({
    where: { organizationId, evalRunId, status: 'OPEN' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}

// Eval completed: notify all reviewers.
export async function onRunCompleted(organizationId, run) {
  const assignments = await db.evalReviewAssignment.findMany({ where: { organizationId, evalRunId: run.id }, select: { userId: true } });
  const reportUrl = buildAbsoluteUrl(`/eval/runs/${run.publicId}/report`);
  for (const a of assignments) {
    await notify({
      recipientUserId: a.userId, organizationId, evalRunId: run.id, type: 'EVAL_COMPLETED',
      email: { subject: `Review complete: "${run.eval.title}"`, text: `The review of run ${run.runNumber} of "${run.eval.title}" is complete.\n\nReport: ${reportUrl}` },
    });
  }
}

// ---- Reminders (manager-triggered, rate-limited) ----

export async function sendReviewReminders(organizationId, run) {
  const open = await db.evalReviewAssignment.findMany({
    where: { organizationId, evalRunId: run.id, completedAt: null },
    select: { userId: true },
  });
  const reviewUrl = buildAbsoluteUrl(`/eval/runs/${run.publicId}/review`);
  let sent = 0;
  for (const a of open) {
    const recent = await db.evalNotification.findFirst({
      where: { organizationId, evalRunId: run.id, recipientUserId: a.userId, notificationType: 'REVIEW_REMINDER', createdAt: { gt: new Date(Date.now() - REMINDER_MIN_GAP_MS) } },
      select: { id: true },
    });
    if (recent) continue; // already reminded recently
    await notify({
      recipientUserId: a.userId, organizationId, evalRunId: run.id, type: 'REVIEW_REMINDER',
      email: { subject: `Reminder: review "${run.eval.title}"`, text: `A reminder to complete your review of run ${run.runNumber} of "${run.eval.title}".\n\nReview: ${reviewUrl}` },
    });
    sent++;
  }
  return sent;
}

// ---- Inbox + notifications ----

export async function listMyTasks(organizationId, userId) {
  const tasks = await db.evalTask.findMany({
    where: { organizationId, assignedUserId: userId, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    include: {
      evalRun: { include: { eval: true } },
      response: { include: { modelSnapshot: true } },
    },
  });
  return tasks.map(t => ({
    ...t,
    href: t.taskType === 'COLLECT_MANUAL_RESPONSE' && t.response
      ? `/eval/responses/${t.response.publicId}/manual`
      : `/eval/runs/${t.evalRun?.publicId}/review`,
  }));
}

export function countMyTasks(organizationId, userId) {
  return db.evalTask.count({ where: { organizationId, assignedUserId: userId, status: 'OPEN' } });
}

export async function listMyNotifications(organizationId, userId, { limit = 20 } = {}) {
  // EvalNotification references the run by scalar id (no Prisma relation), so
  // resolve run/eval titles with a follow-up query and attach them.
  const notes = await db.evalNotification.findMany({
    where: { organizationId, recipientUserId: userId, channel: 'IN_APP' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  const runIds = [...new Set(notes.map(n => n.evalRunId).filter(Boolean))];
  const runs = runIds.length
    ? await db.evalRun.findMany({ where: { id: { in: runIds } }, include: { eval: true } })
    : [];
  const runById = Object.fromEntries(runs.map(r => [r.id, r]));
  return notes.map(n => ({ ...n, evalRun: n.evalRunId ? (runById[n.evalRunId] ?? null) : null }));
}

export function countUnreadNotifications(organizationId, userId) {
  return db.evalNotification.count({ where: { organizationId, recipientUserId: userId, channel: 'IN_APP', readAt: null } });
}

export function markNotificationsRead(organizationId, userId) {
  return db.evalNotification.updateMany({
    where: { organizationId, recipientUserId: userId, channel: 'IN_APP', readAt: null },
    data: { readAt: new Date() },
  });
}
