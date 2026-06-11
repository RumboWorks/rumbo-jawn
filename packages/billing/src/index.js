import { db } from '@rumbo/db';

export {
  isStripeConfigured,
  getStripe,
  tierForPriceId,
  listPurchasableTiers,
  createCheckoutSession,
  createPortalSession,
  syncEntitlementFromSubscription,
  handleWebhookEvent,
  verifyWebhookSignature,
  adminCancelSubscription,
} from './stripe-service.js';

export const TierKey = Object.freeze({
  FREE: 'free',
  SOLO: 'solo',
  TEAM: 'team',
  PARTNER: 'partner',
});

export const UsageKey = Object.freeze({
  SLU_ANALYSIS_ROLLING_7D: 'slu.analysis.rolling_7d',
  EVAL_RESPONSE_COLLECTION: 'eval.response_collection',
});

export const DEFAULT_PRODUCT_TIERS = [
  {
    key: TierKey.FREE,
    name: 'Free',
    description: 'Free evaluation tier.',
    isDefault: true,
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
      [UsageKey.EVAL_RESPONSE_COLLECTION]: { limit: 50, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true, eval: true },
  },
  {
    key: TierKey.SOLO,
    name: 'Solo',
    description: 'Individual paid tier.',
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
      [UsageKey.EVAL_RESPONSE_COLLECTION]: { limit: 50, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true, eval: true },
  },
  {
    key: TierKey.TEAM,
    name: 'Team',
    description: 'Team tier for organizations.',
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
      [UsageKey.EVAL_RESPONSE_COLLECTION]: { limit: 50, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true, eval: true },
  },
  {
    key: TierKey.PARTNER,
    name: 'Partner',
    description: 'Partner tier for managed organization work.',
    limits: {
      [UsageKey.SLU_ANALYSIS_ROLLING_7D]: { limit: 10, windowDays: 7, policy: 'soft' },
      [UsageKey.EVAL_RESPONSE_COLLECTION]: { limit: 50, windowDays: 7, policy: 'soft' },
    },
    features: { slu: true, eval: true, partnerManagement: true },
  },
];

