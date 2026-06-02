import { seedBillingDefaults } from '../index.js';
import { db } from '@rumbo/db';

try {
  const result = await seedBillingDefaults();
  console.log(`Seeded billing defaults: ${result.tiers.length} tiers, ${result.orgEntitlementsCreated} org entitlements created.`);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
