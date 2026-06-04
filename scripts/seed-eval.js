/**
 * Load eval seed data into Rumbo.
 * Run from project root: node scripts/seed-eval.js
 *   (or: npm run seed:eval)
 *
 * Stable keys in JSON files are resolved to DB IDs via keyMap.
 * Run node scripts/clear-eval.js first if seed data already exists,
 * or npm run seed:eval:reload to do both in one step.
 */

import { db } from '@rumbo/db';
import { ensureOrgEntitlement } from '@rumbo/billing';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require   = createRequire(import.meta.url);
const bcrypt    = require('bcrypt');
const __dirname = dirname(fileURLToPath(import.meta.url));
const seedRoot  = join(__dirname, 'seed');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSeedFile(filename) {
  return JSON.parse(readFileSync(join(seedRoot, filename), 'utf8'));
}

function id(keyMap, key) {
  const val = keyMap[key];
  if (val == null) throw new Error(`Unresolved seed key: "${key}"`);
  return val;
}

// ─── Load steps ──────────────────────────────────────────────────────────────

async function loadUsers(keyMap) {
  const users = readSeedFile('users.json');
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.passwordPlaintext, 12);
    const record = await db.user.create({
      data: {
        email:           u.email,
        name:            u.name,
        passwordHash,
        isPlatformAdmin: u.isPlatformAdmin ?? false,
      },
    });
    keyMap[u.key] = record.id;
  }
  console.log(`  ✓  users            (${users.length})`);
}

async function loadOrganizations(keyMap) {
  const orgs = readSeedFile('organizations.json');
  for (const o of orgs) {
    const record = await db.organization.create({
      data: {
        name:             o.name,
        slug:             o.slug,
        organizationType: o.organizationType,
        createdByUserId:  id(keyMap, o.createdByUserKey),
      },
    });
    keyMap[o.key] = record.id;
    await ensureOrgEntitlement(record.id);
  }
  console.log(`  ✓  organizations    (${orgs.length})`);
}

async function loadPartnerAccounts(keyMap) {
  const partners = readSeedFile('partner-accounts.json');
  for (const p of partners) {
    const record = await db.partnerAccount.create({
      data: {
        name:         p.name,
        supportEmail: p.supportEmail ?? null,
      },
    });
    keyMap[p.key] = record.id;
  }
  console.log(`  ✓  partner accounts (${partners.length})`);
}

async function loadMemberships(keyMap) {
  const data = readSeedFile('memberships.json');
  let count = 0;

  for (const m of data.organizationMemberships) {
    await db.membership.create({
      data: {
        orgId:  id(keyMap, m.organizationKey),
        userId: id(keyMap, m.userKey),
        role:   m.role,
      },
    });
    count++;
  }

  for (const pm of data.partnerMemberships) {
    await db.partnerMembership.create({
      data: {
        partnerAccountId: id(keyMap, pm.partnerKey),
        userId:           id(keyMap, pm.userKey),
        role:             pm.role,
      },
    });
    count++;
  }

  for (const pa of data.partnerOrgAccesses) {
    await db.partnerOrganizationAccess.create({
      data: {
        partnerAccountId: id(keyMap, pa.partnerKey),
        orgId:            id(keyMap, pa.organizationKey),
        createdByUserId:  id(keyMap, pa.createdByUserKey),
      },
    });
    count++;
  }

  console.log(`  ✓  memberships      (${count})`);
}

async function loadToolGrants(keyMap) {
  // eval is orgOpen:false — explicit ToolGrant rows required.
  // Platform admin and partner manager get access via other mechanisms.
  const grants = [
    { userKey: 'user-org-manager', orgKey: 'org-acme-nonprofit', role: 'MANAGER' },
    { userKey: 'user-reviewer-1',  orgKey: 'org-acme-nonprofit', role: 'MEMBER'  },
    { userKey: 'user-reviewer-2',  orgKey: 'org-acme-nonprofit', role: 'MEMBER'  },
    { userKey: 'user-reviewer-3',  orgKey: 'org-acme-nonprofit', role: 'MEMBER'  },
    { userKey: 'user-solo',        orgKey: 'org-solo-workspace', role: 'MANAGER' },
  ];
  for (const g of grants) {
    await db.toolGrant.create({
      data: {
        userId: id(keyMap, g.userKey),
        orgId:  id(keyMap, g.orgKey),
        tool:   'eval',
        role:   g.role,
      },
    });
  }
  console.log(`  ✓  tool grants      (${grants.length})`);
}

