import { db } from '@rumbo/db';

// ---- Create ----

export async function createJob(type, payload = {}, { userId = null, orgId = null } = {}) {
  return db.job.create({
    data: { type, payload, userId, orgId },
  });
}

// ---- Claim (atomic) ----
// Finds the oldest PENDING job and atomically marks it RUNNING.
// Returns the job if claimed, or null if nothing was available.

export async function claimNextJob() {
  return db.$transaction(async (tx) => {
    const job = await tx.job.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    if (!job) return null;

    const updated = await tx.job.updateMany({
      where: { id: job.id, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (updated.count === 0) return null; // another worker claimed it

    return tx.job.findUnique({ where: { id: job.id } });
  });
}

// ---- Complete ----

export async function completeJob(jobId, result = null) {
  return db.job.update({
    where: { id: jobId },
    data: { status: 'DONE', result, completedAt: new Date() },
  });
}

// ---- Fail ----

export async function failJob(jobId, errorMsg, { retry = true } = {}) {
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job ${jobId} not found`);

  const exhausted = job.attempts >= job.maxAttempts;
  const newStatus = retry && !exhausted ? 'PENDING' : 'FAILED';

  return db.job.update({
    where: { id: jobId },
    data: {
      status: newStatus,
      errorMsg,
      startedAt: newStatus === 'PENDING' ? null : job.startedAt,
    },
  });
}

// ---- Read ----

export async function getJob(jobId) {
  return db.job.findUnique({
    where: { id: jobId },
    include: { aiCalls: true, artifacts: true },
  });
}

export async function listJobs({ userId, orgId, type, status, limit = 50 } = {}) {
  return db.job.findMany({
    where: {
      ...(userId && { userId }),
      ...(orgId  && { orgId }),
      ...(type   && { type }),
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
