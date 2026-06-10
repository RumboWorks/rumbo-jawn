export { configurePassport } from './passport.js';
export { buildSessionMiddleware } from './session.js';
export { requireAuth, requireAdmin, requirePlatformAdmin } from './middleware.js';
export { registerLocalUser } from './strategies/local.js';
export { findUserByEmail, loadUser, ensureOrgMembership } from './user-service.js';
export * from './account-service.js';
export { sendEmail, buildAbsoluteUrl } from './email-service.js';
export { normalizePersonName, displayNameForUser, firstNameForUser } from './names.js';
export { Role, Permission, can } from './permissions.js';
export { resolveRole, listAccessibleOrganizations } from './org-access-service.js';
export {
  primaryOrgIdForUser,
  resolveActiveOrganization,
  setActiveOrganization,
  loadActiveOrganization,
} from './org-context-service.js';
export {
  resolveToolRole,
  listAccessibleTools,
  requireToolAccess,
  toolRoleAtLeast,
} from './tool-access-service.js';
export {
  adminCreateOrganization,
  adminSoftDeleteOrganization,
  uniqueOrgSlug,
} from './org-admin-service.js';
export {
  listPartnerAccounts,
  getPartnerAccountDetail,
  listPartnerAccountsForUser,
  createPartnerAccount,
  updatePartnerAccount,
  addPartnerMember,
  removePartnerMember,
  grantPartnerOrgAccess,
  revokePartnerOrgAccess,
} from './partner-service.js';