export const DEFAULT_AI_MODEL_CONFIG = [
  { tool: 'platform', callType: 'default', provider: 'openai', model: 'gpt-4o-mini' },
  { tool: 'slu', callType: 'crawl.summarize', provider: 'openai', model: 'gpt-4o-mini' },
  { tool: 'slu', callType: 'guidance.generate', provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  { tool: 'eval', callType: 'response.collect', provider: 'openai', model: 'gpt-4o-mini' },
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

function parsePositiveInt(value, label) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be a non-negative integer.`);
  return number;
}

function parsePositiveNumber(value, label) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be a non-negative number.`);
  return number;
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
      where: { tool_callType_scope_scopeId: { tool: config.tool, callType: config.callType, scope: 'platform', scopeId: '' } },
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

  try {
    entitlement = await db.organizationEntitlement.create({
      data: { orgId, tierId: tier.id },
      include: { tier: true, billingResponsibleUser: true, billingResponsibleMembership: true },
    });
  } catch (err) {
    // Concurrent requests can race this create (P2002 on orgId) — the loser
    // reads the row the winner just made.
    if (err?.code !== 'P2002') throw err;
    entitlement = await db.organizationEntitlement.findUnique({
      where: { orgId },
      include: { tier: true, billingResponsibleUser: true, billingResponsibleMembership: true },
    });
  }
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

async function resolveTierKeyForOrg(orgId) {
  if (!orgId) return null;
  const entitlement = await ensureOrgEntitlement(orgId);
  return entitlement?.tier?.key ?? null;
}

export async function getAiModelConfig(callType, { tool = 'platform', orgId = null, tierKey = null } = {}) {
  const normalizedTool = tool || 'platform';
  const resolvedTierKey = tierKey ?? await resolveTierKeyForOrg(orgId);

  if (orgId) {
    const orgConfig = await db.aiModelConfig.findUnique({
      where: { tool_callType_scope_scopeId: { tool: normalizedTool, callType, scope: 'org', scopeId: orgId } },
    });
    if (orgConfig?.enabled) return orgConfig;
  }

  if (resolvedTierKey) {
    const tierConfig = await db.aiModelConfig.findUnique({
      where: { tool_callType_scope_scopeId: { tool: normalizedTool, callType, scope: 'tier', scopeId: resolvedTierKey } },
    });
    if (tierConfig?.enabled) return tierConfig;
  }

  const toolPlatformConfig = await db.aiModelConfig.findUnique({
    where: { tool_callType_scope_scopeId: { tool: normalizedTool, callType, scope: 'platform', scopeId: '' } },
  });
  if (toolPlatformConfig?.enabled) return toolPlatformConfig;

  const globalCallTypeConfig = await db.aiModelConfig.findUnique({
    where: { tool_callType_scope_scopeId: { tool: 'platform', callType, scope: 'platform', scopeId: '' } },
  });
  if (globalCallTypeConfig?.enabled) return globalCallTypeConfig;

  const fallbackConfig = await db.aiModelConfig.findUnique({
    where: { tool_callType_scope_scopeId: { tool: 'platform', callType: 'default', scope: 'platform', scopeId: '' } },
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

export async function setOrgBillingResponsible({ orgId, membershipId = null, actorId = null, reason = null }) {
  const before = await ensureOrgEntitlement(orgId);
  let membership = null;
  if (membershipId) {
    membership = await db.membership.findUnique({
      where: { id: membershipId },
      include: { user: true },
    });
    if (!membership || membership.orgId !== orgId || membership.role !== 'MANAGER') {
      throw new Error('Billing responsibility must be assigned to an organization manager.');
    }
  }

  const updated = await db.organizationEntitlement.update({
    where: { orgId },
    data: {
      billingResponsibleUserId: membership?.userId ?? null,
      billingResponsibleMembershipId: membership?.id ?? null,
    },
    include: {
      tier: true,
      billingResponsibleUser: true,
      billingResponsibleMembership: { include: { user: true } },
    },
  });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'org.entitlement.billing_responsible_changed',
      targetType: 'organization',
      targetId: orgId,
      orgId,
      oldValue: {
        billingResponsibleUserId: before.billingResponsibleUserId,
        billingResponsibleMembershipId: before.billingResponsibleMembershipId,
      },
      newValue: {
        billingResponsibleUserId: updated.billingResponsibleUserId,
        billingResponsibleMembershipId: updated.billingResponsibleMembershipId,
      },
      reason,
    },
  });

  return updated;
}

export async function setOrgSluBudget({ orgId, limit, windowDays, actorId = null, reason = null }) {
  const parsedLimit = parsePositiveInt(limit, 'Limit');
  const parsedWindowDays = parsePositiveInt(windowDays, 'Window days');
  if (parsedWindowDays < 1) throw new Error('Window days must be at least 1.');

  const before = await ensureOrgEntitlement(orgId);
  const overrides = before.overrides ?? {};
  const limits = { ...(overrides.limits ?? {}) };
  limits[UsageKey.SLU_ANALYSIS_ROLLING_7D] = {
    limit: parsedLimit,
    windowDays: parsedWindowDays,
    policy: 'soft',
  };

  const updated = await db.organizationEntitlement.update({
    where: { orgId },
    data: { overrides: { ...overrides, limits } },
    include: { tier: true },
  });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'org.entitlement.usage_budget_changed',
      targetType: 'organization',
      targetId: orgId,
      orgId,
      oldValue: before.overrides?.limits?.[UsageKey.SLU_ANALYSIS_ROLLING_7D] ?? before.tier.limits?.[UsageKey.SLU_ANALYSIS_ROLLING_7D] ?? null,
      newValue: limits[UsageKey.SLU_ANALYSIS_ROLLING_7D],
      reason,
    },
  });

  return updated;
}

export async function updateProductTierStripe({ tierId, stripePriceId, stripePriceIdAnnual, priceUsdMonthly, priceUsdAnnual, actorId = null, reason = null }) {
  const tier = await db.productTier.findUnique({ where: { id: tierId } });
  if (!tier) throw new Error(`Product tier not found: ${tierId}`);

  const priceIdMonthly = stripePriceId?.trim() || null;
  const priceIdAnnual = stripePriceIdAnnual?.trim() || null;
  const priceMonthly = priceUsdMonthly === '' || priceUsdMonthly == null ? null : parsePositiveNumber(priceUsdMonthly, 'Monthly price');
  const priceAnnual = priceUsdAnnual === '' || priceUsdAnnual == null ? null : parsePositiveNumber(priceUsdAnnual, 'Annual price');

  const updated = await db.productTier.update({
    where: { id: tierId },
    data: {
      stripePriceId: priceIdMonthly,
      stripePriceIdAnnual: priceIdAnnual,
      priceUsdMonthly: priceMonthly,
      priceUsdAnnual: priceAnnual,
    },
  });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'product_tier.stripe_updated',
      targetType: 'product_tier',
      targetId: tierId,
      oldValue: { stripePriceId: tier.stripePriceId, stripePriceIdAnnual: tier.stripePriceIdAnnual, priceUsdMonthly: tier.priceUsdMonthly, priceUsdAnnual: tier.priceUsdAnnual },
      newValue: { stripePriceId: priceIdMonthly, stripePriceIdAnnual: priceIdAnnual, priceUsdMonthly: priceMonthly, priceUsdAnnual: priceAnnual },
      reason,
    },
  });

  return updated;
}

