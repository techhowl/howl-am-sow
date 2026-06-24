'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RoleBadge from '@/components/shared/RoleBadge'
import CreateUserModal from '@/components/users/CreateUserModal'
import { SkeletonTable } from '@/components/shared/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { IconMedallion } from '@/components/shared/IconMedallion'
import { RBAC_ROLES, isSuperadmin } from '@/lib/auth/permissions'

// Roles a superadmin can assign from the dropdown ('user' = no access)
const ROLE_OPTIONS = [
  { value: 'user', label: 'User (no access)' },
  ...RBAC_ROLES.map((r) => ({
    value: r,
    label: r.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
  })),
]

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const superadmin = isSuperadmin(session?.user?.role)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  // Superadmin-only route
  useEffect(() => {
    if (status === 'authenticated' && !superadmin) router.replace('/dashboard')
  }, [status, superadmin, router])

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) setUsers(data.users)
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(userId, current) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: !current } : u))
      )
    }
  }

  async function updateRole(userId, newRole) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      )
    } else {
      const data = await res.json().catch(() => null)
      alert(data?.error || 'Could not update role')
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-background p-8 mx-auto w-full max-w-4xl">

      <PageHeader
        eyebrow="TEAM"
        title="Team members"
        lede={`${users.filter((u) => u.isActive).length} active · ${users.length} total`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add user
          </button>
        }
      />

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input mb-4 block w-64"
      />

      {/* Table */}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} className="rounded-none border-0 bg-transparent" />
        ) : filtered.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No users found.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border">
                {['Member', 'Role', 'Status', 'Joined', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user._id}
                  className={`transition-colors hover:bg-muted ${
                    i < filtered.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  {/* Member */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <IconMedallion tone="--primary" size="sm">
                        {user.name.charAt(0).toUpperCase()}
                      </IconMedallion>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">
                          {user.name}
                          {user._id === session?.user?.id && (
                            <span className="ml-1.5 inline-block rounded px-1.5 py-px text-[11px] font-medium text-primary bg-primary/10">
                              you
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-px">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3.5">
                    {user._id === session?.user?.id || user.role === 'superadmin' ? (
                      <RoleBadge role={user.role} />
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user._id, e.target.value)}
                        className="input w-auto cursor-pointer py-1.5 text-xs"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        user.isActive ? 'text-success' : 'text-muted-foreground'
                      }`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                          user.isActive ? 'bg-success' : 'bg-muted-foreground'
                        }`}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    {user._id !== session?.user?.id && (
                      <button
                        onClick={() => toggleStatus(user._id, user.isActive)}
                        className={`btn-ghost text-xs ${
                          user.isActive ? 'text-destructive' : 'text-success'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={(u) => setUsers((prev) => [u, ...prev])}
          creatorRole={session?.user?.role}
        />
      )}
    </div>
  )
}
