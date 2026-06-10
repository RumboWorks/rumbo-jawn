// QA data sweep — runs after every Playwright suite. Removes the @example.org
// users the tests register (there is deliberately no per-test teardown) plus
// the orgs, partner accounts, jobs, and Eval data that belong only to them.
// SAFETY: never touches a user outside @example.org, and never deletes an org
// or partner account that has any non-example member.

import { db } from '@rumbo/db';

export default async function globalTeardown() {
  const users = await db.user.findMany({
    where: { email: { endsWith: '@example.org' } },
    select: { id: true },
  });
  const userIds = users.map(u => u.id);
  if (userIds.length === 0) return;

  const orgs = await db.organization.findMany({
    where: {
      OR: [
        { createdByUserId: { in: userIds } },
        { memberships: { some: { userId: { in: userIds } } } },
      ],
    },
    include: { memberships: { select: { userId: true } } },
  });
  const orgIds = orgs
    .filter(org => org.memberships.every(m => userIds.includes(m.userId)))
    .map(org => org.id);

  // Eval data references orgs/users by scalar id — no cascade from Organization.
  await db.evalNotification.deleteMany({ where: { organizationId: { in: orgIds } } });
  await db.evalTask.deleteMany({ where: { organizationId: { in: orgIds } } });
  await db.eval.deleteMany({ where: { organizationId: { in: orgIds } } });
  await db.evalOrgModel.deleteMany({ where: { organizationId: { in: orgIds } } });
  await db.evalCriterion.deleteMany({ where: { organizationId: { in: orgIds } } });

  // Jobs (and their satellites, which only SetNull on job delete).
  const jobs = await db.job.findMany({
    where: { OR: [{ userId: { in: userIds } }, { orgId: { in: orgIds } }] },
    select: { id: true },
  });
  const jobIds = jobs.map(j => j.id);
  await db.artifactManifest.deleteMany({ where: { jobId: { in: jobIds } } });
  await db.aiCall.deleteMany({ where: { jobId: { in: jobIds } } });
  await db.usageEvent.deleteMany({ where: { jobId: { in: jobIds } } });
  await db.job.deleteMany({ where: { id: { in: jobIds } } });
  await db.sluFeedback.deleteMany({ where: { userId: { in: userIds } } });

  // QA audit noise (real operator actions never involve example users/orgs).
  await db.adminAuditLog.deleteMany({
    where: { OR: [{ actorId: { in: userIds } }, { orgId: { in: orgIds } }] },
  });

  // Partner accounts whose managers are all example users.
  const partners = await db.partnerAccount.findMany({
    include: { memberships: { select: { userId: true } } },
  });
  const partnerIds = partners
    .filter(p => p.memberships.length > 0 && p.memberships.every(m => userIds.includes(m.userId)))
    .map(p => p.id);
  await db.partnerAccount.deleteMany({ where: { id: { in: partnerIds } } });

  await db.organization.deleteMany({ where: { id: { in: orgIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`QA teardown: removed ${userIds.length} @example.org users, ${orgIds.length} orgs, ${jobIds.length} jobs, ${partnerIds.length} partner accounts.`);
}