async function loadProviders(keyMap) {
  const data = readSeedFile('providers.json');
  let count = 0;

  for (const p of data.providers) {
    const record = await db.evalProvider.upsert({
      where:  { name: p.name },
      update: { providerType: p.providerType },
      create: { name: p.name, providerType: p.providerType },
    });
    keyMap[p.key] = record.id;
    count++;
  }

  for (const pm of data.providerModels) {
    const providerId = id(keyMap, pm.providerKey);
    const record = await db.evalProviderModel.upsert({
      where:  { providerId_apiIdentifier: { providerId, apiIdentifier: pm.apiIdentifier } },
      update: { name: pm.name },
      create: { providerId, name: pm.name, apiIdentifier: pm.apiIdentifier },
    });
    keyMap[pm.key] = record.id;
    count++;
  }

  console.log(`  ✓  providers        (${count})`);
}

async function loadModels(keyMap) {
  const models = readSeedFile('models.json');
  for (const m of models) {
    const record = await db.evalOrgModel.create({
      data: {
        organizationId:  id(keyMap, m.organizationKey),
        providerId:      m.providerKey      ? id(keyMap, m.providerKey)      : null,
        providerModelId: m.providerModelKey ? id(keyMap, m.providerModelKey) : null,
        displayName:     m.displayName,
        notes:           m.notes ?? null,
        accessMethod:    m.accessMethod,
        createdByUserId: id(keyMap, m.createdByUserKey),
      },
    });
    keyMap[m.key] = record.id;
  }
  console.log(`  ✓  org models       (${models.length})`);
}

async function loadCriteria(keyMap) {
  const criteria = readSeedFile('criteria.json');
  for (const c of criteria) {
    const record = await db.evalCriterion.create({
      data: {
        organizationId:  id(keyMap, c.organizationKey),
        title:           c.title,
        description:     c.description ?? null,
        displayOrder:    c.displayOrder ?? 0,
        createdByUserId: id(keyMap, c.createdByUserKey),
      },
    });
    keyMap[c.key] = record.id;
  }
  console.log(`  ✓  criteria         (${criteria.length})`);
}

async function loadEvals(keyMap) {
  const evals = readSeedFile('evals.json');
  for (const e of evals) {
    const record = await db.eval.create({
      data: {
        organizationId:  id(keyMap, e.organizationKey),
        title:           e.title,
        description:     e.description ?? null,
        createdByUserId: id(keyMap, e.createdByUserKey),
        archivedAt:      e.archivedAt ? new Date(e.archivedAt) : null,
        createdAt:       e.createdAt  ? new Date(e.createdAt)  : undefined,
      },
    });
    keyMap[e.key] = record.id;
  }
  console.log(`  ✓  evals            (${evals.length})`);
}

