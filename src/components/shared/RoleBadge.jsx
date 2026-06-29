// src/components/shared/RoleBadge.jsx

const ROLE_STYLES = {
  superadmin: { bg: 'color-mix(in oklab, var(--color-chart-5) 12%, transparent)', color: 'var(--color-chart-5)' },
  admin: { bg: 'color-mix(in oklab, var(--color-chart-4) 12%, transparent)', color: 'var(--color-chart-4)' },
  account_manager: { bg: 'color-mix(in oklab, var(--color-chart-2) 12%, transparent)', color: 'var(--color-chart-2)' },
  management_trainee_am: { bg: 'color-mix(in oklab, var(--color-chart-3) 12%, transparent)', color: 'var(--color-chart-3)' },
  executive_am: { bg: 'color-mix(in oklab, var(--color-chart-1) 12%, transparent)', color: 'var(--color-chart-1)' },
  senior_am: { bg: 'color-mix(in oklab, var(--color-chart-2) 12%, transparent)', color: 'var(--color-chart-2)' },
  lead_am: { bg: 'color-mix(in oklab, var(--color-chart-4) 12%, transparent)', color: 'var(--color-chart-4)' },
  designer: { bg: 'color-mix(in oklab, var(--color-chart-5) 12%, transparent)', color: 'var(--color-chart-5)' },
  copywriter: { bg: 'color-mix(in oklab, var(--color-chart-3) 12%, transparent)', color: 'var(--color-chart-3)' },
  motion_designer: { bg: 'color-mix(in oklab, var(--color-chart-2) 12%, transparent)', color: 'var(--color-chart-2)' },
  user: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
}

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  account_manager: 'Account Manager',
  management_trainee_am: 'Management Trainee AM',
  executive_am: 'Executive AM',
  senior_am: 'Senior AM',
  lead_am: 'Lead AM',
  designer: 'Designer',
  copywriter: 'Copywriter',
  motion_designer: 'Motion Designer',
  user: 'User',
}

export default function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] || { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
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