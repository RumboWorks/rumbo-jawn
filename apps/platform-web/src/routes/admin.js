import { Router } from 'express';
import { requirePlatformAdmin } from '@rumbo/auth';
import {
  getAdminDashboard,
  getAdminJobDetail,
  listAdminAiCalls,
  listAdminJobs,
  listAdminOrganizations,
  listAdminUsers,
} from '../services/admin-service.js';

const router = Router();

router.use(requirePlatformAdmin);

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get('/', asyncHandler(async (req, res) => {
  const dashboard = await getAdminDashboard();
  res.render('pages/admin/index', {
    title: 'Admin',
    active: 'dashboard',
    dashboard,
  });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = await listAdminUsers();
  res.render('pages/admin/users', {
    title: 'Admin users',
    active: 'users',
    users,
  });
}));

router.get('/orgs', asyncHandler(async (req, res) => {
  const orgs = await listAdminOrganizations();
  res.render('pages/admin/orgs', {
    title: 'Admin organizations',
    active: 'orgs',
    orgs,
  });
}));

router.get('/jobs', asyncHandler(async (req, res) => {
  const type = typeof req.query.type === 'string' && req.query.type.trim() ? req.query.type.trim() : null;
  const status = typeof req.query.status === 'string' && req.query.status.trim() ? req.query.status.trim() : null;
  const jobs = await listAdminJobs({ type, status });
  res.render('pages/admin/jobs', {
    title: 'Admin jobs',
    active: 'jobs',
    jobs,
    filters: { type, status },
  });
}));

router.get('/sounds-like-us', asyncHandler(async (req, res) => {
  const jobs = await listAdminJobs({ type: 'slu.analysis' });
  res.render('pages/admin/jobs', {
    title: 'Sounds Like Us runs',
    active: 'slu',
    jobs,
    filters: { type: 'slu.analysis', status: null },
    pageHeading: 'Sounds Like Us runs',
    pageDescription: 'Recent Sounds Like Us analyses shown through the shared platform job records.',
  });
}));

router.get('/ai-calls', asyncHandler(async (req, res) => {
  const aiCalls = await listAdminAiCalls();
  res.render('pages/admin/ai-calls', {
    title: 'Admin AI calls',
    active: 'ai-calls',
    aiCalls,
  });
}));

router.get('/failures', asyncHandler(async (req, res) => {
  const jobs = await listAdminJobs({ status: 'FAILED' });
  res.render('pages/admin/jobs', {
    title: 'Admin failures',
    active: 'failures',
    jobs,
    filters: { type: null, status: 'FAILED' },
    pageHeading: 'Failures',
    pageDescription: 'Jobs that ended in a failed state, newest first.',
  });
}));

router.get('/jobs/:jobId/debug', asyncHandler(async (req, res) => {
  const job = await getAdminJobDetail(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json({
    id: job.id,
    type: job.type,
    status: job.status,
    user: job.user ? { id: job.user.id, email: job.user.email, name: job.user.name } : null,
    org: job.org ? { id: job.org.id, publicId: job.org.publicId, name: job.org.name, slug: job.org.slug } : null,
    payload: job.payload,
    result: job.result,
    errorMsg: job.errorMsg,
    aiCalls: job.aiCalls,
    artifacts: job.artifacts,
  });
}));

router.get('/jobs/:jobId', asyncHandler(async (req, res) => {
  const job = await getAdminJobDetail(req.params.jobId);
  if (!job) {
    return res.status(404).render('pages/error', { status: 404, message: 'Job not found' });
  }

  res.render('pages/admin/job-detail', {
    title: `Job ${job.id}`,
    active: 'jobs',
    job,
  });
}));

export default router;
