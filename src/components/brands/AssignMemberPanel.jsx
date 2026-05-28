// src/components/brands/AssignMemberPanel.jsx
'use client'
import { useState, useEffect } from 'react'
import RoleBadge from '@/components/shared/RoleBadge'

export default function AssignMemberPanel({ brandId, members, onMembersChange }) {
  const [allUsers, setAllUsers]         = useState([])
  const [search, setSearch]             = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const res  = await fetch('/api/users')
    const data = await res.json()
    if (res.ok) setAllUsers(data.users.filter((u) => u.isActive))
  }

  async function assign(userId) {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/brands/${brandId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (res.ok) onMembersChange([...members, data.member])
    } finally {
      setActionLoading(null)
    }
  }

  async function remove(userId) {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/brands/${brandId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        onMembersChange(members.filter((m) => m.userId._id !== userId))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const memberUserIds = members.map((m) => m.userId._id?.toString())
  const filtered = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search users to add..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '13px',
          color: '#111827',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          marginBottom: '12px',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.target.style.border    = '1px solid #4f46e5'
          e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'
        }}
        onBlur={(e) => {
          e.target.style.border    = '1px solid #e5e7eb'
          e.target.style.boxShadow = 'none'
        }}
      />

      {/* User list — scrollable region.
          - maxHeight raised so short lists don't need to scroll at all
          - overscrollBehavior: 'contain' prevents scroll-chaining into the page
            (fixes the "scroll stuck" feeling when cursor enters this region)
          - paddingRight reserves space for the scrollbar so rows don't shift */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxHeight: '420px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          paddingRight: '4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {filtered.length === 0 && (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
            No users match your search.
          </div>
        )}
        {filtered.map((user) => {
          const isMember = memberUserIds.includes(user._id?.toString())
          const busy     = actionLoading === user._id
          return (
            <div
              key={user._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: isMember ? '#f9fafb' : '#fff',
                border: '1px solid #e5e7eb',
                flexShrink: 0,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: '#4f46e5',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </div>
                <div style={{ marginTop: '2px' }}>
                  <RoleBadge role={user.role} />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => (isMember ? remove(user._id) : assign(user._id))}
                disabled={busy}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  background: 'transparent',
                  transition: 'all 0.1s',
                  borderColor: isMember ? '#fca5a5' : '#c7d2fe',
                  color:       isMember ? '#b91c1c' : '#4f46e5',
                }}
              >
                {busy ? '...' : isMember ? 'Remove' : 'Add'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}