async function loadEvalRuns(keyMap) {
  const runs = readSeedFile('eval-runs.json');
  let snapshotCount = 0;

  for (const r of runs) {
    const run = await db.evalRun.create({
      data: {
        organizationId:    id(keyMap, r.organizationKey),
        evalId:            id(keyMap, r.evalKey),
        runNumber:         r.runNumber,
        status:            r.status,
        launchedByUserId:  r.launchedByUserKey  ? id(keyMap, r.launchedByUserKey)  : null,
        completedByUserId: r.completedByUserKey ? id(keyMap, r.completedByUserKey) : null,
        reviewClosesAt:    r.reviewClosesAt ? new Date(r.reviewClosesAt) : null,
        completedAt:       r.completedAt    ? new Date(r.completedAt)    : null,
        createdAt:         r.createdAt      ? new Date(r.createdAt)      : undefined,
      },
    });
    keyMap[r.key] = run.id;

    // Prompt snapshot
    await db.evalPromptSnapshot.create({
      data: { evalRunId: run.id, promptText: r.promptText },
    });
    snapshotCount++;

    // Criterion snapshots
    for (let i = 0; i < r.criterionKeys.length; i++) {
      const criterionId = id(keyMap, r.criterionKeys[i]);
      const criterion = await db.evalCriterion.findUnique({ where: { id: criterionId } });
      const snap = await db.evalCriterionSnapshot.create({
        data: {
          evalRunId:         run.id,
          sourceCriterionId: criterionId,
          title:             criterion.title,
          description:       criterion.description,
          displayOrder:      i,
        },
      });
      keyMap[`criterion-snapshot-${r.key}-${r.criterionKeys[i]}`] = snap.id;
      snapshotCount++;
    }

    // Model snapshots
    for (let i = 0; i < r.modelKeys.length; i++) {
      const modelId = id(keyMap, r.modelKeys[i]);
      const model = await db.evalOrgModel.findUnique({
        where:   { id: modelId },
        include: { provider: true, providerModel: true },
      });
      const snap = await db.evalModelSnapshot.create({
        data: {
          evalRunId:         run.id,
          orgModelId:        modelId,
          displayName:       model.displayName,
          providerName:      model.provider?.name       ?? null,
          providerModelName: model.providerModel?.name  ?? null,
          isManual:          model.accessMethod === 'MANUAL',
          isApiPending:      model.accessMethod === 'PLATFORM_API_PENDING',
          displayOrder:      i,
        },
      });
      keyMap[`model-snapshot-${r.key}-${r.modelKeys[i]}`] = snap.id;
      snapshotCount++;
    }
  }

  console.log(`  ✓  eval runs        (${runs.length} runs, ${snapshotCount} snapshots)`);
}

async function loadResponses(keyMap) {
  const responses = readSeedFile('responses.json');
  for (const r of responses) {
    const evalRunId = id(keyMap, r.evalRunKey);
    const evalRun   = await db.evalRun.findUnique({ where: { id: evalRunId } });
    const modelSnapshotId = id(keyMap, `model-snapshot-${r.evalRunKey}-${r.modelKey}`);

    const record = await db.evalResponse.create({
      data: {
        organizationId:  evalRun.organizationId,
        evalRunId,
        modelSnapshotId,
        responseSource:  r.responseSource,
        responseText:    r.responseText ?? null,
        submittedAt:     r.submittedAt ? new Date(r.submittedAt) : null,
      },
    });
    keyMap[r.key] = record.id;
  }
  console.log(`  ✓  responses        (${responses.length})`);
}

async function loadReviewAssignments(keyMap) {
  const groups = readSeedFile('review-assignments.json');
  let count = 0;

  for (const group of groups) {
    const evalRunId    = id(keyMap, group.evalRunKey);
    const evalRun      = await db.evalRun.findUnique({ where: { id: evalRunId } });
    const assignedById = id(keyMap, group.assignedByKey);

    for (const a of group.assignments) {
      await db.evalReviewAssignment.create({
        data: {
          organizationId:   evalRun.organizationId,
          evalRunId,
          userId:           id(keyMap, a.reviewerKey),
          assignedByUserId: assignedById,
          completedAt:      a.completedAt ? new Date(a.completedAt) : null,
        },
      });
      count++;
    }
  }
  console.log(`  ✓  review assignments (${count})`);
}

async function loadRatings(keyMap) {
  const ratingGroups = readSeedFile('ratings.json');
  let count = 0;

  for (const group of ratingGroups) {
    const evalRunId   = id(keyMap, group.evalRunKey);
    const reviewerId  = id(keyMap, group.reviewerKey);
    const submittedAt = group.submittedAt ? new Date(group.submittedAt) : null;
    const evalRun     = await db.evalRun.findUnique({ where: { id: evalRunId } });

    for (const [responseKey, criterionScores] of Object.entries(group.scores)) {
      const responseId = id(keyMap, responseKey);
      for (const [criterionKey, score] of Object.entries(criterionScores)) {
        const criterionSnapshotId = id(keyMap, `criterion-snapshot-${group.evalRunKey}-${criterionKey}`);
        await db.evalRating.create({
          data: {
            organizationId:      evalRun.organizationId,
            evalRunId,
            responseId,
            criterionSnapshotId,
            reviewerUserId:      reviewerId,
            score,
            submittedAt,
          },
        });
        count++;
      }
    }
  }
  console.log(`  ✓  ratings          (${count})`);
}

