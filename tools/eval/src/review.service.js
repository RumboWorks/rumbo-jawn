// Eval review workflow + report — data access (db-only). Scoped by
// organizationId. Builds on evals.service for run loading.

import { randomBytes } from 'node:crypto';
import { db } from '@rumbo/db';
import { getRunByPublicId } from './evals.service.js';
import { formatResponseText } from './markdown.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ---- Reviewer assignment ----

// Org members who can be assigned as reviewers: anyone with an eval ToolGrant
// in this org (a reviewer must have eval access; eval is not org-open).
export async function listAssignableReviewers(organizationId) {
  const grants = await db.toolGrant.findMany({
    where: { orgId: organizationId, tool: 'eval' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return grants.map(g => ({ ...g.user, role: g.role }));
}

export function listRunAssignments(organizationId, evalRunId) {
  return db.evalReviewAssignment.findMany({
    where: { organizationId, evalRunId },
    orderBy: { assignedAt: 'asc' },
  });
}

// Reconcile a run's reviewers to exactly `userIds`. Adds new assignments and
// removes those no longer selected (keeps already-completed ones to preserve
// their review). Returns nothing.
export async function setRunReviewers(organizationId, evalRunId, userIds, assignedByUserId) {
  const wanted = new Set(userIds);
  const existing = await db.evalReviewAssignment.findMany({ where: { organizationId, evalRunId } });
  const existingByUser = new Map(existing.map(a => [a.userId, a]));

  const toAdd = [...wanted].filter(id => !existingByUser.has(id));
  const toRemove = existing.filter(a => !wanted.has(a.userId) && a.completedAt == null);

  await db.$transaction([
    ...toAdd.map(userId => db.evalReviewAssignment.create({
      data: { organizationId, evalRunId, userId, assignedByUserId },
    })),
    ...toRemove.map(a => db.evalReviewAssignment.delete({ where: { id: a.id } })),
  ]);

  return { added: toAdd, removed: toRemove.map(a => a.userId) };
}

export async function isAssigned(organizationId, evalRunId, userId) {
  const a = await db.evalReviewAssignment.findFirst({
    where: { organizationId, evalRunId, userId },
    select: { id: true, completedAt: true },
  });
  return a;
}

// ---- Review page data (tabbed, one response at a time) ----

function responseLabels(run) {
  const labels = {};
  const submitted = run.responses.filter(r => r.responseText != null && r.responseText !== '');
  submitted.forEach((r, i) => {
    labels[r.id] = run.hideModelNames
      ? `Response ${ALPHABET[i] ?? i + 1}`
      : (r.modelSnapshot?.displayName ?? `Response ${i + 1}`);
  });
  return labels;
}

export async function getReviewData(organizationId, runPublicId, reviewerUserId) {
  const run = await getRunByPublicId(organizationId, runPublicId);
  if (!run) return null;

  const [ratings, comments] = await Promise.all([
    db.evalRating.findMany({ where: { organizationId, evalRunId: run.id, reviewerUserId } }),
    db.evalReviewComment.findMany({ where: { organizationId, evalRunId: run.id, reviewerUserId } }),
  ]);

  // ratings: responseId -> criterionSnapshotId -> score
  const ratingMap = {};
  for (const r of ratings) {
    (ratingMap[r.responseId] ??= {})[r.criterionSnapshotId] = r.score;
  }
  // comments: responseId -> text
  const commentMap = {};
  for (const c of comments) if (c.responseId) commentMap[c.responseId] = c.commentText;

  const submittedResponses = run.responses
    .filter(r => r.responseText != null && r.responseText !== '')
    .sort((a, b) => (a.modelSnapshot?.displayOrder ?? 0) - (b.modelSnapshot?.displayOrder ?? 0));

  const totalExpected = submittedResponses.length * run.criterionSnapshots.length;
  const totalGiven = ratings.length;

  return {
    run,
    submittedResponses: submittedResponses.map(response => ({
      ...response,
      responseDisplay: formatResponseText(response.responseText),
    })),
    criteria: run.criterionSnapshots,
    ratings: ratingMap,
    comments: commentMap,
    labels: responseLabels(run),
    totalExpected,
    totalGiven,
  };
}

// ---- Autosave ----

export async function upsertRating(organizationId, evalRunId, { responseId, criterionSnapshotId, reviewerUserId, score }) {
  return db.evalRating.upsert({
    where: {
      evalRunId_responseId_criterionSnapshotId_reviewerUserId: {
        evalRunId, responseId, criterionSnapshotId, reviewerUserId,
      },
    },
    update: { score, submittedAt: new Date() },
    create: { organizationId, evalRunId, responseId, criterionSnapshotId, reviewerUserId, score, submittedAt: new Date() },
  });
}

export async function upsertComment(organizationId, evalRunId, { responseId, reviewerUserId, commentText }) {
  const existing = await db.evalReviewComment.findFirst({
    where: { organizationId, evalRunId, responseId, reviewerUserId },
    select: { id: true },
  });
  if (existing) {
    return db.evalReviewComment.update({ where: { id: existing.id }, data: { commentText } });
  }
  return db.evalReviewComment.create({
    data: { organizationId, evalRunId, responseId, reviewerUserId, commentText },
  });
}

export async function submitReview(organizationId, evalRunId, reviewerUserId) {
  return db.evalReviewAssignment.updateMany({
    where: { organizationId, evalRunId, userId: reviewerUserId, completedAt: null },
    data: { completedAt: new Date() },
  });
}

// Runs a user is assigned to and can still review (open for review).
export async function listMyOpenReviews(organizationId, userId) {
  const assignments = await db.evalReviewAssignment.findMany({
    where: { organizationId, userId, completedAt: null, evalRun: { status: 'IN_REVIEW' } },
    include: { evalRun: { include: { eval: true } } },
    orderBy: { assignedAt: 'desc' },
  });
  return assignments.map(a => a.evalRun);
}

// ---- Report aggregation (models × criteria heatmap) ----

function avg(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}
function round1(v) {
  return v == null ? null : Math.round(v * 10) / 10;
}
export function heatClass(v) {
  if (v == null) return 'heat-0';
  if (v >= 4.5) return 'heat-5';
  if (v >= 3.5) return 'heat-4';
  if (v >= 2.5) return 'heat-3';
  if (v >= 1.5) return 'heat-2';
  return 'heat-1';
}

// Build the report matrix from all reviewers' ratings. `reveal` controls whether
// model names are shown (manager view = always; share view honors hideModelNames).
export async function getReportData(organizationId, runPublicId, { reveal = true } = {}) {
  const run = await getRunByPublicId(organizationId, runPublicId);
  if (!run) return null;
  return buildReport(run, { reveal });
}

async function buildReport(run, { reveal }) {
  const [ratings, comments, report] = await Promise.all([
    db.evalRating.findMany({ where: { evalRunId: run.id } }),
    db.evalReviewComment.findMany({ where: { evalRunId: run.id } }),
    db.evalReport.findFirst({ where: { evalRunId: run.id } }),
  ]);

  const responseToModel = {};
  for (const r of run.responses) responseToModel[r.id] = r.modelSnapshotId;

  // modelSnapshotId -> criterionSnapshotId -> [scores]
  const agg = {};
  for (const rt of ratings) {
    const modelId = responseToModel[rt.responseId];
    if (!modelId) continue;
    ((agg[modelId] ??= {})[rt.criterionSnapshotId] ??= []).push(rt.score);
  }

  const showNames = reveal && !run.hideModelNames;
  const models = [...run.modelSnapshots].sort((a, b) => a.displayOrder - b.displayOrder);
  const criteria = [...run.criterionSnapshots].sort((a, b) => a.displayOrder - b.displayOrder);

  const matrix = models.map((m, i) => {
    const cells = criteria.map(c => {
      const scores = agg[m.id]?.[c.id] ?? [];
      const a = round1(avg(scores));
      return { criterionId: c.id, criterionTitle: c.title, average: a, count: scores.length, heatClass: heatClass(a) };
    });
    const modelAvg = round1(avg(cells.flatMap(c => (c.average == null ? [] : [c.average]))));
    return {
      modelId: m.id,
      modelName: showNames ? m.displayName : `Response ${ALPHABET[i] ?? i + 1}`,
      modelAvg,
      modelAvgHeatClass: heatClass(modelAvg),
      cells,
    };
  });

  const criterionAverages = criteria.map(c => {
    const all = models.flatMap(m => agg[m.id]?.[c.id] ?? []);
    const a = round1(avg(all));
    return { criterionId: c.id, criterionTitle: c.title, average: a, heatClass: heatClass(a) };
  });
  const overall = round1(avg(ratings.map(r => r.score)));

  const drilldowns = {};
  for (const response of run.responses) {
    const model = models.find(m => m.id === response.modelSnapshotId);
    if (!model) continue;
    drilldowns[model.id] = {
      responseText: response.responseText,
      responseDisplay: formatResponseText(response.responseText),
      scores: ratings.filter(r => r.responseId === response.id),
      comments: comments.filter(c => c.responseId === response.id),
    };
  }

  return { run, matrix, criteria, criterionAverages, overall, overallHeatClass: heatClass(overall), report, showNames, drilldowns };
}

export async function listReports(organizationId) {
  return db.evalReport.findMany({
    where: { organizationId },
    include: { evalRun: { include: { eval: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEvalDetailReports(organizationId, evalRecord) {
  const completedRuns = (evalRecord?.runs ?? []).filter(run => run.status === 'COMPLETED');
  const reports = (await Promise.all(completedRuns.map(run => getReportData(organizationId, run.publicId, { reveal: true }))))
    .filter(Boolean);
  // Trend bump chart: one point per model per run, ranked within each run by
  // average (rank 1 = best). Chronological (oldest run first) so the x-axis
  // reads left→right over time. `reports` is newest-first, so reverse it.
  const chronological = [...reports].reverse();
  const trendData = chronological.flatMap((data, runIdx) => {
    const ranked = data.matrix
      .filter(row => row.modelAvg != null)
      .sort((a, b) => b.modelAvg - a.modelAvg);
    const rankByModel = new Map(ranked.map((row, i) => [row.modelName, i + 1]));
    return data.matrix.map(row => ({
      runIdx,
      runNumber: data.run.runNumber,
      runLabel: runDateLabel(data.run),
      modelName: row.modelName,
      rank: rankByModel.get(row.modelName) ?? null,
      avgScore: row.modelAvg,
    }));
  });

  // Cross-run drilldown data for the score-cell modal. Keyed by model name so
  // the same model can be tracked across runs (each run has its own snapshot
  // id). Each model carries the runs it appeared in; the run nav (date toggle)
  // and model nav let the user move between them.
  const runList = reports.map(data => ({ id: data.run.publicId, label: runDateLabel(data.run) }));
  const drilldowns = {};
  for (const data of reports) {
    const runId = data.run.publicId;
    const label = runDateLabel(data.run);
    for (const row of data.matrix) {
      const entry = (drilldowns[row.modelName] ??= { runs: [] });
      const drill = data.drilldowns[row.modelId] ?? {};
      entry.runs.push({
        id: runId,
        label,
        average: row.modelAvg,
        responseHtml: drill.responseDisplay?.html ?? '',
        responseText: drill.responseDisplay?.original ?? drill.responseText ?? '',
        comments: (drill.comments ?? []).map(c => c.commentText),
        criteria: row.cells.map(c => ({ title: c.criterionTitle, average: c.average })),
      });
    }
  }

  return { reports, trendData, drilldowns, runList };
}

function runDateLabel(run) {
  return new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---- Report text + sharing ----

export async function completeRunAndReport(organizationId, evalRunId, userId) {
  await db.evalRun.update({
    where: { id: evalRunId },
    data: { status: 'COMPLETED', completedByUserId: userId, completedAt: new Date() },
  });
  const existing = await db.evalReport.findFirst({ where: { evalRunId } });
  if (!existing) {
    await db.evalReport.create({ data: { organizationId, evalRunId, createdByUserId: userId } });
  }
}

export function updateReportText(organizationId, evalRunId, { summaryText, recommendationText }) {
  return db.evalReport.updateMany({
    where: { organizationId, evalRunId },
    data: { summaryText: summaryText || null, recommendationText: recommendationText || null },
  });
}

export async function setReportShare(organizationId, evalRunId, enabled) {
  const report = await db.evalReport.findFirst({ where: { organizationId, evalRunId } });
  if (!report) throw new Error('Report not found.');
  const token = enabled ? (report.secureShareToken ?? cryptoToken()) : report.secureShareToken;
  return db.evalReport.update({
    where: { id: report.id },
    data: { secureShareEnabled: enabled, secureShareToken: token },
  });
}

export async function getReportByShareToken(token) {
  const report = await db.evalReport.findFirst({
    where: { secureShareToken: token, secureShareEnabled: true },
  });
  if (!report) return null;
  const run = await getRunByPublicId(report.organizationId, await runPublicIdFor(report.evalRunId));
  if (!run) return null;
  return buildReport(run, { reveal: false });
}

async function runPublicIdFor(evalRunId) {
  const run = await db.evalRun.findUnique({ where: { id: evalRunId }, select: { publicId: true } });
  return run?.publicId;
}

function cryptoToken() {
  // 32 hex chars, unguessable enough for a share link.
  return randomBytes(16).toString('hex');
}
