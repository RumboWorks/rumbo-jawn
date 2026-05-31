import Anthropic from '@anthropic-ai/sdk';

let _client = null;

function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function anthropicChat({ model, messages, systemPrompt, temperature = 0.7, maxTokens = 4096 }) {
  const start = Date.now();
  const res = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemPrompt && { system: systemPrompt }),
    messages: messages.filter(m => m.role !== 'system'),
  });
  const content = res.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  return {
    content,
    promptTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    totalTokens:  res.usage.input_tokens + res.usage.output_tokens,
    durationMs:   Date.now() - start,
    provider:     'anthropic',
    model,
  };
}
