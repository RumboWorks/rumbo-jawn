// Eval authoring, run launch (with immutable snapshots), and response
// collection — data access, db-only so both the web router and the worker can
// import it. Every query is scoped by organizationId.

import { db } from '@rumbo/db';

// ---- Evaluations ----

export const latestRunProgressInclude = {
  _count: {
    select: {
      criterionSnapshots: true,
      modelSnapshots: true,
      responses: true,
      reviewAssignments: true,
    },
  },
  responses: { select: { id: true, responseText: true, modelSnapshotId: true } },
  reviewAssignments: { select: { userId: true } },
  ratings: { select: { responseId: true, reviewerUserId: true, criterionSnapshotId: true, score: true } },
  modelSnapshots: { select: { id: true, displayName: true }, orderBy: { displayOrder: 'asc' } },
};

function ratioProgress(done, total) {
  const safeTotal = Math.max(total ?? 0, 0);
  const safeDone = Math.min(Math.max(done ?? 0, 0), safeTotal);
  return {
    done: safeDone,
    total: safeTotal,
    label: `${safeDone} of ${safeTotal}`,
    percent: safeTotal > 0 ? Math.round((safeDone / safeTotal) * 100) : 0,
  };
}

export function decorateEvalProgress(evalRow) {
  const latestRun = evalRow.runs?.[0] ?? null;
  const responses = latestRun?.responses ?? [];
  const assignments = latestRun?.reviewAssignments ?? [];
  const ratings = latestRun?.ratings ?? [];
  const criterionCount = latestRun?._count?.criterionSnapshots ?? 0;
  const responseTotal = Math.max(latestRun?._count?.responses ?? 0, responses.length);
  const reviewerTotal = Math.max(latestRun?._count?.reviewAssignments ?? 0, assignments.length);
  const responseProgress = ratioProgress(
    responses.filter(response => response.responseText != null && response.responseText !== '').length,
    responseTotal
  );

  const scoredCriteria = new Map();
  for (const rating of ratings) {
    const key = `${rating.reviewerUserId}:${rating.responseId}`;
    if (!scoredCriteria.has(key)) scoredCriteria.set(key, new Set());
    scoredCriteria.get(key).add(rating.criterionSnapshotId);
  }

  let completedResponseReviews = 0;
  if (criterionCount > 0) {
    for (const assignment of assignments) {
      for (const response of responses) {
        if ((scoredCriteria.get(`${assignment.userId}:${response.id}`)?.size ?? 0) >= criterionCount) {
          completedResponseReviews++;
        }
      }
    }
  }

  let topModelName = null;
  let topModelAverage = -Infinity;
  if (latestRun?.status === 'COMPLETED') {
    const responseModelIds = new Map(responses.map(response => [response.id, response.modelSnapshotId]));
    const scoresByModel = new Map();
    for (const rating of ratings) {
      const modelId = responseModelIds.get(rating.responseId);
      if (!modelId || rating.score == null) continue;
      if (!scoresByModel.has(modelId)) scoresByModel.set(modelId, []);
      scoresByModel.get(modelId).push(rating.score);
    }
    for (const model of latestRun.modelSnapshots ?? []) {
      const scores = scoresByModel.get(model.id) ?? [];
      if (!scores.length) continue;
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (average > topModelAverage) {
        topModelAverage = average;
        topModelName = model.displayName;
      }
    }
  }

  return {
    ...evalRow,
    progress: {
      setupDone: Boolean(latestRun),
      responses: responseProgress,
      reviews: ratioProgress(completedResponseReviews, responseTotal * reviewerTotal),
      allDone: latestRun?.status === 'COMPLETED',
    },
    completedSummary: latestRun?.status === 'COMPLETED'
      ? {
          firstRunDate: evalRow.createdAt,
          lastRunDate: latestRun.completedAt ?? latestRun.updatedAt,
          runCount: evalRow._count?.runs ?? 0,
          modelCount: latestRun._count?.modelSnapshots ?? 0,
          reviewerCount: latestRun._count?.reviewAssignments ?? 0,
          topModelName,
        }
      : null,
  };
}

export async function listEvals(organizationId) {
  const evals = await db.eval.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { runs: true } },
      runs: { orderBy: { runNumber: 'desc' }, take: 1, include: latestRunProgressInclude },
    },
  });
  return evals.map(decorateEvalProgress);
}

export function getEvalById(organizationId, evalId) {
  return db.eval.findFirst({ where: { id: evalId, organizationId, archivedAt: null } });
}

export function getEvalRow(organizationId, publicId) {
  return db.eval.findFirst({
    where: { publicId, organizationId, archivedAt: null },
    include: { _count: { select: { runs: true } } },
  });
}

export function getEvalByPublicId(organizationId, publicId) {
  return db.eval.findFirst({
    where: { publicId, organizationId, archivedAt: null },
    include: {
      runs: {
        orderBy: { runNumber: 'desc' },
        include: { _count: { select: { responses: true, modelSnapshots: true } } },
      },
    },
  });
}

export function createEval(organizationId, { title, description, createdByUserId }) {
  return db.eval.create({
    data: { organizationId, title, description: description || null, createdByUserId },
  });
}

export function updateEval(organizationId, publicId, { title, description }) {
  return db.eval.updateMany({
    where: { publicId, organizationId },
    data: { title, description: description || null },
  });
}

export function archiveEval(organizationId, publicId) {
  return db.eval.updateMany({
    where: { publicId, organizationId },
    data: { archivedAt: new Date() },
  });
}

// ---- Run launch ----

