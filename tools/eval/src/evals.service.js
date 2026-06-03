// Eval authoring, run launch (with immutable snapshots), and response
// collection — data access, db-only so both the web router and the worker can
// import it. Every query is scoped by organizationId.

import { db } from '@rumbo/db';

// ---- Evaluations ----

export function listEvals(organizationId) {
  return db.eval.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { runs: true } } },
  });
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
  READY_FOR_REVIEWS: ['COLLECTING_RESPONSES', 'CANCELLED'],
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
