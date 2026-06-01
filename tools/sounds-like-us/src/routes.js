import { Router } from 'express';
import { createJob, getJob, listJobs } from '@rumbo/jobs';
import { readArtifactJson, writeArtifact, artifactPath } from '@rumbo/storage';
import { requireAuth } from '@rumbo/auth';
import { assembleBlocks, defaultIncludedBlocks, renderPlainText, renderMarkdown } from './guidance-assembly.service.js';
import { saveFeedback } from './feedback.service.js';
import { BEST_PRACTICE_PACKS } from './best-practice-packs.config.js';
import { GENERIC_BLOCKS } from './guidance-blocks.config.js';
import { getGuidancePackage } from './config/config-loader.js';

const router = Router();

function downloadSelectionsFromRequest(req, savedOptions) {
  const selections = savedOptions ? { ...savedOptions } : {
    guidanceTask: 'write_new',
    lengthDetail: 'standard_article',
    readingLevel: 'general_adult',
    bestPracticePack: 'none',
  };

  for (const key of ['guidanceTask', 'lengthDetail', 'readingLevel', 'bestPracticePack']) {
    if (typeof req.query[key] === 'string' && req.query[key].trim()) {
      selections[key] = req.query[key].trim();
    }
  }

  const includedBlocks = typeof req.query.includedBlocks === 'string'
    ? req.query.includedBlocks.split(',').map(id => id.trim()).filter(Boolean)
    : savedOptions?.includedBlocks;

  return { selections, includedBlocks };
}

function isCurrentGuidanceArtifact(artifact) {
  return Boolean(
    artifact?.version === 'sounds-like-us.guidance.v1'
    && artifact?.organization?.name
    && artifact?.organization?.shortName
    && artifact?.organization?.detectedType
    && artifact?.voiceTone?.previewSummary
    && artifact?.voiceTone?.fullGuidance
    && Array.isArray(artifact?.guidanceBlocks)
    && artifact.guidanceBlocks.every(block => block?.id && block?.label && block?.heading && block?.fullText)
  );
}

router.get('/', (req, res) => {
  res.render('pages/slu/index', {
    tool: 'slu',
    title: 'Sounds Like Us',
    pendingUrl: req.session.pendingAnalysisUrl ?? '',
  });
});

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

router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) {
    return res.status(404).render('pages/error', { status: 404, message: 'Job not found' });
  }
  res.render('pages/slu/job', {
    tool: 'slu',
    title: 'Analyzing…',
    job: { id: job.id, status: job.status, url: job.payload?.url, errorMsg: job.errorMsg },
  });
});

router.get('/jobs/:jobId/status', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) return res.status(404).json({ error: 'not found' });
  res.json({ status: job.status, result: job.result, errorMsg: job.errorMsg });
});

router.get('/jobs/:jobId/result', requireAuth, (req, res) => {
  res.redirect(`/slu/jobs/${req.params.jobId}/workbench`);
});

