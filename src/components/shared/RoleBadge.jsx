// src/components/shared/RoleBadge.jsx

const ROLE_STYLES = {
  admin: { bg: '#ede9fe', color: '#6d28d9' },
  account_manager: { bg: '#dbeafe', color: '#1d4ed8' },
  designer: { bg: '#fce7f3', color: '#be185d' },
  copywriter: { bg: '#fef3c7', color: '#b45309' },
  motion_designer: { bg: '#ccfbf1', color: '#0f766e' },
  strategist: { bg: '#dcfce7', color: '#15803d' },
}

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  designer: 'Designer',
  copywriter: 'Copywriter',
  motion_designer: 'Motion Designer',
  strategist: 'Strategist',
}

export default function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] || { bg: '#f3f4f6', color: '#6b7280' }
  const label = ROLE_LABELS[role] || role

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  )
}