export async function setOrgSpendCap({ orgId, aiSpendCapUsd, actorId = null, reason = null }) {
  const parsedCap = parsePositiveNumber(aiSpendCapUsd, 'Spend cap');
  const before = await ensureOrgEntitlement(orgId);

  const updated = await db.organizationEntitlement.update({
    where: { orgId },
    data: { aiSpendCapUsd: parsedCap },
    include: { tier: true },
  });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'org.entitlement.spend_cap_changed',
      targetType: 'organization',
      targetId: orgId,
      orgId,
      oldValue: { aiSpendCapUsd: toNumber(before.aiSpendCapUsd) },
      newValue: { aiSpendCapUsd: parsedCap },
      reason,
    },
  });

  return updated;
}

export async function upsertFeatureFlag({ id = null, key, enabled, scope = 'platform', scopeId = '', tool = '', config = null, actorId = null, reason = null }) {
  if (!key || typeof key !== 'string') throw new Error('Feature flag key is required.');
  const normalizedScopeId = scopeId ?? '';
  const normalizedTool = tool ?? '';
  const existing = id
    ? await db.featureFlag.findUnique({ where: { id } })
    : await db.featureFlag.findUnique({
        where: { key_scope_scopeId_tool: { key, scope, scopeId: normalizedScopeId, tool: normalizedTool } },
      });
  const data = { key, scope, scopeId: normalizedScopeId, tool: normalizedTool, enabled: Boolean(enabled), config };
  const flag = id && existing
    ? await db.featureFlag.update({ where: { id }, data })
    : await db.featureFlag.upsert({
        where: { key_scope_scopeId_tool: { key, scope, scopeId: normalizedScopeId, tool: normalizedTool } },
        update: { enabled: Boolean(enabled), config },
        create: data,
      });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'feature_flag.upserted',
      targetType: 'feature_flag',
      targetId: flag.id,
      oldValue: existing ? { enabled: existing.enabled, config: existing.config } : null,
      newValue: { key: flag.key, scope: flag.scope, scopeId: flag.scopeId, tool: flag.tool, enabled: flag.enabled, config: flag.config },
      reason,
    },
  });

  return flag;
}

export async function upsertAiModelConfig({ id = null, tool = 'platform', callType, provider, model, scope = 'platform', scopeId = '', temperature = null, maxTokens = null, enabled = true, actorId = null, reason = null }) {
  if (!callType || !provider || !model) throw new Error('Call type, provider, and model are required.');
  const normalizedTool = tool || 'platform';
  const normalizedScopeId = scopeId ?? '';
  const existing = id
    ? await db.aiModelConfig.findUnique({ where: { id } })
    : await db.aiModelConfig.findUnique({
        where: { tool_callType_scope_scopeId: { tool: normalizedTool, callType, scope, scopeId: normalizedScopeId } },
      });
  const data = {
    tool: normalizedTool,
    callType,
    provider,
    model,
    scope,
    scopeId: normalizedScopeId,
    temperature: temperature === '' || temperature === null ? null : Number.parseFloat(temperature),
    maxTokens: maxTokens === '' || maxTokens === null ? null : Number.parseInt(maxTokens, 10),
    enabled: Boolean(enabled),
  };
  const config = id && existing
    ? await db.aiModelConfig.update({ where: { id }, data })
    : await db.aiModelConfig.upsert({
        where: { tool_callType_scope_scopeId: { tool: normalizedTool, callType, scope, scopeId: normalizedScopeId } },
        update: {
          provider,
          model,
          temperature: data.temperature,
          maxTokens: data.maxTokens,
          enabled: data.enabled,
        },
        create: data,
      });

  await db.adminAuditLog.create({
    data: {
      actorId,
      action: 'ai_model_config.upserted',
      targetType: 'ai_model_config',
      targetId: config.id,
      oldValue: existing ? {
        tool: existing.tool,
        callType: existing.callType,
        provider: existing.provider,
        model: existing.model,
        scope: existing.scope,
        scopeId: existing.scopeId,
        temperature: existing.temperature,
        maxTokens: existing.maxTokens,
        enabled: existing.enabled,
      } : null,
      newValue: {
        tool: config.tool,
        callType: config.callType,
        provider: config.provider,
        model: config.model,
        scope: config.scope,
        scopeId: config.scopeId,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        enabled: config.enabled,
      },
      reason,
    },
  });

  return config;
}
