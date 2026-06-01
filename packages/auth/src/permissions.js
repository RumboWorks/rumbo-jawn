export const Role = Object.freeze({
  PLATFORM_ADMIN: 'platform_admin',
  PARTNER_MANAGER: 'partner_manager',
  ORG_MANAGER: 'org_manager',
  ORG_MEMBER: 'org_member',
});

export const Permission = Object.freeze({
  ACCESS_ADMIN: 'access_admin',
  VIEW_ORG: 'view_org',
  EDIT_ORG: 'edit_org',
  VIEW_ORG_MEMBERS: 'view_org_members',
  MANAGE_ORG_MEMBERS: 'manage_org_members',
});

const MANAGERS = [Role.PLATFORM_ADMIN, Role.PARTNER_MANAGER, Role.ORG_MANAGER];
const ALL_ORG = [Role.PLATFORM_ADMIN, Role.PARTNER_MANAGER, Role.ORG_MANAGER, Role.ORG_MEMBER];

const PERMISSION_MAP = {
  [Permission.ACCESS_ADMIN]: [Role.PLATFORM_ADMIN],
  [Permission.VIEW_ORG]: ALL_ORG,
  [Permission.EDIT_ORG]: MANAGERS,
  [Permission.VIEW_ORG_MEMBERS]: ALL_ORG,
  [Permission.MANAGE_ORG_MEMBERS]: MANAGERS,
};

export function can(role, permission) {
  if (!role) return false;
  return PERMISSION_MAP[permission]?.includes(role) ?? false;
}

