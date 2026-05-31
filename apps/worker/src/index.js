import 'dotenv/config';
import { claimNextJob, completeJob, failJob } from '@rumbo/jobs';

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS ?? '3000', 10);

console.log('rumbo-worker started');

async function processJob(job) {
  console.log(`[worker] processing job ${job.id} type=${job.type}`);
  // Dispatch to handler by job type. Handlers live in tool packages.
  // Phase 04 wires the first real handler (slu.analysis).
  const handler = HANDLERS[job.type];
  if (!handler) {
    throw new Error(`No handler registered for job type: ${job.type}`);
  }
  return handler(job);
}

// Handler registry — populated by tool packages in later phases.
const HANDLERS = {};

// Register a job type handler from outside the worker.
export function registerHandler(type, fn) {
  HANDLERS[type] = fn;
}

async function poll() {
  try {
    const job = await claimNextJob();
    if (job) {
      try {
        const result = await processJob(job);
        await completeJob(job.id, result ?? null);
        console.log(`[worker] job ${job.id} done`);
      } catch (err) {
        console.error(`[worker] job ${job.id} failed:`, err.message);
        await failJob(job.id, err.message);
      }
    }
  } catch (err) {
    console.error('[worker] poll error:', err.message);
  } finally {
    setTimeout(poll, POLL_INTERVAL_MS);
  }
}

// Add @rumbo/jobs dep
poll();
