// src/app/(dashboard)/brands/[brandId]/tasks/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Plus, SlidersHorizontal, RefreshCw, AlertCircle } from 'lucide-react';
import KanbanColumn from '@/components/tasks/KanbanColumn';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { KANBAN_COLUMNS } from '@/lib/constants/tasks';
import { SkeletonKanban } from '@/components/shared/Skeleton';

// Row 1 = production stages (copy → design → video), no internal_review
// Row 2 = client stages
const ROW_1 = ['copy_wip', 'design_wip', 'video_wip'];
const ROW_2 = ['sent_to_client', 'approved', 'rejected', 'live'];

export default function TasksPage() {
  const { data: session } = useSession();
  const { brandId }       = useParams();

  const [tasks, setTasks]               = useState([]);
  const [brand, setBrand]               = useState(null);
  const [brandMembers, setBrandMembers] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask]       = useState(null);

  const [filterPriority, setFilterPriority]   = useState('all');
  const [filterAssignee, setFilterAssignee]   = useState('all');

  const canManage = ['superadmin', 'admin', 'account_manager'].includes(session?.user?.role);

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [tasksRes, brandRes, membersRes] = await Promise.all([
        fetch(`/api/brands/${brandId}/tasks`),
        fetch(`/api/brands/${brandId}`),
        fetch(`/api/brands/${brandId}/members`),
      ]);
      const [tasksData, brandData, membersData] = await Promise.all([
        tasksRes.json(),
        brandRes.json(),
        membersRes.json(),
      ]);
      setTasks(tasksData.tasks || []);
      setBrand(brandData.brand || null);
      setBrandMembers(membersData.members || []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleTaskCreated(task) {
    setTasks((prev) => [task, ...prev]);
  }
  function handleTaskUpdated(updated) {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }
  function handleTaskDeleted(taskId) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterAssignee !== 'all') {
      const has = t.assignees?.some((a) => (a._id || a) === filterAssignee);
      if (!has) return false;
    }
    return true;
  });

  const tasksByStatus = {};
  KANBAN_COLUMNS.forEach((col) => {
    tasksByStatus[col] = filteredTasks.filter((t) => t.status === col);
  });

  const totalOpen     = tasks.filter((t) => t.status !== 'live').length;
  const totalLive     = tasks.filter((t) => t.status === 'live').length;
  const totalRejected = tasks.filter((t) => t.status === 'rejected').length;

  return (
    <div className="flex flex-col min-h-screen p-6 md:p-8 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display italic text-foreground">
            {brand?.name ? `${brand.name} — Tasks` : 'Tasks'}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">{totalOpen} open</span>
            <span className="text-xs text-success font-medium">{totalLive} live</span>
            {totalRejected > 0 && (
              <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                <AlertCircle className="w-3 h-3" />
                {totalRejected} rejected
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card border border-border transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          Filter:
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-border bg-card rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="border border-border bg-card rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Assignees</option>
          {brandMembers.map((m) => {
            const id   = m.userId?._id || m.userId;
            const name = m.userId?.name || 'Unknown';
            return <option key={id} value={id}>{name}</option>;
          })}
        </select>
        {(filterPriority !== 'all' || filterAssignee !== 'all') && (
          <button
            onClick={() => { setFilterPriority('all'); setFilterAssignee('all'); }}
            className="text-xs text-primary hover:text-primary/80 underline transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Kanban: 3 (production) + 4 (client) two-row layout */}
      {loading ? (
        <SkeletonKanban columns={5} cards={3} className="flex-1" />
      ) : (
        <div className="flex flex-col gap-6 flex-1">
          <div className="grid grid-cols-3 gap-4">
            {ROW_1.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                tasks={tasksByStatus[col] || []}
                onTaskClick={(task) => setSelectedTask(task)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2">
              Client Stage
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {ROW_2.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                tasks={tasksByStatus[col] || []}
                onTaskClick={(task) => setSelectedTask(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          brandId={brandId}
          brandMembers={brandMembers}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          brandMembers={brandMembers}
          currentUserRole={session?.user?.role}
          currentUserId={session?.user?.id}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            handleTaskUpdated(updated);
            setSelectedTask(updated);
          }}
          onDeleted={(id) => {
            handleTaskDeleted(id);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}