async function loadComments(keyMap) {
  const comments = readSeedFile('comments.json');
  for (const c of comments) {
    const evalRunId = id(keyMap, c.evalRunKey);
    const evalRun   = await db.evalRun.findUnique({ where: { id: evalRunId } });
    await db.evalReviewComment.create({
      data: {
        organizationId: evalRun.organizationId,
        evalRunId,
        responseId:     c.responseKey ? id(keyMap, c.responseKey) : null,
        reviewerUserId: id(keyMap, c.reviewerKey),
        commentText:    c.commentText,
      },
    });
  }
  console.log(`  ✓  comments         (${comments.length})`);
}

async function loadTasks(keyMap) {
  const tasks = readSeedFile('tasks.json');
  for (const t of tasks) {
    await db.evalTask.create({
      data: {
        organizationId: id(keyMap, t.organizationKey),
        assignedUserId: id(keyMap, t.assignedUserKey),
        evalRunId:      t.evalRunKey  ? id(keyMap, t.evalRunKey)  : null,
        responseId:     t.responseKey ? id(keyMap, t.responseKey) : null,
        taskType:       t.taskType,
        status:         t.status,
        dueAt:          t.dueAt ? new Date(t.dueAt) : null,
      },
    });
  }
  console.log(`  ✓  tasks            (${tasks.length})`);
}

async function loadReports(keyMap) {
  const reports = readSeedFile('reports.json');
  for (const r of reports) {
    const evalRunId = id(keyMap, r.evalRunKey);
    const evalRun   = await db.evalRun.findUnique({ where: { id: evalRunId } });
    await db.evalReport.create({
      data: {
        organizationId:     evalRun.organizationId,
        evalRunId,
        summaryText:        r.summaryText        ?? null,
        recommendationText: r.recommendationText ?? null,
        createdByUserId:    id(keyMap, r.createdByUserKey),
      },
    });
  }
  console.log(`  ✓  reports          (${reports.length})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function loadSeed() {
  const seedUserExists = await db.user.findFirst({
    where: { email: { endsWith: '@example.test' } },
  });
  if (seedUserExists) {
    console.error('Seed users already exist. Run node scripts/clear-eval.js first, or npm run seed:eval:reload to do both.');
    process.exit(1);
  }

  console.log('Loading seed data…');
  const keyMap = {};

  await loadUsers(keyMap);
  await loadOrganizations(keyMap);
  await loadPartnerAccounts(keyMap);
  await loadMemberships(keyMap);
  await loadToolGrants(keyMap);
  await loadProviders(keyMap);
  await loadModels(keyMap);
  await loadCriteria(keyMap);
  await loadEvals(keyMap);
  await loadEvalRuns(keyMap);
  await loadResponses(keyMap);
  await loadReviewAssignments(keyMap);
  await loadRatings(keyMap);
  await loadComments(keyMap);
  await loadTasks(keyMap);
  await loadReports(keyMap);

  console.log('\nSeed complete.\n');
  console.log('Demo accounts (password: DevPassword1!):');
  console.log('  admin@example.test     — Platform Admin');
  console.log('  jordan@example.test    — Partner Manager (Brightside Consulting → Parkside Housing)');
  console.log('  morgan@example.test    — Org Manager (Parkside Housing Collaborative, eval MANAGER)');
  console.log('  sam@example.test       — Reviewer (eval MEMBER)');
  console.log('  casey@example.test     — Reviewer (eval MEMBER, open review task)');
  console.log('  quinn@example.test     — Reviewer (eval MEMBER, overdue review task)');
  console.log('  drew@example.test      — Solo User (Drew\'s Workspace, eval MANAGER)');
}

loadSeed()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
