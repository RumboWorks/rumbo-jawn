// Eval tool — web-facing entry point (router only, no AI dependencies).
// Mounted at /eval behind requireToolAccess('eval').
export { default as evalRouter } from './routes.js';
export { default as evalShareRouter } from './share.js';
export { seedEvalProviders } from './seed.js';
export { listEvalRunsForAdmin, deleteEvalRunCascade } from './admin.service.js';
