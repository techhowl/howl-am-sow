// src/components/layout/NotificationBell.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_LABELS = {
  task_assigned: 'assigned you to a task',
  status_changed: 'moved a task',
  task_rejected: 'rejected a task',
  task_approved: 'approved a task',
  task_live: 'marked a task as live',
  mentioned: 'mentioned you in a comment',
  comment_added: 'commented on a task',
  brand_added: 'added you to a brand',
};

const TYPE_COLORS = {
  task_assigned: 'bg-indigo-100 text-indigo-600',
  status_changed: 'bg-blue-100 text-blue-600',
  task_rejected: 'bg-red-100 text-red-600',
  task_approved: 'bg-green-100 text-green-600',
  task_live: 'bg-emerald-100 text-emerald-600',
  mentioned: 'bg-purple-100 text-purple-600',
  comment_added: 'bg-gray-100 text-gray-600',
  brand_added: 'bg-amber-100 text-amber-600',
};

function NotificationItem({ notification, onRead, onNavigate }) {
  const isUnread = !notification.isRead;

  async function handleClick() {
    if (isUnread) await onRead(notification._id);
    if (notification.entityType === 'task' && notification.entityId && notification.brandId) {
      onNavigate(`/brands/${notification.brandId}/tasks`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
        isUnread ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Unread dot */}
      <div className="shrink-0 mt-1.5">
        {isUnread ? (
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Type badge */}
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
          TYPE_COLORS[notification.type] || 'bg-gray-100 text-gray-500'
        }`}
      >
        {notification.type?.replace(/_/g, ' ')}
      </span>
    </div>
  );
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
    if (!silent) setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchNotifications(true); // silent — no loading spinner
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function markRead(id) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function handleNavigate(href) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute -left-48 top-full mt-2 w-80 bg-slate-100 border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-medium bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2 text-gray-200" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onRead={markRead}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Showing last {notifications.length} notifications · Auto-refreshes every 30s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}