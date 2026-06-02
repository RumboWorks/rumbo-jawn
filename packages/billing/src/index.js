import { db } from '@rumbo/db';

export const TierKey = Object.freeze({
  FREE: 'free',
  SOLO: 'solo',
  TEAM: 'team',
  PARTNER: 'partner',
});

export const UsageKey = Object.freeze({
  SLU_ANALYSIS_ROLLING_7D: 'slu.analysis.rolling_7d',
});

export const DEFAULT_PRODUCT_TIERS = [
  {
    key: TierKey.FREE,
    name: 'Free',
    description: 'Free evaluation tier.',
    isDefault: true,
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true },
  },
  {
    key: TierKey.SOLO,
    name: 'Solo',
    description: 'Individual paid tier.',
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true },
  },
  {
    key: TierKey.TEAM,
    name: 'Team',
    description: 'Team tier for organizations.',
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true },
  },
  {
    key: TierKey.PARTNER,
    name: 'Partner',
    description: 'Partner tier for managed organization work.',
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true, partnerManagement: true },
  },
];

export const DEFAULT_AI_MODEL_CONFIG = [
  { callType: 'default', provider: 'openai', model: 'gpt-4o-mini' },
  { callType: 'crawl.summarize', provider: 'openai', model: 'gpt-4o-mini' },
  { callType: 'guidance.generate', provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  { callType: 'eval.score', provider: 'deepseek', model: 'deepseek-chat' },
];

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function seedBillingDefaults({ auditActorId = null } = {}) {
  const tiers = [];
  for (const tier of DEFAULT_PRODUCT_TIERS) {
    const saved = await db.productTier.upsert({
      where: { key: tier.key },
      update: {
        name: tier.name,
        description: tier.description,
        limits: tier.limits,
        features: tier.features,
        isDefault: tier.isDefault,
        isActive: true,
      },
      create: {
        key: tier.key,
        name: tier.name,
        description: tier.description,
        limits: tier.limits,
        features: tier.features,
        isDefault: tier.isDefault,
        isActive: true,
      },
    });
    tiers.push(saved);
  }

  for (const config of DEFAULT_AI_MODEL_CONFIG) {
    await db.aiModelConfig.upsert({
      where: { callType_scope_scopeId: { callType: config.callType, scope: 'platform', scopeId: '' } },
      update: { provider: config.provider, model: config.model, enabled: true },
      create: { ...config, scope: 'platform', scopeId: '', enabled: true },
    });
  }

  const defaultTier = tiers.find(tier => tier.isDefault) ?? tiers[0];
  const orgs = await db.organization.findMany({
    where: { deletedAt: null, entitlement: null },
    select: { id: true },
  });

  for (const org of orgs) {
    await db.organizationEntitlement.create({
      data: {
        orgId: org.id,
        tierId: defaultTier.id,
      },
    });
  }

  if (auditActorId) {
    await db.adminAuditLog.create({
      data: {
        actorId: auditActorId,
        action: 'billing.defaults.seeded',
        targetType: 'platform',
        targetId: 'billing-defaults',
        newValue: { tiers: tiers.map(tier => tier.key), orgEntitlementsCreated: orgs.length },
      },
    });
  }

  return { tiers, orgEntitlementsCreated: orgs.length };
}

export async function ensureOrgEntitlement(orgId, { tierKey = TierKey.FREE } = {}) {
  let entitlement = await db.organizationEntitlement.findUnique({
    where: { orgId },
    include: { tier: true, billingResponsibleUser: true, billingResponsibleMembership: true },
  });
  if (entitlement) return entitlement;

  let tier = await db.productTier.findUnique({ where: { key: tierKey } });
  if (!tier) {
    await seedBillingDefaults();
    tier = await db.productTier.findUnique({ where: { key: tierKey } });
  }
  if (!tier) throw new Error(`Product tier not found: ${tierKey}`);

  entitlement = await db.organizationEntitlement.create({
    data: { orgId, tierId: tier.id },
    include: { tier: true, billingResponsibleUser: true, billingResponsibleMembership: true },
  });
  return entitlement;
}

export async function getEffectiveEntitlement(orgId) {
  const entitlement = await ensureOrgEntitlement(orgId);
  return {
    id: entitlement.id,
    orgId: entitlement.orgId,
    tier: entitlement.tier,
    limits: entitlement.overrides?.limits ?? entitlement.tier.limits ?? {},
    features: { ...(entitlement.tier.features ?? {}), ...(entitlement.overrides?.features ?? {}) },
    aiSpendCapUsd: toNumber(entitlement.aiSpendCapUsd),
    billingResponsibleUser: entitlement.billingResponsibleUser,
    billingResponsibleMembership: entitlement.billingResponsibleMembership,
    stripe: {
      customerId: entitlement.stripeCustomerId,
      subscriptionId: entitlement.stripeSubscriptionId,
      priceId: entitlement.stripePriceId,
      status: entitlement.stripeSubscriptionStatus,
      currentPeriodStart: entitlement.stripeCurrentPeriodStart,
      currentPeriodEnd: entitlement.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd: entitlement.stripeCancelAtPeriodEnd,
    },
  };
}

export async function getUsageBudgetStatus(orgId, { tool, usageKey }) {
  const entitlement = await getEffectiveEntitlement(orgId);
  const budget = entitlement.limits?.[usageKey] ?? null;
  if (!budget) {
    return {
      orgId,
      tool,
      usageKey,
      hasBudget: false,
      overBudget: false,
      used: 0,
      limit: null,
      remaining: null,
      windowDays: null,
      policy: 'none',
      tier: entitlement.tier,
    };
  }

  const windowDays = budget.windowDays ?? 7;
  const used = await db.usageEvent.aggregate({
    where: {
      orgId,
      tool,
      usageKey,
      createdAt: { gte: daysAgo(windowDays) },
    },
    _sum: { quantity: true },
  });

  const quantity = used._sum.quantity ?? 0;
  const limit = budget.limit ?? 0;
  return {
    orgId,
    tool,
    usageKey,
    hasBudget: true,
    overBudget: quantity >= limit,
    used: quantity,
    limit,
    remaining: Math.max(limit - quantity, 0),
    windowDays,
    policy: budget.policy ?? 'soft',
    tier: entitlement.tier,
  };
}

export async function recordUsageEvent({ orgId, tool, usageKey, quantity = 1, jobId = null, meta = null }) {
  return db.usageEvent.create({
    data: { orgId, tool, usageKey, quantity, jobId, meta },
  });
}

export async function getOrgSpendStatus(orgId) {
  const entitlement = await getEffectiveEntitlement(orgId);
  const calls = await db.aiCall.aggregate({
    where: { job: { orgId } },
    _sum: { costUsd: true },
  });
  const spentUsd = toNumber(calls._sum.costUsd);
  return {
    orgId,
    spentUsd,
    capUsd: entitlement.aiSpendCapUsd,
    overCap: spentUsd >= entitlement.aiSpendCapUsd,
    tier: entitlement.tier,
  };
}

export async function assertOrgSpendAvailable(orgId) {
  if (!orgId) return { checked: false, overCap: false };
  const status = await getOrgSpendStatus(orgId);
  if (status.overCap) {
    throw new Error(`Organization AI spend cap reached (${status.spentUsd.toFixed(4)} / ${status.capUsd.toFixed(4)} USD).`);
  }
  return { checked: true, ...status };
}

export async function getAiModelConfig(callType, { orgId = null, tierKey = null } = {}) {
  if (orgId) {
    const orgConfig = await db.aiModelConfig.findUnique({
      where: { callType_scope_scopeId: { callType, scope: 'org', scopeId: orgId } },
    });
    if (orgConfig?.enabled) return orgConfig;
  }

  if (tierKey) {
    const tierConfig = await db.aiModelConfig.findUnique({
      where: { callType_scope_scopeId: { callType, scope: 'tier', scopeId: tierKey } },
    });
    if (tierConfig?.enabled) return tierConfig;
  }

  const platformConfig = await db.aiModelConfig.findUnique({
    where: { callType_scope_scopeId: { callType, scope: 'platform', scopeId: '' } },
  });
  if (platformConfig?.enabled) return platformConfig;

  const fallbackConfig = await db.aiModelConfig.findUnique({
    where: { callType_scope_scopeId: { callType: 'default', scope: 'platform', scopeId: '' } },
  });
  return fallbackConfig?.enabled ? fallbackConfig : null;
}

export async function setOrgTier({ orgId, tierKey, actorId = null, reason = null }) {
  const tier = await db.productTier.findUnique({ where: { key: tierKey } });
  if (!tier) throw new Error(`Product tier not found: ${tierKey}`);
  const before = await ensureOrgEntitlement(orgId);

  const updated = await db.organizationEntitlement.update({
    where: { orgId },
    data: { tierId: tier.id },
    include: { tier: true },
  });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'org.entitlement.tier_changed',
      targetType: 'organization',
      targetId: orgId,
      orgId,
      oldValue: { tierKey: before.tier.key },
      newValue: { tierKey: updated.tier.key },
      reason,
    },
  });

  return updated;
}
