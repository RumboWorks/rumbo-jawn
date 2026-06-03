import 'dotenv/config';
import { claimNextJob, completeJob, failJob } from '@rumbo/jobs';
import { runAnalysis } from '@rumbo/sounds-like-us/analysis';
import { collectResponse } from '@rumbo/eval/worker';

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS ?? '3000', 10);

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
