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
import { SkeletonList } from '@/components/shared/Skeleton';

const ACTION_CONFIG = {
  status_changed: {
    icon: ArrowRight,
    color: 'bg-primary/10 text-primary',
    label: (meta) => `moved to ${meta?.newStatus?.replace(/_/g, ' ')}`,
  },
  comment_added: {
    icon: MessageSquare,
    color: 'bg-muted text-muted-foreground',
    label: () => 'added a comment',
  },
  task_created: {
    icon: PenLine,
    color: 'bg-primary/10 text-primary',
    label: () => 'created this task',
  },
  task_assigned: {
    icon: UserPlus,
    color: 'bg-primary/10 text-primary',
    label: () => 'was assigned',
  },
  task_rejected: {
    icon: XCircle,
    color: 'bg-destructive/10 text-destructive',
    label: (meta) => `rejected — routed to ${meta?.routedTo?.replace(/_/g, ' ') || 'review'}`,
  },
  task_approved: {
    icon: CheckCircle2,
    color: 'bg-success/10 text-success',
    label: () => 'approved this task',
  },
  task_live: {
    icon: Zap,
    color: 'bg-success/10 text-success',
    label: () => 'marked as live',
  },
  task_edited: {
    icon: PenLine,
    color: 'bg-warning/10 text-warning',
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
    return <SkeletonList rows={4} />;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const config = ACTION_CONFIG[log.action] || {
          icon: Clock,
          color: 'bg-muted text-muted-foreground',
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
              <p className="text-sm text-foreground leading-snug">
                <span className="font-medium">{actorName}</span>{' '}
                {config.label(log.metadata)}
              </p>
              {log.metadata?.preview && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  "{log.metadata.preview}"
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}