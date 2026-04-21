'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRight,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  XCircle,
  Zap,
  PenLine,
  Clock,
} from 'lucide-react';

const ACTION_CONFIG = {
  status_changed: {
    icon: ArrowRight,
    color: 'bg-blue-100 text-blue-600',
    label: (meta) => `moved to ${meta?.newStatus?.replace(/_/g, ' ')}`,
  },
  comment_added: {
    icon: MessageSquare,
    color: 'bg-gray-100 text-gray-600',
    label: () => 'added a comment',
  },
  task_created: {
    icon: PenLine,
    color: 'bg-indigo-100 text-indigo-600',
    label: () => 'created this task',
  },
  task_assigned: {
    icon: UserPlus,
    color: 'bg-purple-100 text-purple-600',
    label: () => 'was assigned',
  },
  task_rejected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-600',
    label: (meta) => `rejected — routed to ${meta?.routedTo?.replace(/_/g, ' ') || 'review'}`,
  },
  task_approved: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-600',
    label: () => 'approved this task',
  },
  task_live: {
    icon: Zap,
    color: 'bg-emerald-100 text-emerald-600',
    label: () => 'marked as live',
  },
  task_edited: {
    icon: PenLine,
    color: 'bg-amber-100 text-amber-600',
    label: () => 'edited this task',
  },
};

export default function ActivityFeed({ taskId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}/activity`);
        const data = await res.json();
        setLogs(data.logs || []);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const config = ACTION_CONFIG[log.action] || {
          icon: Clock,
          color: 'bg-gray-100 text-gray-500',
          label: () => log.action,
        };
        const Icon = config.icon;
        const actor = log.performedBy;
        const actorName = actor?.name || 'Someone';

        return (
          <div key={log._id} className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-snug">
                <span className="font-medium">{actorName}</span>{' '}
                {config.label(log.metadata)}
              </p>
              {log.metadata?.preview && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  "{log.metadata.preview}"
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}