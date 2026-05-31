import { Router } from 'express';
import { createJob, getJob, listJobs } from '@rumbo/jobs';
import { readArtifactJson } from '@rumbo/storage';
import { requireAuth } from '@rumbo/auth';

const router = Router();

// ---- URL input form ----

router.get('/', (req, res) => {
  res.render('pages/slu/index', {
    tool: 'slu',
    title: 'Sounds Like Us',
    pendingUrl: req.session.pendingAnalysisUrl ?? '',
  });
});

// ---- Create analysis job ----
// Requires auth. If not logged in, stash the URL and redirect to register.

router.post('/analyze', (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.pendingAnalysisUrl = req.body.url ?? '';
    req.session.returnTo = '/slu';
    return res.redirect('/register');
  }
  next();
}, async (req, res) => {
  const url = (req.body.url ?? '').trim();
  if (!url) return res.redirect('/slu');

  delete req.session.pendingAnalysisUrl;

  const job = await createJob('slu.analysis', { url }, {
    userId: req.user.id,
    orgId:  req.user.memberships?.[0]?.orgId ?? null,
  });

  res.redirect(`/slu/jobs/${job.id}`);
});

// ---- Job status / progress page ----

router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) {
    return res.status(404).render('pages/error', { status: 404, message: 'Job not found' });
  }

  res.render('pages/slu/job', {
    tool: 'slu',
    title: 'Analyzing…',
    job: {
      id:     job.id,
      status: job.status,
      url:    job.payload?.url,
      errorMsg: job.errorMsg,
    },
  });
});

// ---- Job status JSON (polled by the progress page) ----

router.get('/jobs/:jobId/status', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json({ status: job.status, result: job.result, errorMsg: job.errorMsg });
});

// ---- Guidance result ----

router.get('/jobs/:jobId/result', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) {
    return res.status(404).render('pages/error', { status: 404, message: 'Job not found' });
  }
  if (job.status !== 'DONE') {
    return res.redirect(`/slu/jobs/${job.id}`);
  }

  const guidancePath = job.result?.guidancePath;
  let guidance = null;
  if (guidancePath) {
    try {
      const artifact = await readArtifactJson(guidancePath);
      guidance = artifact.guidance;
    } catch { /* artifact missing or malformed */ }
  }

  res.render('pages/slu/result', {
    tool: 'slu',
    title: job.result?.orgName ? `${job.result.orgName} — Guidance` : 'Guidance',
    job: {
      id:        job.id,
      url:       job.payload?.url,
      orgName:   job.result?.orgName,
      pageCount: job.result?.pageCount,
    },
    guidance,
  });
});

// ---- Recent analyses (for logged-in users) ----

router.get('/history', requireAuth, async (req, res) => {
  const jobs = await listJobs({ userId: req.user.id, type: 'slu.analysis', limit: 20 });
  res.render('pages/slu/history', {
    tool: 'slu',
    title: 'Your analyses',
    jobs: jobs.map(j => ({
      id:         j.id,
      url:        j.payload?.url,
      status:     j.status,
      orgName:    j.result?.orgName,
      createdAt:  j.createdAt,
    })),
  });
});

export default router;