router.get('/jobs/:jobId/workbench', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) {
    return res.status(404).render('pages/error', { status: 404, message: 'Run not found' });
  }
  if (job.status === 'PENDING' || job.status === 'RUNNING') {
    return res.redirect(`/slu/jobs/${job.id}`);
  }
  if (job.status === 'FAILED' || job.status === 'CANCELLED') {
    return res.render('pages/slu/job', {
      tool: 'slu',
      title: 'Analysis failed',
      job: { id: job.id, status: job.status, url: job.payload?.url, errorMsg: job.errorMsg },
    });
  }

  let guidance = null;
  const guidancePath = job.result?.guidancePath;
  if (guidancePath) {
    try {
      const artifact = await readArtifactJson(guidancePath);
      if (isCurrentGuidanceArtifact(artifact)) {
        guidance = artifact;
      }
    } catch { /* artifact missing or malformed */ }
  }

  if (!guidance) {
    return res.render('pages/slu/workbench', {
      tool: 'slu',
      title: 'Guidance workbench',
      job: { id: job.id, url: job.payload?.url, orgName: job.result?.orgName },
      initialDataJson: 'null',
      error: 'The guidance for this run could not be loaded. The analysis may be incomplete.',
    });
  }

  let savedOptions = null;
  try {
    savedOptions = await readArtifactJson(artifactPath('slu/options', job.id, 'options.json'));
  } catch { /* no saved options yet */ }

  const initialData = {
    jobId:     job.id,
    url:       job.payload?.url,
    orgName:   guidance.organization?.name ?? job.result?.orgName,
    guidance,
    guidancePackage: getGuidancePackage(),
    savedOptions,
    bestPracticePacks: BEST_PRACTICE_PACKS,
    genericBlocks: GENERIC_BLOCKS.map(b => ({ id: b.id, label: b.label, defaultIncluded: b.defaultIncluded })),
    downloadUrlBase: `/slu/jobs/${job.id}/workbench/download`,
    feedbackUrl: `/slu/jobs/${job.id}/feedback`,
    optionsSaveUrl: `/slu/jobs/${job.id}/workbench/options`,
  };

  res.render('pages/slu/workbench', {
    tool: 'slu',
    title: `${guidance.organization?.name ?? 'Guidance'} — Workbench`,
    job: { id: job.id, url: job.payload?.url, orgName: guidance.organization?.name, pageCount: job.result?.pageCount },
    initialDataJson: JSON.stringify(initialData),
    error: null,
  });
});

router.patch('/jobs/:jobId/workbench/options', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) return res.status(404).json({ error: 'not found' });
  const allowed = ['guidanceTask', 'lengthDetail', 'readingLevel', 'bestPracticePack', 'outputFormat', 'includedBlocks'];
  const options = { savedAt: new Date().toISOString() };
  for (const key of allowed) { if (req.body[key] !== undefined) options[key] = req.body[key]; }
  await writeArtifact({
    jobId: job.id, type: 'slu.options',
    relativePath: artifactPath('slu/options', job.id, 'options.json'),
    content: JSON.stringify(options, null, 2),
  });
  res.json({ ok: true });
});

router.get('/jobs/:jobId/workbench/download', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) return res.status(404).send('Not found');
  const format = req.query.format === 'md' ? 'md' : 'txt';
  let guidance = null;
  const guidancePath = job.result?.guidancePath;
  if (guidancePath) {
    try {
      const artifact = await readArtifactJson(guidancePath);
      guidance = isCurrentGuidanceArtifact(artifact) ? artifact : null;
    } catch { /* missing */ }
  }
  if (!guidance) return res.status(422).send('Guidance not available');
  let savedOptions = null;
  try { savedOptions = await readArtifactJson(artifactPath('slu/options', job.id, 'options.json')); } catch { /* defaults */ }
  const { selections, includedBlocks } = downloadSelectionsFromRequest(req, savedOptions);
  const includedIds = includedBlocks ? new Set(includedBlocks) : defaultIncludedBlocks(guidance);
  const blocks = assembleBlocks(guidance, selections, includedIds);
  const orgName = guidance.organization?.name ?? 'Organization';
  const slug = orgName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  if (format === 'md') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-guidance.md"`);
    return res.send(renderMarkdown(guidance, blocks));
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-guidance.txt"`);
  res.send(renderPlainText(guidance, blocks));
});

router.post('/jobs/:jobId/feedback', requireAuth, async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job || job.userId !== req.user.id) return res.status(404).json({ error: 'not found' });
  const ratingNum = parseInt(req.body.rating, 10);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'rating must be 1-5' });
  try {
    await saveFeedback({ jobId: job.id, userId: req.user.id, orgId: job.orgId ?? null, rating: ratingNum, comment: req.body.comment, category: req.body.category, options: req.body.options ?? null });
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/history', requireAuth, async (req, res) => {
  const jobs = await listJobs({ userId: req.user.id, type: 'slu.analysis', limit: 20 });
  res.render('pages/slu/history', {
    tool: 'slu',
    title: 'Your analyses',
    jobs: jobs.map(j => ({ id: j.id, url: j.payload?.url, status: j.status, orgName: j.result?.orgName, createdAt: j.createdAt })),
  });
});

export default router;
