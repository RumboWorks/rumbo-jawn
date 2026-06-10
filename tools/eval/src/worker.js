// Eval worker entry — background handlers that touch AI providers. Imported by
// apps/worker; kept separate from the web router so the web app stays AI-free.

import { aiCall } from '@rumbo/ai';
import { recordUsageEvent, UsageKey } from '@rumbo/billing';
import { aiProviderFor, getResponseForCollection, applyCollectedResponse } from './evals.service.js';

// Re-exported for the worker's periodic trash sweep.
export { purgeExpiredTrashedRuns, PURGE_AFTER_DAYS } from './admin.service.js';

// Collect one response for an evaluation by calling the model under test via
// the shared AI wrapper (cost is logged to AiCall, and the org's AI spend cap
// is enforced inside aiCall). Records a usage event on success.
export async function collectResponse(job) {
  const { responseId } = job.payload ?? {};
  if (!responseId) throw new Error('eval.collectResponse: missing responseId');

  const response = await getResponseForCollection(responseId);
  if (!response) throw new Error(`eval.collectResponse: response ${responseId} not found`);

  const snapshot = response.modelSnapshot;
  const provider = aiProviderFor(snapshot?.providerName);
  const model = snapshot?.providerModelName;
  if (!provider || !model) {
    throw new Error(`eval.collectResponse: model "${snapshot?.displayName}" is not live-collectable`);
  }

  const promptText = response.evalRun?.promptSnapshot?.promptText;
  if (!promptText) throw new Error('eval.collectResponse: run has no prompt snapshot');

  const content = await aiCall({
    tool: 'eval',
    callType: 'response.collect',
    messages: [{ role: 'user', content: promptText }],
    jobId: job.id,
    orgId: job.orgId,
    options: { provider, model },
  });

  await applyCollectedResponse(responseId, { text: content, source: 'PLATFORM_API' });

  await recordUsageEvent({
    orgId: job.orgId,
    tool: 'eval',
    usageKey: UsageKey.EVAL_RESPONSE_COLLECTION,
    jobId: job.id,
  });

  return { responseId, chars: content.length };
}
