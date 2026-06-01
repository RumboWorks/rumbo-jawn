import { db } from '@rumbo/db';
import { writeArtifact, artifactPath } from '@rumbo/storage';
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');

const email = 'workbench-tester@example.com';
const password = 'wbtest123';
const hash = await bcrypt.hash(password, 10);

let user = await db.user.findUnique({ where: { email } });
if (!user) {
  user = await db.user.create({ data: { email, name: 'WB Tester', passwordHash: hash } });
  console.log('created user:', user.id);
} else {
  console.log('existing user:', user.id);
}

const realArtifact = JSON.parse(
  fs.readFileSync('/var/www/rumbo/storage/slu/guidance/cmpufdqmj0001vpw92g91klfh/guidance.json', 'utf8')
);

const job = await db.job.create({
  data: {
    type: 'slu.analysis',
    status: 'DONE',
    userId: user.id,
    payload: { url: 'https://learningpolicyinstitute.org' },
    result: { url: 'https://learningpolicyinstitute.org', orgName: realArtifact.guidance.org_name, guidancePath: 'placeholder', pageCount: realArtifact.pageCount ?? 6 },
  },
});

const guidancePath = artifactPath('slu/guidance', job.id, 'guidance.json');
await writeArtifact({
  jobId: job.id,
  type: 'slu.guidance',
  relativePath: guidancePath,
  content: JSON.stringify(realArtifact, null, 2),
});

await db.job.update({
  where: { id: job.id },
  data: { result: { url: 'https://learningpolicyinstitute.org', orgName: realArtifact.guidance.org_name, guidancePath, pageCount: realArtifact.pageCount ?? 6 } },
});

console.log('TEST_JOB_ID=' + job.id);
console.log('TEST_EMAIL=' + email);
console.log('TEST_PASSWORD=' + password);

await db.$disconnect();
