import { db } from '@rumbo/db';
import { seedBillingDefaults, setOrgTier } from '../index.js';

const [, , orgSlugOrId, tierKey, actorEmail] = process.argv;

if (!orgSlugOrId || !tierKey) {
  console.error('Usage: npm run set-org-tier --workspace=@rumbo/billing -- <org-slug-or-id> <free|solo|team|partner> [actor-email]');
  process.exit(1);
}

try {
  await seedBillingDefaults();
  const org = await db.organization.findFirst({
    where: { OR: [{ id: orgSlugOrId }, { slug: orgSlugOrId }, { publicId: orgSlugOrId }] },
    select: { id: true, name: true, slug: true },
  });
  if (!org) throw new Error(`Organization not found: ${orgSlugOrId}`);

  const actor = actorEmail
    ? await db.user.findUnique({ where: { email: actorEmail }, select: { id: true } })
    : null;

  const entitlement = await setOrgTier({
    orgId: org.id,
    tierKey,
    actorId: actor?.id ?? null,
    reason: 'support script',
  });

  console.log(`Set ${org.name} (${org.slug}) to ${entitlement.tier.name}.`);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
