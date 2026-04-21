'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import RoleBadge from '@/components/shared/RoleBadge'
import CreateUserModal from '@/components/users/CreateUserModal'

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

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

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '40px', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', letterSpacing: '-0.01em' }}>
            Team members
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {users.filter((u) => u.isActive).length} active · {users.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#fff',
            background: '#4f46e5',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4338ca')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
        >
          Add user
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '260px',
          padding: '8px 12px',
          fontSize: '13px',
          color: '#111827',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          marginBottom: '16px',
          display: 'block',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid #4f46e5'
          e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid #e5e7eb'
          e.target.style.boxShadow = 'none'
        }}
      />

      {/* Table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <p style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
            No users found.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Member', 'Role', 'Status', 'Joined', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
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
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Member */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#4f46e5',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                          {user.name}
                          {user._id === session?.user?.id && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '11px',
                                color: '#4f46e5',
                                background: '#ede9fe',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: '500',
                              }}
                            >
                              you
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '14px 20px' }}>
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        color: user.isActive ? '#15803d' : '#9ca3af',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: user.isActive ? '#22c55e' : '#d1d5db',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Action */}
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {user._id !== session?.user?.id && (
                      <button
                        onClick={() => toggleStatus(user._id, user.isActive)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: 'transparent',
                          border: '1px solid',
                          borderColor: user.isActive ? '#fca5a5' : '#bbf7d0',
                          color: user.isActive ? '#b91c1c' : '#15803d',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = user.isActive ? '#fef2f2' : '#f0fdf4'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
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