export { configurePassport } from './passport.js';
export { buildSessionMiddleware } from './session.js';
export { requireAuth, requireAdmin } from './middleware.js';
export { registerLocalUser } from './strategies/local.js';
export { findUserByEmail, loadUser, ensureOrgMembership } from './user-service.js';
