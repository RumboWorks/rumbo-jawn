// Eval settings data access — model catalog and evaluation criteria.
// Every query is scoped by organizationId for tenant isolation.

import { db } from '@rumbo/db';

// ---- Criteria ----

export async function listCriteria(organizationId) {
  return db.evalCriterion.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
  });
}

export async function createCriterion(organizationId, { title, description, createdByUserId }) {
  const max = await db.evalCriterion.aggregate({
    where: { organizationId, archivedAt: null },
    _max: { displayOrder: true },
  });
  return db.evalCriterion.create({
    data: {
      organizationId,
      title,
      description: description || null,
      displayOrder: (max._max.displayOrder ?? 0) + 1,
      createdByUserId,
    },
  });
}

export async function updateCriterion(organizationId, criterionId, { title, description }) {
  return db.evalCriterion.updateMany({
    where: { id: criterionId, organizationId },
    data: { title, description: description || null },
  });
}

export async function archiveCriterion(organizationId, criterionId) {
  return db.evalCriterion.updateMany({
    where: { id: criterionId, organizationId },
    data: { archivedAt: new Date() },
  });
}

// ---- Model catalog ----

export async function listProviders() {
  return db.evalProvider.findMany({
    orderBy: { name: 'asc' },
    include: {
      providerModels: { orderBy: { name: 'asc' } },
    },
  });
}

export async function listOrgModels(organizationId) {
  return db.evalOrgModel.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      provider: true,
      providerModel: true,
    },
  });
}

export async function createOrgModel(organizationId, {
  displayName, accessMethod, providerId, providerModelId, notes, createdByUserId,
}) {
  return db.evalOrgModel.create({
    data: {
      organizationId,
      displayName,
      accessMethod,
      providerId: providerId || null,
      providerModelId: providerModelId || null,
      notes: notes || null,
      createdByUserId,
    },
  });
}

export async function updateOrgModel(organizationId, modelId, {
  displayName, accessMethod, providerId, providerModelId, notes,
}) {
  return db.evalOrgModel.updateMany({
    where: { id: modelId, organizationId },
    data: {
      displayName,
      accessMethod,
      providerId: providerId || null,
      providerModelId: providerModelId || null,
      notes: notes || null,
    },
  });
}

export async function archiveOrgModel(organizationId, modelId) {
  return db.evalOrgModel.updateMany({
    where: { id: modelId, organizationId },
    data: { deletedAt: new Date() },
  });
}

// ---- Dashboard summary ----

export async function getDashboardSummary(organizationId) {
  const [evalCount, runCount, criteriaCount, modelCount, recentEvals] = await Promise.all([
    db.eval.count({ where: { organizationId, archivedAt: null } }),
    db.evalRun.count({ where: { organizationId } }),
    db.evalCriterion.count({ where: { organizationId, archivedAt: null } }),
    db.evalOrgModel.count({ where: { organizationId, deletedAt: null } }),
    db.eval.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { _count: { select: { runs: true } } },
    }),
  ]);
  return { evalCount, runCount, criteriaCount, modelCount, recentEvals };
}
