// Seed the Eval provider/model catalog. Idempotent: safe to run repeatedly.

import { db } from '@rumbo/db';

const PROVIDERS = [
  {
    name: 'OpenAI',
    providerType: 'OPENAI',
    models: [
      { name: 'GPT-4o', apiIdentifier: 'gpt-4o' },
      { name: 'GPT-4o mini', apiIdentifier: 'gpt-4o-mini' },
    ],
  },
  {
    name: 'Anthropic',
    providerType: 'ANTHROPIC',
    models: [
      { name: 'Claude Sonnet 4.6', apiIdentifier: 'claude-sonnet-4-6' },
      { name: 'Claude Haiku 4.5', apiIdentifier: 'claude-haiku-4-5-20251001' },
    ],
  },
  {
    name: 'Google',
    providerType: 'GOOGLE',
    models: [
      { name: 'Gemini 1.5 Pro', apiIdentifier: 'gemini-1.5-pro' },
      { name: 'Gemini 1.5 Flash', apiIdentifier: 'gemini-1.5-flash' },
    ],
  },
  { name: 'Manual', providerType: 'MANUAL', models: [] },
  { name: 'Other', providerType: 'OTHER', models: [] },
];

export async function seedEvalProviders() {
  for (const p of PROVIDERS) {
    const provider = await db.evalProvider.upsert({
      where: { name: p.name },
      update: { providerType: p.providerType },
      create: { name: p.name, providerType: p.providerType },
    });
    for (const m of p.models) {
      await db.evalProviderModel.upsert({
        where: { providerId_apiIdentifier: { providerId: provider.id, apiIdentifier: m.apiIdentifier } },
        update: { name: m.name },
        create: { providerId: provider.id, name: m.name, apiIdentifier: m.apiIdentifier },
      });
    }
  }
  const providers = await db.evalProvider.count();
  const models = await db.evalProviderModel.count();
  return { providers, models };
}

// Allow `node src/seed.js` for manual seeding.
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEvalProviders()
    .then(({ providers, models }) => {
      console.log(`Seeded Eval catalog: ${providers} providers, ${models} provider models.`);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