function normalizeIds(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

// Map a stored provider display name to an @rumbo/ai provider string.
// Returns null for providers the platform AI layer does not implement.
export function aiProviderFor(providerName) {
  const p = (providerName || '').toLowerCase();
  if (p === 'openai') return 'openai';
  if (p === 'anthropic') return 'anthropic';
  return null; // google/other not implemented in @rumbo/ai for the MVP
}

export function isLiveCollectable(modelSnapshot) {
  return !modelSnapshot.isManual
    && Boolean(aiProviderFor(modelSnapshot.providerName))
    && Boolean(modelSnapshot.providerModelName);
}

// Launch a run: snapshot prompt/criteria/models and create one response slot per
// model, all in a single transaction. Returns the created run.
export async function launchRun(organizationId, evalId, {
  promptText, criterionIds, modelIds, hideModelNames, hidePeerReviews, reviewClosesAt, launchedByUserId,
}) {
  const wantedCriteria = normalizeIds(criterionIds);
  const wantedModels = normalizeIds(modelIds);

  const [orgModels, orgCriteria, runCount] = await Promise.all([
    db.evalOrgModel.findMany({
      where: { organizationId, deletedAt: null, id: { in: wantedModels } },
      include: { provider: true, providerModel: true },
    }),
    db.evalCriterion.findMany({
      where: { organizationId, archivedAt: null, id: { in: wantedCriteria } },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    }),
    db.evalRun.count({ where: { evalId } }),
  ]);

  return db.$transaction(async (tx) => {
    const run = await tx.evalRun.create({
      data: {
        organizationId,
        evalId,
        runNumber: runCount + 1,
        status: 'COLLECTING_RESPONSES',
        hideModelNames: Boolean(hideModelNames),
        hidePeerReviews: Boolean(hidePeerReviews),
        reviewClosesAt: reviewClosesAt ? new Date(reviewClosesAt) : null,
        launchedByUserId,
      },
    });

    await tx.evalPromptSnapshot.create({ data: { evalRunId: run.id, promptText } });

    await Promise.all(orgCriteria.map((c, i) =>
      tx.evalCriterionSnapshot.create({
        data: {
          evalRunId: run.id,
          sourceCriterionId: c.id,
          title: c.title,
          description: c.description ?? null,
          displayOrder: i,
        },
      })));

    for (let i = 0; i < orgModels.length; i++) {
      const m = orgModels[i];
      const isManual = m.accessMethod === 'MANUAL' || !m.providerId || !m.providerModelId;
      const snapshot = await tx.evalModelSnapshot.create({
        data: {
          evalRunId: run.id,
          orgModelId: m.id,
          displayName: m.displayName,
          providerName: m.provider?.name ?? null,
          providerModelName: m.providerModel?.apiIdentifier ?? null,
          isManual,
          displayOrder: i,
        },
      });
      await tx.evalResponse.create({
        data: {
          organizationId,
          evalRunId: run.id,
          modelSnapshotId: snapshot.id,
          responseSource: isManual ? 'MANUAL' : 'PLATFORM_API',
          responseText: null,
        },
      });
    }

    return run;
  });
}

// ---- Run queries ----

export function getRunByPublicId(organizationId, publicId) {
  return db.evalRun.findFirst({
    where: { publicId, organizationId },
    include: {
      eval: true,
      promptSnapshot: true,
      criterionSnapshots: { orderBy: { displayOrder: 'asc' } },
      modelSnapshots: { orderBy: { displayOrder: 'asc' } },
      responses: { include: { modelSnapshot: true }, orderBy: { createdAt: 'asc' } },
    },
  });
}

export function getResponseByPublicId(organizationId, publicId) {
  return db.evalResponse.findFirst({
    where: { publicId, organizationId },
    include: {
      modelSnapshot: true,
      evalRun: { include: { eval: true, promptSnapshot: true } },
    },
  });
}

export async function saveManualResponse(organizationId, responseId, { text, userId }) {
  return db.evalResponse.updateMany({
    where: { id: responseId, organizationId },
    data: { responseText: text, responseSource: 'MANUAL', submittedByUserId: userId, submittedAt: new Date() },
  });
}

// Used by the worker after a live API call returns.
export function getResponseForCollection(responseId) {
  return db.evalResponse.findUnique({
    where: { id: responseId },
    include: {
      modelSnapshot: true,
      evalRun: { include: { promptSnapshot: true } },
    },
  });
}

export function applyCollectedResponse(responseId, { text, source }) {
  return db.evalResponse.update({
    where: { id: responseId },
    data: { responseText: text, responseSource: source, submittedAt: new Date() },
  });
}

// ---- Run lifecycle ----

const STATUS_TRANSITIONS = {
  COLLECTING_RESPONSES: ['READY_FOR_REVIEWS', 'CANCELLED'],
  READY_FOR_REVIEWS: ['COLLECTING_RESPONSES', 'IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['READY_FOR_REVIEWS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['IN_REVIEW'],
};

export async function setRunStatus(organizationId, runId, nextStatus) {
  const run = await db.evalRun.findFirst({ where: { id: runId, organizationId }, select: { status: true } });
  if (!run) throw new Error('Run not found.');
  const allowed = STATUS_TRANSITIONS[run.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot move run from ${run.status} to ${nextStatus}.`);
  }
  return db.evalRun.update({ where: { id: runId }, data: { status: nextStatus } });
}

// Summary of collection progress for a run's responses.
export function summarizeResponses(run) {
  const responses = run.responses ?? [];
  const collected = responses.filter(r => r.responseText != null && r.responseText !== '').length;
  return { total: responses.length, collected, missing: responses.length - collected };
}
