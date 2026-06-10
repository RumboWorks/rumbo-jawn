import 'dotenv/config';
import { claimNextJob, completeJob, failJob } from '@rumbo/jobs';
import { runAnalysis } from '@rumbo/sounds-like-us/analysis';
import { collectResponse, purgeExpiredTrashedRuns } from '@rumbo/eval/worker';

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS ?? '3000', 10);
const TRASH_SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

// ---- Handler registry ----

const HANDLERS = {
  'slu.analysis': runAnalysis,
  'eval.collectResponse': collectResponse,
};

// ---- Polling loop ----

console.log('rumbo-worker started');

async function poll() {
  try {
    const job = await claimNextJob();
    if (job) {
      console.log(`[worker] ${job.id} type=${job.type}`);
      const handler = HANDLERS[job.type];
      if (!handler) {
        await failJob(job.id, `No handler for job type: ${job.type}`, { retry: false });
      } else {
        try {
          const result = await handler(job);
          await completeJob(job.id, result ?? null);
          console.log(`[worker] ${job.id} done`);
        } catch (err) {
          console.error(`[worker] ${job.id} failed:`, err.message);
          await failJob(job.id, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[worker] poll error:', err.message);
  } finally {
    setTimeout(poll, POLL_INTERVAL_MS);
  }
}

poll();

// ---- Periodic trash sweep ----
// Hard-purges Eval runs that have sat in the admin trash past the retention
// window (30 days). Runs at startup and every few hours thereafter.

async function sweepTrash() {
  try {
    const { purged } = await purgeExpiredTrashedRuns();
    if (purged > 0) console.log(`[worker] trash sweep purged ${purged} eval run${purged === 1 ? '' : 's'}`);
  } catch (err) {
    console.error('[worker] trash sweep error:', err.message);
  }
}

sweepTrash();
setInterval(sweepTrash, TRASH_SWEEP_INTERVAL_MS);
