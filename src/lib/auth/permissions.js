// lib/auth/permissions.js

export const ROLES = {
  ADMIN: 'admin',
  ACCOUNT_MANAGER: 'account_manager',
  DESIGNER: 'designer',
  COPYWRITER: 'copywriter',
  MOTION_DESIGNER: 'motion_designer',
  STRATEGIST: 'strategist',
}

// Roles AM is allowed to create
export const AM_CREATABLE_ROLES = [
  'account_manager',
  'designer',
  'copywriter',
  'motion_designer',
  'strategist',
]

// Roles Admin is allowed to create
export const ADMIN_CREATABLE_ROLES = [
  'admin',
  'account_manager',
  'designer',
  'copywriter',
  'motion_designer',
  'strategist',
]

export function canManageBrands(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function canCreateUsers(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function canAssignMembers(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function canManageDeliverables(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function canManageTasks(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function canViewAnalytics(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function canAddCopies(role) {
  return ['admin', 'account_manager', 'copywriter'].includes(role)
}

export function canAddAssets(role) {
  return ['admin', 'account_manager', 'designer', 'motion_designer'].includes(role)
}

export function canRouteRejection(role) {
  return ['admin', 'account_manager'].includes(role)
}

export function getCreatableRoles(creatorRole) {
  if (creatorRole === 'admin') return ADMIN_CREATABLE_ROLES
  if (creatorRole === 'account_manager') return AM_CREATABLE_ROLES
  return []
}

export function canPerformAction(role, action) {
  const permissions = {
    admin: [
      'create_tasks',
      'assign_members',
      'create_deliverables',
      'route_rejection',
      'view_analytics',
    ],
    account_manager: [
      'create_tasks',
      'assign_members',
      'create_deliverables',
      'route_rejection',
      'view_analytics',
    ],
    designer: [],
    copywriter: [],
    motion_designer: [],
    strategist: [],
  };

  return permissions[role]?.includes(action);
}