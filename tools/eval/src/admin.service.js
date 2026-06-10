// Platform-admin helpers for Eval data. Consumed by the platform admin router
// (tool → platform service export is the allowed dependency direction).

import { db } from '@rumbo/db';

// Cross-org run list for the admin panel. Org names are resolved with a
// follow-up query because Eval tables reference Organization by scalar id.
export async function listEvalRunsForAdmin({ limit = 50 } = {}) {
  const runs = await db.evalRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      eval: { select: { title: true, publicId: true } },
      _count: { select: { responses: true, ratings: true, reviewAssignments: true } },
    },
  });

  const orgIds = [...new Set(runs.map(run => run.organizationId))];
  const orgs = await db.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true, slug: true, deletedAt: true },
  });
  const orgById = Object.fromEntries(orgs.map(org => [org.id, org]));

  return runs.map(run => ({ ...run, org: orgById[run.organizationId] ?? null }));
}

// Hard-deletes a run and everything under it. Snapshots, responses, ratings,
// comments, assignments, report, and tasks cascade from EvalRun in the schema;
// notifications reference the run by scalar id (no relation), so they are
// removed explicitly in the same transaction.
export async function deleteEvalRunCascade({ runId }) {
  const run = await db.evalRun.findUnique({
    where: { id: runId },
    include: { eval: { select: { title: true } } },
  });
  if (!run) throw new Error('Run not found.');

  await db.$transaction([
    db.evalNotification.deleteMany({ where: { evalRunId: runId } }),
    db.evalRun.delete({ where: { id: runId } }),
  ]);

  return run;
}
