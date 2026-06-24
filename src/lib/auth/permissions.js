// lib/auth/permissions.js

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  ACCOUNT_MANAGER: 'account_manager',
  DESIGNER: 'designer',
  COPYWRITER: 'copywriter',
  MOTION_DESIGNER: 'motion_designer',
  USER: 'user',
}

// All assignable RBAC roles (excludes superadmin — set only via seed — and user — the no-access holding state)
export const RBAC_ROLES = [
  'admin',
  'account_manager',
  'designer',
  'copywriter',
  'motion_designer',
]

// Roles AM is allowed to create
export const AM_CREATABLE_ROLES = [
  'account_manager',
  'designer',
  'copywriter',
  'motion_designer',
]

// Roles Admin is allowed to create
export const ADMIN_CREATABLE_ROLES = [
  'admin',
  'account_manager',
  'designer',
  'copywriter',
  'motion_designer',
]

// Roles Superadmin is allowed to create (all RBAC roles; not superadmin, not user)
export const SUPERADMIN_CREATABLE_ROLES = [...RBAC_ROLES]

export function isSuperadmin(role) {
  return role === 'superadmin'
}

// A bare 'user' has no access — placeholder until a superadmin assigns an RBAC role
export function hasNoAccess(role) {
  return role === 'user'
}

// Only superadmin can change other users' roles / manage access
export function canManageRoles(role) {
  return role === 'superadmin'
}

export function canManageBrands(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function canCreateUsers(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function canAssignMembers(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function canManageDeliverables(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function canManageTasks(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function canViewAnalytics(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function canAddCopies(role) {
  return ['superadmin', 'admin', 'account_manager', 'copywriter'].includes(role)
}

export function canAddAssets(role) {
  return ['superadmin', 'admin', 'account_manager', 'designer', 'motion_designer'].includes(role)
}

export function canRouteRejection(role) {
  return ['superadmin', 'admin', 'account_manager'].includes(role)
}

export function getCreatableRoles(creatorRole) {
  if (creatorRole === 'superadmin') return SUPERADMIN_CREATABLE_ROLES
  if (creatorRole === 'admin') return ADMIN_CREATABLE_ROLES
  if (creatorRole === 'account_manager') return AM_CREATABLE_ROLES
  return []
}

export function canPerformAction(role, action) {
  const adminActions = [
    'create_tasks',
    'assign_members',
    'create_deliverables',
    'route_rejection',
    'view_analytics',
  ];

  const permissions = {
    superadmin: adminActions,
    admin: adminActions,
    account_manager: adminActions,
    designer: [],
    copywriter: [],
    motion_designer: [],
    user: [],
  };

  return permissions[role]?.includes(action);
}
