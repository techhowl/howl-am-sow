// src/components/layout/NotificationBell.jsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createPortal } from 'react-dom'

const TYPE_COLORS = {
  task_assigned:  'bg-indigo-100 text-indigo-700',
  status_changed: 'bg-blue-100 text-blue-700',
  task_rejected:  'bg-red-100 text-red-700',
  task_approved:  'bg-green-100 text-green-700',
  task_live:      'bg-emerald-100 text-emerald-700',
  mentioned:      'bg-purple-100 text-purple-700',
  comment_added:  'bg-gray-100 text-gray-600',
  brand_added:    'bg-amber-100 text-amber-700',
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
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
        unread ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="shrink-0 mt-2">
        <div className={`w-1.5 h-1.5 rounded-full ${unread ? 'bg-indigo-500' : 'bg-transparent'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
      {n.type && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-500'}`}>
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
        background:  '#ffffff',
        border:      '1px solid #e5e7eb',
        borderRadius:'16px',
        boxShadow:   '0 16px 48px rgba(0,0,0,0.14)',
        overflow:    'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #f3f4f6' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ fontSize:10, fontWeight:700, background:'#eef2ff', color:'#4f46e5', borderRadius:99, padding:'2px 7px' }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              title="Mark all read"
              style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#9ca3af', display:'flex' }}
              onMouseEnter={(e) => { e.currentTarget.style.background='#eef2ff'; e.currentTarget.style.color='#4f46e5' }}
              onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9ca3af' }}
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#9ca3af', display:'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#374151' }}
            onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9ca3af' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'32px 0' }}>
            <div style={{ width:20, height:20, border:'2px solid #e5e7eb', borderTopColor:'#4f46e5', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 16px' }}>
            <Bell size={28} color="#e5e7eb" style={{ margin:'0 auto 8px' }} />
            <p style={{ fontSize:12, color:'#9ca3af' }}>No notifications yet</p>
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
        <div style={{ padding:'8px 16px', borderTop:'1px solid #f3f4f6', background:'#fafafa' }}>
          <p style={{ fontSize:10, color:'#9ca3af', textAlign:'center' }}>
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
          color:      '#6b7280',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#d1d5db' }}
        onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }}
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
            background: '#ef4444',
            color:      '#fff',
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