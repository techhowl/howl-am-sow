// src/components/layout/NotificationBell.jsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createPortal } from 'react-dom'

const TYPE_COLORS = {
  task_assigned:  'bg-[var(--color-chart-4)]/10 text-[var(--color-chart-4)]',
  status_changed: 'bg-[var(--color-chart-2)]/10 text-[var(--color-chart-2)]',
  task_rejected:  'bg-destructive/10 text-destructive',
  task_approved:  'bg-success/10 text-success',
  task_live:      'bg-success/10 text-success',
  mentioned:      'bg-[var(--color-chart-5)]/10 text-[var(--color-chart-5)]',
  comment_added:  'bg-muted text-muted-foreground',
  brand_added:    'bg-warning/10 text-warning',
}

function NotifItem({ n, onRead, onNavigate }) {
  const unread = !n.isRead

  async function handleClick() {
    if (unread) await onRead(n._id)
    if (n.entityType === 'task' && n.brandId) {
      onNavigate(`/brands/${n.brandId}/tasks`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border last:border-0 ${
        unread ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted'
      }`}
    >
      <div className="shrink-0 mt-2">
        <div className={`w-1.5 h-1.5 rounded-full ${unread ? 'bg-primary' : 'bg-transparent'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-snug">{n.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
      {n.type && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || 'bg-muted text-muted-foreground'}`}>
          {n.type.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  )
}

export default function NotificationBell() {
  const router        = useRouter()
  const bellRef       = useRef(null)
  const dropdownRef   = useRef(null)

  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(false)
  const [dropdownPos, setDropdownPos]     = useState({ top: 0, left: 0 })
  const [mounted, setMounted]             = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  const fetchNotifs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {}
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => { fetchNotifs() }, [])

  useEffect(() => {
    if (open) {
      fetchNotifs()
      // Position dropdown relative to bell button
      if (bellRef.current) {
        const rect = bellRef.current.getBoundingClientRect()
        setDropdownPos({
          top:  rect.bottom + 8,
          left: Math.max(8, rect.left - 280 + rect.width), // align right edge to bell
        })
      }
    }
  }, [open])

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchNotifs(true), 30000)
    return () => clearInterval(intervalRef.current)
  }, [fetchNotifs])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  async function markRead(id) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAll() {
    await fetch('/api/notifications/mark-all-read', { method: 'PATCH' })
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position:    'fixed',
        top:         dropdownPos.top,
        left:        dropdownPos.left,
        width:       '320px',
        zIndex:      999999,
        background:  'var(--popover)',
        border:      '1px solid var(--border)',
        borderRadius:'16px',
        boxShadow:   '0 16px 48px rgba(0,0,0,0.14)',
        overflow:    'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--popover-foreground)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ fontSize:10, fontWeight:700, background:'color-mix(in oklab, var(--primary) 12%, transparent)', color:'var(--primary)', borderRadius:99, padding:'2px 7px' }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              title="Mark all read"
              style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'var(--muted-foreground)', display:'flex' }}
              onMouseEnter={(e) => { e.currentTarget.style.background='color-mix(in oklab, var(--primary) 12%, transparent)'; e.currentTarget.style.color='var(--primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted-foreground)' }}
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'var(--muted-foreground)', display:'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.color='var(--foreground)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted-foreground)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'32px 0' }}>
            <div style={{ width:20, height:20, border:'2px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 16px' }}>
            <Bell size={28} color="var(--border)" style={{ margin:'0 auto 8px' }} />
            <p style={{ fontSize:12, color:'var(--muted-foreground)' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotifItem
              key={n._id}
              n={n}
              onRead={markRead}
              onNavigate={(href) => { setOpen(false); router.push(href) }}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding:'8px 16px', borderTop:'1px solid var(--border)', background:'var(--muted)' }}>
          <p style={{ fontSize:10, color:'var(--muted-foreground)', textAlign:'center' }}>
            Last {notifications.length} · Refreshes every 30s
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          position:   'relative',
          padding:    6,
          borderRadius: 8,
          border:     'none',
          background: 'transparent',
          cursor:     'pointer',
          color:      'color-mix(in oklab, var(--sidebar-foreground) 70%, transparent)',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background='var(--sidebar-accent)'; e.currentTarget.style.color='var(--sidebar-foreground)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='color-mix(in oklab, var(--sidebar-foreground) 70%, transparent)' }}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position:   'absolute',
            top:        -2,
            right:      -2,
            width:      16,
            height:     16,
            background: 'var(--destructive)',
            color:      'var(--destructive-foreground)',
            fontSize:   9,
            fontWeight: 700,
            borderRadius: '50%',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {dropdown}
    </>
  )
}