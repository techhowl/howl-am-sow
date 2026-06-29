// src/components/shared/TaskToast.jsx
// Polls for unread task_assigned notifications and shows toast popups
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Bell, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isManagement } from '@/lib/auth/permissions';

function Toast({ notification, onClose, onNavigate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 6 seconds
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function handleClick() {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onNavigate(notification);
    }, 150);
  }

  return (
    <div
      style={{
        transform:  visible ? 'translateX(0)'    : 'translateX(110%)',
        opacity:    visible ? 1                  : 0,
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
        background: 'var(--card)',
        border:     '1px solid var(--border)',
        borderLeft: '3px solid var(--primary)',
        borderRadius: '12px',
        boxShadow:  '0 8px 32px rgba(0,0,0,0.12)',
        padding:    '12px 14px',
        display:    'flex',
        alignItems: 'flex-start',
        gap:        '10px',
        cursor:     'pointer',
        maxWidth:   '320px',
        width:      '100%',
      }}
      onClick={handleClick}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'color-mix(in oklab, var(--primary) 12%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Bell size={14} color="var(--primary)" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px 0' }}>
          New Task Assigned
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
          {notification.message}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}>View task</span>
          <ArrowRight size={10} color="var(--primary)" />
        </div>
      </div>

      {/* Close */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: 'var(--muted-foreground)',
          padding: 2, display: 'flex', flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function TaskToast() {
  const { data: session } = useSession();
  const router = useRouter();
  const [toasts, setToasts]         = useState([]);
  const seenIdsRef                  = useRef(new Set());
  const isAdminOrAM = isManagement(session?.user?.role);

  // Employees only — admins/AMs don't need task assignment toasts
  const shouldPoll = session && !isAdminOrAM;

  const checkNewAssignments = useCallback(async () => {
    if (!shouldPoll) return;
    try {
      const res  = await fetch('/api/notifications?unreadOnly=true');
      const data = await res.json();
      if (!res.ok) return;

      const newAssignments = (data.notifications || []).filter(
        (n) => n.type === 'task_assigned' && !seenIdsRef.current.has(n._id)
      );

      if (newAssignments.length > 0) {
        newAssignments.forEach((n) => seenIdsRef.current.add(n._id));
        setToasts((prev) => [
          ...prev,
          ...newAssignments.map((n) => ({ ...n, toastId: n._id + Date.now() })),
        ]);
      }
    } catch {}
  }, [shouldPoll]);

  useEffect(() => {
    if (!shouldPoll) return;
    // Check on mount
    checkNewAssignments();
    // Poll every 30s
    const interval = setInterval(checkNewAssignments, 30000);
    return () => clearInterval(interval);
  }, [checkNewAssignments, shouldPoll]);

  function removeToast(toastId) {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }

  async function markReadAndNavigate(notification) {
    // Mark as read
    try {
      await fetch(`/api/notifications/${notification._id}`, { method: 'PATCH' });
    } catch {}
    // Navigate to the brand tasks page
    if (notification.brandId) {
      router.push(`/brands/${notification.brandId}/tasks`);
    }
  }

  if (!shouldPoll || toasts.length === 0) return null;

  return (
    <div
      style={{
        position:   'fixed',
        bottom:     24,
        right:      24,
        zIndex:     999999,
        display:    'flex',
        flexDirection: 'column',
        gap:        '10px',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.toastId}
          notification={toast}
          onClose={() => removeToast(toast.toastId)}
          onNavigate={markReadAndNavigate}
        />
      ))}
    </div>
  );
}