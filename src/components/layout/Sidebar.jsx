'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import NotificationBell from '@/components/layout/NotificationBell'
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
  { label: 'Analytics', href: '/analytics', icon: BarChart2,       roles: ['admin', 'account_manager'] },
  { label: 'Users',     href: '/users',     icon: Users,           roles: ['admin', 'account_manager'] },
]

const ROLE_LABELS = {
  admin:           'Admin',
  account_manager: 'Account Manager',
  designer:        'Designer',
  copywriter:      'Copywriter',
  motion_designer: 'Motion Designer',
  strategist:      'Strategist',
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
      className="fixed top-0 left-0 h-screen flex flex-col z-40 bg-sidebar border-r border-sidebar-border"
      style={{ width: '220px' }}
    >
      {/* Logo + Bell */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
            H
          </div>
          <div>
            <p className="text-gray-50 text-[13px] font-semibold leading-none">Howl</p>
            <p className="text-gray-500 text-[10px] mt-0.5">SOW Tracker</p>
          </div>
        </div>
        <NotificationBell />
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
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                  : 'text-gray-400 border border-transparent hover:bg-sidebar-hover hover:text-gray-200'
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
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-hover mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-100 truncate leading-none">{name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">{ROLE_LABELS[role] || role}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}