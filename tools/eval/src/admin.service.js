// Platform-admin helpers for Eval data. Consumed by the platform admin router
// and the worker purge sweep (tool → platform service export is the allowed
// dependency direction).
//
// Run deletion is a trash can: "delete" sets EvalRun.deletedAt (hidden from
// every tool surface), the admin trash can restore it, and the worker sweep
// hard-purges runs trashed more than PURGE_AFTER_DAYS ago.

import { db } from '@rumbo/db';
import { cancelRunTasks } from './notify.service.js';

export const PURGE_AFTER_DAYS = 30;

// Cross-org run list for the admin panel — live and trashed (the template
// splits on run.deletedAt). Org names are resolved with a follow-up query
// because Eval tables reference Organization by scalar id.
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

// Move a run to the trash. Open tasks are cancelled (the work no longer
// exists); if this was the eval's last live run, the eval is archived too —
// an eval with no runs should disappear from the tool.
export async function trashEvalRun({ runId }) {
  const run = await db.evalRun.findUnique({
    where: { id: runId },
    include: { eval: { select: { id: true, title: true, archivedAt: true } } },
  });
  if (!run) throw new Error('Run not found.');
  if (run.deletedAt) throw new Error('Run is already in the trash.');

  await db.evalRun.update({ where: { id: runId }, data: { deletedAt: new Date() } });
  await cancelRunTasks(run.organizationId, runId);

  let evalArchived = false;
  const liveSiblings = await db.evalRun.count({ where: { evalId: run.evalId, deletedAt: null } });
  if (liveSiblings === 0 && !run.eval.archivedAt) {
    await db.eval.update({ where: { id: run.evalId }, data: { archivedAt: new Date() } });
    evalArchived = true;
  }

  return { run, evalArchived };
}

// Restore a trashed run. If trashing it archived its eval, un-archive the
// eval too so the run is reachable again. (Tasks cancelled by the trash stay
// cancelled — reviewers can be re-assigned from the run page.)
export async function restoreEvalRun({ runId }) {
  const run = await db.evalRun.findUnique({
    where: { id: runId },
    include: { eval: { select: { id: true, title: true, archivedAt: true } } },
  });
  if (!run) throw new Error('Run not found.');
  if (!run.deletedAt) throw new Error('Run is not in the trash.');

  await db.evalRun.update({ where: { id: runId }, data: { deletedAt: null } });

  let evalRestored = false;
  if (run.eval.archivedAt) {
    await db.eval.update({ where: { id: run.evalId }, data: { archivedAt: null } });
    evalRestored = true;
  }

  return { run, evalRestored };
}

// Hard-deletes a run and everything under it. Snapshots, responses, ratings,
// comments, assignments, report, and tasks cascade from EvalRun in the schema;
// notifications reference the run by scalar id (no relation), so they are
// removed explicitly in the same transaction.
export async function deleteEvalRunCascade({ runId }) {
  const run = await db.evalRun.findUnique({
    where: { id: runId },
    include: { eval: { select: { id: true, title: true, archivedAt: true } } },
  });
  if (!run) throw new Error('Run not found.');

  await db.$transaction([
    db.evalNotification.deleteMany({ where: { evalRunId: runId } }),
    db.evalRun.delete({ where: { id: runId } }),
  ]);

  // An archived eval whose last run is gone for good has nothing left to show.
  const remaining = await db.evalRun.count({ where: { evalId: run.evalId } });
  if (remaining === 0 && run.eval.archivedAt) {
    await db.eval.delete({ where: { id: run.evalId } });
  }

  return run;
}

// Worker sweep: hard-purge runs that have sat in the trash past the window.
export async function purgeExpiredTrashedRuns({ olderThanDays = PURGE_AFTER_DAYS } = {}) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const expired = await db.evalRun.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true },
  });
  for (const run of expired) {
    await deleteEvalRunCascade({ runId: run.id });
  }
  return { purged: expired.length };
}
