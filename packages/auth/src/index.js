export { configurePassport } from './passport.js';
export { buildSessionMiddleware } from './session.js';
export { requireAuth, requireAdmin, requirePlatformAdmin } from './middleware.js';
export { registerLocalUser } from './strategies/local.js';
export { findUserByEmail, loadUser, ensureOrgMembership } from './user-service.js';
export * from './account-service.js';
export { Role, Permission, can } from './permissions.js';
export { resolveRole, listAccessibleOrganizations } from './org-access-service.js';
export {
  resolveToolRole,
  listAccessibleTools,
  requireToolAccess,
  toolRoleAtLeast,
  primaryOrgIdForUser,
} from './tool-access-service.js';
