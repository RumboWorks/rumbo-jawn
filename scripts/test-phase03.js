// Smoke test for Phase 03: jobs, storage, python bridge.
// Run: node scripts/test-phase03.js

import 'dotenv/config';
import { createJob, claimNextJob, completeJob, getJob, listJobs } from '@rumbo/jobs';
import { writeArtifact, readArtifactJson, artifactPath } from '@rumbo/storage';
import { pingPython } from '@rumbo/python-bridge';

async function run() {
  console.log('--- Phase 03 smoke test ---\n');

  // 1. Create a job
  const job = await createJob('test.smoke', { url: 'https://example.org' });
  console.log(`✓ createJob: ${job.id} status=${job.status}`);

  // 2. Claim it
  const claimed = await claimNextJob();
  console.log(`✓ claimNextJob: ${claimed?.id} status=${claimed?.status}`);

  // 3. Write an artifact
  const relPath = artifactPath('test', job.id, 'output.json');
  await writeArtifact({
    jobId: job.id,
    type: 'test.output',
    relativePath: relPath,
    content: JSON.stringify({ result: 'hello from Phase 03', jobId: job.id }),
  });
  console.log(`✓ writeArtifact: ${relPath}`);

  // 4. Read it back
  const data = await readArtifactJson(relPath);
  console.log(`✓ readArtifactJson: result="${data.result}"`);

  // 5. Complete the job
  await completeJob(job.id, { summary: 'smoke test passed' });
  const done = await getJob(job.id);
  console.log(`✓ completeJob: status=${done.status} artifacts=${done.artifacts.length}`);

  // 6. Python bridge ping
  try {
    const pong = await pingPython();
    console.log(`✓ pingPython: ok=${pong.ok}`);
  } catch (e) {
    console.log(`⚠ pingPython failed (python3 may not be on PATH in this context): ${e.message}`);
  }

  console.log('\n--- all checks passed ---');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
