// DeepSeek reuses the OpenAI client with a different base URL — same API schema.
import OpenAI from 'openai';

let _client = null;

function getClient() {
  if (!_client) {
    _client = new OpenAI({
      apiKey:  process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return _client;
}

export async function deepseekChat({ model = 'deepseek-chat', messages, temperature = 0.7, maxTokens }) {
  const start = Date.now();
  const res = await getClient().chat.completions.create({
    model,
    messages,
    temperature,
    ...(maxTokens && { max_tokens: maxTokens }),
  });
  const choice = res.choices[0];
  return {
    content:      choice.message.content,
    promptTokens: res.usage.prompt_tokens,
    outputTokens: res.usage.completion_tokens,
    totalTokens:  res.usage.total_tokens,
    durationMs:   Date.now() - start,
    provider:     'deepseek',
    model,
  };
}
