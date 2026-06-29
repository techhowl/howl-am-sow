// lib/auth/permissions.js

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  ACCOUNT_MANAGER: 'account_manager',
  MANAGEMENT_TRAINEE_AM: 'management_trainee_am',
  EXECUTIVE_AM: 'executive_am',
  SENIOR_AM: 'senior_am',
  LEAD_AM: 'lead_am',
  DESIGNER: 'designer',
  COPYWRITER: 'copywriter',
  MOTION_DESIGNER: 'motion_designer',
  USER: 'user',
}

// Account-manager family — all share full AM-level access to the app
export const AM_ROLES = [
  'account_manager',
  'management_trainee_am',
  'executive_am',
  'senior_am',
  'lead_am',
]

// Management-tier roles: full app access (brands, tasks, members, analytics…).
// SOW writes are narrower — see SOW_MANAGER_ROLES / canManageSOW.
export const MANAGEMENT_ROLES = ['superadmin', 'admin', ...AM_ROLES]

// Only these roles may add / edit / delete Scope of Work under a brand.
// Among the AM family that's Senior AM and Lead AM only; other AM roles are view-only.
export const SOW_MANAGER_ROLES = [
  'superadmin',
  'admin',
  'account_manager',
  'senior_am',
  'lead_am',
]

// All assignable RBAC roles (excludes superadmin — set only via seed — and user — the no-access holding state)
export const RBAC_ROLES = [
  'admin',
  'account_manager',
  'management_trainee_am',
  'executive_am',
  'senior_am',
  'lead_am',
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
  'management_trainee_am',
  'executive_am',
  'senior_am',
  'lead_am',
  'designer',
  'copywriter',
  'motion_designer',
]

// Roles Superadmin is allowed to create (all RBAC roles; not superadmin, not user)
export const SUPERADMIN_CREATABLE_ROLES = [...RBAC_ROLES]

// Human-readable labels for every role
export const ROLE_LABELS = {
  superadmin:            'Super Admin',
  admin:                 'Admin',
  account_manager:       'Account Manager',
  management_trainee_am: 'Management Trainee AM',
  executive_am:          'Executive AM',
  senior_am:             'Senior AM',
  lead_am:               'Lead AM',
  designer:              'Designer',
  copywriter:            'Copywriter',
  motion_designer:       'Motion Designer',
  user:                  'User',
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role
}

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

// Any management/AM-tier role (admins + the full AM family)
export function isManagement(role) {
  return MANAGEMENT_ROLES.includes(role)
}

// Add / edit / delete Scope of Work — Senior AM & Lead AM only among the AM family
export function canManageSOW(role) {
  return SOW_MANAGER_ROLES.includes(role)
}

export function canManageBrands(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function canCreateUsers(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function canAssignMembers(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function canManageDeliverables(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function canManageTasks(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function canViewAnalytics(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function canAddCopies(role) {
  return [...MANAGEMENT_ROLES, 'copywriter'].includes(role)
}

export function canAddAssets(role) {
  return [...MANAGEMENT_ROLES, 'designer', 'motion_designer'].includes(role)
}

export function canRouteRejection(role) {
  return MANAGEMENT_ROLES.includes(role)
}

export function getCreatableRoles(creatorRole) {
  if (creatorRole === 'superadmin') return SUPERADMIN_CREATABLE_ROLES
  if (creatorRole === 'admin') return ADMIN_CREATABLE_ROLES
  if (AM_ROLES.includes(creatorRole)) return AM_CREATABLE_ROLES
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
    designer: [],
    copywriter: [],
    motion_designer: [],
    user: [],
  };

  // All management-tier roles (admins + full AM family) get the admin action set
  for (const r of MANAGEMENT_ROLES) {
    permissions[r] = adminActions;
  }

  return permissions[role]?.includes(action);
}
