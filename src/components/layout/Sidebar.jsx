'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import NotificationBell from '@/components/layout/NotificationBell'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Logo } from '@/components/shared/Logo'
import {
  LayoutDashboard,
  Layers,
  Calendar,
  BarChart2,
  Users,
  LogOut,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: 'all' },
  { label: 'Brands',    href: '/brands',    icon: Layers,          roles: 'all' },
  { label: 'Timeline',  href: '/timeline',  icon: Calendar,        roles: 'all' },
  { label: 'Analytics', href: '/analytics', icon: BarChart2,       roles: ['superadmin', 'admin', 'account_manager'] },
  { label: 'Users',     href: '/users',     icon: Users,           roles: ['superadmin'] },
]

const ROLE_LABELS = {
  superadmin:      'Super Admin',
  admin:           'Admin',
  account_manager: 'Account Manager',
  designer:        'Designer',
  copywriter:      'Copywriter',
  motion_designer: 'Motion Designer',
  user:            'User',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role
  const name = session?.user?.name || ''
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const items = NAV.filter(
    (item) => item.roles === 'all' || item.roles.includes(role)
  )

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-40 bg-sidebar text-sidebar-foreground border-r border-sidebar-border backdrop-blur-xl"
      style={{ width: '220px' }}
    >
      {/* Logo + Bell */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0"
      >
        <Logo size={30} priority />
        <div className="flex items-center gap-1">
          <ThemeToggle className="h-8 w-8 border-sidebar-border bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
          <NotificationBell />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon   = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-sidebar-accent text-sidebar-primary border border-sidebar-border'
                  : 'text-sidebar-foreground/60 border border-transparent hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent mb-1">
          <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-[10px] font-bold shrink-0 ring-1 ring-sidebar-border shadow-sm">
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-sidebar-foreground truncate leading-none">{name}</p>
            <p className="text-[10px] text-sidebar-foreground/55 mt-0.5 truncate">{ROLE_LABELS[role] || role}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-sidebar-foreground/55 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}