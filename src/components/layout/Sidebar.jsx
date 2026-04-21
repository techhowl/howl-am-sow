'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import NotificationBell from '@/components/layout/NotificationBell'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', roles: 'all' },
  { label: 'Brands', href: '/brands', roles: 'all' },
  { label: 'Timeline', href: '/timeline', roles: 'all' },
  {
    label: 'Analytics',
    href: '/analytics',
    roles: ['admin', 'account_manager'],
  },
  {
    label: 'Users',
    href: '/users',
    roles: ['admin', 'account_manager'],
  },
]

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  designer: 'Designer',
  copywriter: 'Copywriter',
  motion_designer: 'Motion Designer',
  strategist: 'Strategist',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const items = NAV.filter(
    (item) => item.roles === 'all' || item.roles.includes(role)
  )

  return (
    <aside className="fixed top-0 left-0 w-62.5 h-screen bg-sidebar flex flex-col border-r border-sidebar-border z-40">

      {/* Logo + Bell */}
      <div className="px-5 pt-5 pb-4 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-[13px] font-bold shrink-0">
          H
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-gray-50 text-sm font-semibold tracking-tight">
            Howl
          </div>
          <div className="text-gray-500 text-[11px]">SOW Tracker</div>
        </div>
        {/* Notification bell — top right of sidebar header */}
        <NotificationBell />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                block px-3 py-2 rounded-lg text-md transition-all
                ${active
                  ? 'bg-sidebar-active text-gray-50 font-medium'
                  : 'text-gray-400 font-normal hover:bg-sidebar-hover hover:text-gray-200'
                }
              `}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2.5 py-3 border-t border-sidebar-border">
        <div className="px-3 py-2.5 rounded-lg bg-sidebar-hover mb-1">
          <div className="text-[13px] font-medium text-gray-50 mb-0.5 truncate">
            {session?.user?.name}
          </div>
          <div className="text-[11px] text-gray-500 truncate">
            {ROLE_LABELS[role] || role}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full px-3 py-2 rounded-lg text-[13px] text-gray-500 text-left transition-all hover:bg-sidebar-hover hover:text-red-500"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}