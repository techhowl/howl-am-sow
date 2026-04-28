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

const ROW_1 = ['copy_wip', 'video_wip', 'design_wip', 'internal_review'];
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

  const canManage = ['admin', 'account_manager'].includes(session?.user?.role);

  const fetchData = useCallback(async () => {
    setError('');
    try {
      // No more deliverables fetch
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 md:p-8 bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {brand?.name ? `${brand.name} — Tasks` : 'Tasks'}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-500">{totalOpen} open</span>
            <span className="text-xs text-emerald-600 font-medium">{totalLive} live</span>
            {totalRejected > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertCircle className="w-3 h-3" />
                {totalRejected} rejected
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white border border-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <SlidersHorizontal className="w-4 h-4" />
          Filter:
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
            className="text-xs text-indigo-600 hover:text-indigo-800 underline transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Kanban: 4+4 two-row layout */}
      <div className="flex flex-col gap-6 flex-1">
        <div className="grid grid-cols-4 gap-4">
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
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2">
            Client Stage
          </span>
          <div className="flex-1 h-px bg-gray-200" />
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