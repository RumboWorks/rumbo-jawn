/**
 * Clears eval seed data from Rumbo. Dev only.
 * Run from project root: node scripts/clear-eval.js
 *   (or: npm run seed:eval:clear)
 *
 * Safety: aborts if any non-@example.test user exists, to avoid
 * accidentally wiping a database that has real accounts.
 */

import { db } from '@rumbo/db';

async function clearSeed() {
  const nonSeedUser = await db.user.findFirst({
    where: { email: { not: { endsWith: '@example.test' } } },
  });
  if (nonSeedUser) {
    console.error(`Non-seed user found (${nonSeedUser.email}). Aborting to avoid data loss.`);
    process.exit(1);
  }

  console.log('Clearing seed data…');

  // Eval tables in reverse dependency order
  await db.evalNotification.deleteMany({});
  await db.evalTask.deleteMany({});
  await db.evalReport.deleteMany({});
  await db.evalReviewComment.deleteMany({});
  await db.evalRating.deleteMany({});
  await db.evalReviewAssignment.deleteMany({});
  await db.evalResponse.deleteMany({});
  await db.evalModelSnapshot.deleteMany({});
  await db.evalCriterionSnapshot.deleteMany({});
  await db.evalPromptSnapshot.deleteMany({});
  await db.evalRun.deleteMany({});
  await db.eval.deleteMany({});
  await db.evalCriterion.deleteMany({});
  await db.evalOrgModel.deleteMany({});
  await db.evalProviderModel.deleteMany({});
  await db.evalProvider.deleteMany({});

  // Platform tables
  await db.toolGrant.deleteMany({});
  await db.organizationEntitlement.deleteMany({});
  await db.partnerOrganizationAccess.deleteMany({});
  await db.partnerMembership.deleteMany({});
  await db.partnerAccount.deleteMany({});
  await db.membership.deleteMany({});
  await db.organization.deleteMany({});
  await db.user.deleteMany({});

  console.log('Done — all seed data cleared.');
}

clearSeed()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
