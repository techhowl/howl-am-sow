// src/app/(dashboard)/brands/[brandId]/tasks/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Plus, SlidersHorizontal, RefreshCw } from 'lucide-react';
import KanbanColumn from '@/components/tasks/KanbanColumn';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { KANBAN_COLUMNS, STATUS_LABELS } from '@/lib/constants/tasks';

const PRIORITY_OPTIONS = ['all', 'high', 'medium', 'low'];

export default function TasksPage() {
  const { data: session } = useSession();
  const { brandId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [brand, setBrand] = useState(null);
  const [brandMembers, setBrandMembers] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showRejected, setShowRejected] = useState(false);

  const canManage = ['admin', 'account_manager'].includes(session?.user?.role);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, brandRes, membersRes, deliverablesRes] = await Promise.all([
        fetch(`/api/brands/${brandId}/tasks`),
        fetch(`/api/brands/${brandId}`),
        fetch(`/api/brands/${brandId}/members`),
        fetch(`/api/brands/${brandId}/deliverables`),
      ]);

      const [tasksData, brandData, membersData, deliverablesData] = await Promise.all([
        tasksRes.json(),
        brandRes.json(),
        membersRes.json(),
        deliverablesRes.json(),
      ]);

      setTasks(tasksData.tasks || []);
      setBrand(brandData.brand || null);
      setBrandMembers(membersData.members || []);
      setDeliverables(deliverablesData.deliverables || []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleTaskCreated(task) {
    setTasks((prev) => [task, ...prev]);
  }

  function handleTaskUpdated(updated) {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }

  function handleTaskDeleted(taskId) {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }

  // Apply filters
  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterAssignee !== 'all') {
      const hasAssignee = t.assignees?.some(
        (a) => (a._id || a) === filterAssignee
      );
      if (!hasAssignee) return false;
    }
    return true;
  });

  // Group tasks by status for Kanban columns
  const tasksByStatus = {};
  KANBAN_COLUMNS.forEach((col) => {
    tasksByStatus[col] = filteredTasks.filter((t) => t.status === col);
  });

  // Rejected tasks shown separately
  const rejectedTasks = filteredTasks.filter((t) => t.status === 'rejected');

  const totalLive = tasks.filter((t) => t.status === 'live').length;
  const totalRejected = tasks.filter((t) => t.status === 'rejected').length;
  const totalOpen = tasks.filter((t) => !['live'].includes(t.status)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {brand?.name ? `${brand.name} — Tasks` : 'Tasks'}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{totalOpen} open</span>
            <span>{totalLive} live</span>
            {totalRejected > 0 && (
              <span className="text-red-500 font-medium">{totalRejected} rejected</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filter:</span>
        </div>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All Assignees</option>
          {brandMembers.map((m) => {
            const id = m.userId?._id || m.userId;
            const name = m.userId?.name || 'Unknown';
            return <option key={id} value={id}>{name}</option>;
          })}
        </select>

        {/* Show rejected toggle */}
        {rejectedTasks.length > 0 && (
          <button
            onClick={() => setShowRejected(!showRejected)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
              showRejected
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Rejected ({rejectedTasks.length})
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Rejected tasks panel (collapsed by default) */}
      {showRejected && rejectedTasks.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-3">
            Rejected — Awaiting Routing ({rejectedTasks.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {rejectedTasks.map((task) => (
              <button
                key={task._id}
                onClick={() => setSelectedTask(task)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 rounded-xl text-sm text-red-800 hover:border-red-400 transition-colors text-left"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="truncate max-w-50">{task.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 overflow-x-auto pb-6">
        <div className="grid grid-cols-3 gap-6 w-full">
          {KANBAN_COLUMNS.map((col) => (
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
          deliverables={deliverables}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          brandMembers={brandMembers}
          deliverables={deliverables}
          currentUserRole={session?.user?.role}
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