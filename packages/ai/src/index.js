import { db } from '@rumbo/db';
import { assertOrgSpendAvailable, getAiModelConfig } from '@rumbo/billing';
import { openaiChat } from './providers/openai.js';
import { anthropicChat } from './providers/anthropic.js';
import { deepseekChat } from './providers/deepseek.js';

// ---- Call type config ----
// DB-backed config is the long-term home. ENV overrides are the MVP fallback.

const DEFAULT_CALL_CONFIG = {
  'default':           { provider: 'openai',    model: 'gpt-4o-mini' },
  'crawl.summarize':   { provider: 'openai',    model: 'gpt-4o-mini' },
  'guidance.generate': { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  'eval.score':        { provider: 'deepseek',  model: 'deepseek-chat' },
};

// ---- Shared call wrapper ----
// Dispatches to the right provider, logs cost to DB, returns content string.

export async function aiCall({ callType, messages, systemPrompt, jobId = null, orgId = null, options = {} }) {
  const jobOrgId = orgId ?? await resolveOrgIdForJob(jobId);
  await assertOrgSpendAvailable(jobOrgId);

  const dbConfig = await getAiModelConfig(callType, { orgId: jobOrgId });
  const cfg = dbConfig ?? DEFAULT_CALL_CONFIG[callType] ?? DEFAULT_CALL_CONFIG['default'];
  const { provider, model } = { ...cfg, ...options };

  let result;
  switch (provider) {
    case 'openai':
      result = await openaiChat({ model, messages, ...options });
      break;
    case 'anthropic':
      result = await anthropicChat({ model, messages, systemPrompt, ...options });
      break;
    case 'deepseek':
      result = await deepseekChat({ model, messages, ...options });
      break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  await db.aiCall.create({
    data: {
      jobId,
      callType,
      provider:     result.provider,
      model:        result.model,
      promptTokens: result.promptTokens,
      outputTokens: result.outputTokens,
      totalTokens:  result.totalTokens,
      durationMs:   result.durationMs,
      costUsd:      estimateCostUsd(result),
    },
  });

  return result.content;
}

async function resolveOrgIdForJob(jobId) {
  if (!jobId) return null;
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { orgId: true },
  });
  return job?.orgId ?? null;
}

function estimateCostUsd({ provider, model, promptTokens, outputTokens }) {
  const rates = {
    'openai/gpt-4o-mini':                  { in: 0.00000015, out: 0.0000006  },
    'openai/gpt-4o':                       { in: 0.0000025,  out: 0.00001    },
    'anthropic/claude-haiku-4-5-20251001': { in: 0.00000025, out: 0.00000125 },
    'anthropic/claude-sonnet-4-6':         { in: 0.000003,   out: 0.000015   },
    'deepseek/deepseek-chat':              { in: 0.00000014, out: 0.00000028 },
  };
  const r = rates[`${provider}/${model}`];
  if (!r) return 0;
  return r.in * promptTokens + r.out * outputTokens;
}

export { DEFAULT_CALL_CONFIG };
