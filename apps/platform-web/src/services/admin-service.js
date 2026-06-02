import { db } from '@rumbo/db';
import {
  getOrgSpendStatus,
  getUsageBudgetStatus,
  UsageKey,
} from '@rumbo/billing';

const RECENT_LIMIT = 10;
const LIST_LIMIT = 50;

function decimalToNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function compactJob(job) {
  const aiCalls = job.aiCalls ?? [];
  const aiCostUsd = aiCalls.reduce((total, call) => total + decimalToNumber(call.costUsd), 0);
  const aiTokens = aiCalls.reduce((total, call) => total + (call.totalTokens ?? 0), 0);

  return {
    ...job,
    aiCostUsd,
    aiTokens,
    aiCallCount: aiCalls.length,
    sourceUrl: job.payload?.url ?? null,
    organizationName: job.result?.orgName ?? job.org?.name ?? null,
  };
}

function safeJson(value) {
  if (value === null || value === undefined) return '';
  return JSON.stringify(value, null, 2);
}

export async function getAdminDashboard() {
  const [
    userCount,
    orgCount,
    partnerCount,
    jobCount,
    failedJobCount,
    runningJobCount,
    aiSummary,
    recentJobs,
    recentFailures,
    recentAiCalls,
    recentSluRuns,
  ] = await Promise.all([
    db.user.count(),
    db.organization.count({ where: { deletedAt: null } }),
    db.partnerAccount.count(),
    db.job.count(),
    db.job.count({ where: { status: 'FAILED' } }),
    db.job.count({ where: { status: 'RUNNING' } }),
    db.aiCall.aggregate({
      _sum: { costUsd: true, promptTokens: true, outputTokens: true, totalTokens: true },
      _count: true,
    }),
    db.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
      include: { user: true, org: true, aiCalls: true },
    }),
    db.job.findMany({
      where: { status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { user: true, org: true, aiCalls: true },
    }),
    db.aiCall.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { job: { include: { user: true, org: true } } },
    }),
    db.job.findMany({
      where: { type: 'slu.analysis' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true, org: true, aiCalls: true },
    }),
  ]);

  return {
    metrics: {
      userCount,
      orgCount,
      partnerCount,
      jobCount,
      failedJobCount,
      runningJobCount,
      aiCallCount: aiSummary._count,
      aiCostUsd: decimalToNumber(aiSummary._sum.costUsd),
      aiTokens: aiSummary._sum.totalTokens ?? 0,
    },
    recentJobs: recentJobs.map(compactJob),
    recentFailures: recentFailures.map(compactJob),
    recentAiCalls,
    recentSluRuns: recentSluRuns.map(compactJob),
  };
}

export async function listAdminUsers() {
  return db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
    include: {
      memberships: { include: { org: true }, orderBy: { createdAt: 'asc' } },
      partnerMemberships: { include: { partnerAccount: true }, orderBy: { createdAt: 'asc' } },
      _count: { select: { jobs: true } },
    },
  });
}

export async function getAdminUserDetail(userId) {
  const [user, organizations, auditLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: true,
        memberships: { include: { org: true }, orderBy: { createdAt: 'asc' } },
        partnerMemberships: { include: { partnerAccount: true }, orderBy: { createdAt: 'asc' } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 10, include: { aiCalls: true, org: true } },
        _count: { select: { jobs: true } },
      },
    }),
    db.organization.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, organizationType: true },
    }),
    db.adminAuditLog.findMany({
      where: { targetType: 'user', targetId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: true, org: true },
    }),
  ]);

  if (!user) return null;
  return {
    ...user,
    recentJobs: user.jobs.map(compactJob),
    organizations,
    auditLogs,
  };
}

export async function listAdminOrganizations() {
  const orgs = await db.organization.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
    include: {
      entitlement: {
        include: {
          tier: true,
          billingResponsibleUser: true,
          billingResponsibleMembership: { include: { user: true } },
        },
      },
      memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      invites: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        include: { invitedBy: true },
        orderBy: { createdAt: 'desc' },
      },
      partnerAccesses: {
        where: { removedAt: null },
        include: { partnerAccount: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { jobs: true, approvedDomains: true } },
    },
  });

  return Promise.all(orgs.map(async (org) => ({
    ...org,
    sluBudgetStatus: await getUsageBudgetStatus(org.id, {
      tool: 'slu',
      usageKey: UsageKey.SLU_ANALYSIS_ROLLING_7D,
    }),
    spendStatus: await getOrgSpendStatus(org.id),
  })));
}

export async function getAdminOrganizationDetail(orgId) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      entitlement: {
        include: {
          tier: true,
          billingResponsibleUser: true,
          billingResponsibleMembership: { include: { user: true } },
        },
      },
      memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      partnerAccesses: {
        where: { removedAt: null },
        include: { partnerAccount: true },
        orderBy: { createdAt: 'desc' },
      },
      jobs: { orderBy: { createdAt: 'desc' }, take: 10, include: { aiCalls: true } },
    },
  });
  if (!org) return null;

  const [tiers, sluBudgetStatus, spendStatus, auditLogs] = await Promise.all([
    db.productTier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    getUsageBudgetStatus(org.id, { tool: 'slu', usageKey: UsageKey.SLU_ANALYSIS_ROLLING_7D }),
    getOrgSpendStatus(org.id),
    db.adminAuditLog.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: true },
    }),
  ]);

  return {
    ...org,
    tiers,
    managerMemberships: org.memberships.filter(membership => membership.role === 'MANAGER'),
    sluBudgetStatus,
    spendStatus,
    recentJobs: org.jobs.map(compactJob),
    auditLogs,
  };
}

export async function getAdminProductControls() {
  const [tiers, aiModelConfigs, featureFlags, auditLogs] = await Promise.all([
    db.productTier.findMany({ orderBy: { name: 'asc' } }),
    db.aiModelConfig.findMany({ orderBy: [{ tool: 'asc' }, { callType: 'asc' }, { scope: 'asc' }] }),
    db.featureFlag.findMany({ orderBy: [{ key: 'asc' }, { scope: 'asc' }] }),
    db.adminAuditLog.findMany({
      where: {
        OR: [
          { targetType: 'feature_flag' },
          { targetType: 'ai_model_config' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: true },
    }),
  ]);

  return { tiers, aiModelConfigs, featureFlags, auditLogs };
}

export async function getAdminAiModelConfig(configId) {
  if (configId === 'new') return null;
  return db.aiModelConfig.findUnique({ where: { id: configId } });
}

export async function getAdminFeatureFlag(flagId) {
  if (flagId === 'new') return null;
  return db.featureFlag.findUnique({ where: { id: flagId } });
}

export async function listAdminAuditLogs() {
  return db.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
    include: { actor: true, org: true },
  });
}

export async function listAdminJobs({ type = null, status = null } = {}) {
  const jobs = await db.job.findMany({
    where: {
      ...(type && { type }),
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
    include: { user: true, org: true, aiCalls: true },
  });

  return jobs.map(compactJob);
}

export async function listAdminAiCalls() {
  const calls = await db.aiCall.findMany({
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
    include: { job: { include: { user: true, org: true } } },
  });

  return calls.map(call => ({
    ...call,
    costUsdNumber: decimalToNumber(call.costUsd),
  }));
}

export async function getAdminJobDetail(jobId) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { user: true, org: true, aiCalls: true, artifacts: true },
  });

  if (!job) return null;

  return {
    ...compactJob(job),
    payloadJson: safeJson(job.payload),
    resultJson: safeJson(job.result),
  };
}
