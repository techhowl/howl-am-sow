// src/components/tasks/TaskDetailModal.jsx
'use client';

import { useState } from 'react';
import { X, ChevronRight, Trash2, Edit2, Check, RotateCcw, Link2 } from 'lucide-react';
import PriorityBadge from '@/components/shared/PriorityBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';
import RejectionDialog from '@/components/tasks/RejectionDialog';
import RouteRejectionDialog from '@/components/tasks/RouteRejectionDialog';
import CommentThread from '@/components/tasks/CommentThread';
import ActivityFeed from '@/components/tasks/ActivityFeed';
import { STATUS_LABELS, VALID_TRANSITIONS } from '@/lib/constants/tasks';
import { format } from 'date-fns';

const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'comments', label: 'Comments' },
  { key: 'activity', label: 'Activity' },
];

export default function TaskDetailModal({
  task: initialTask,
  brandMembers = [],
  deliverables = [],
  currentUserRole,
  currentUserId,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState('details');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: initialTask.title,
    description: initialTask.description || '',
    priority: initialTask.priority,
    internalDeadline: initialTask.internalDeadline
      ? format(new Date(initialTask.internalDeadline), 'yyyy-MM-dd')
      : '',
    externalDeadline: initialTask.externalDeadline
      ? format(new Date(initialTask.externalDeadline), 'yyyy-MM-dd')
      : '',
    assignees: initialTask.assignees?.map((a) => a._id || a) || [],
    deliverableId: initialTask.deliverableId?._id || initialTask.deliverableId || '',
  });
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  const canManage = ['admin', 'account_manager'].includes(currentUserRole);
  const isLive = task.status === 'live';
  const validNext = VALID_TRANSITIONS[task.status] || [];

  function toggleEditAssignee(id) {
    setEditForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(id)
        ? prev.assignees.filter((a) => a !== id)
        : [...prev.assignees, id],
    }));
  }

  async function saveEdits() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          internalDeadline: editForm.internalDeadline || null,
          externalDeadline: editForm.externalDeadline || null,
          deliverableId: editForm.deliverableId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setTask(data.task);
      setEditing(false);
      onUpdated(data.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(newStatus) {
    if (newStatus === 'rejected') {
      setShowRejectDialog(true);
      return;
    }
    setTransitioning(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to move status');
      setTask(data.task);
      onUpdated(data.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setTransitioning(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onDeleted(task._id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  const statusBg = {
    copy_wip: 'bg-purple-100 text-purple-700',
    design_wip: 'bg-blue-100 text-blue-700',
    internal_review: 'bg-amber-100 text-amber-700',
    sent_to_client: 'bg-cyan-100 text-cyan-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    live: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              {editing ? (
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full text-base font-semibold border-b border-indigo-300 focus:outline-none pb-1"
                />
              ) : (
                <h2 className="text-base font-semibold text-gray-900 leading-snug">{task.title}</h2>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
                <PriorityBadge priority={task.priority} size="xs" />
                {task.revisionCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                    <RotateCcw className="w-3 h-3" />
                    {task.revisionCount} revision{task.revisionCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canManage && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title={editing ? 'Cancel edit' : 'Edit task'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── TAB BAR ────────────────────────────────────────────────── */}
          <div className="flex border-b border-gray-100 px-6 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {task.description || (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Priority
                    </label>
                    {editing ? (
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                        ))}
                      </select>
                    ) : (
                      <PriorityBadge priority={task.priority} />
                    )}
                  </div>

                  {/* Deliverable */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Deliverable
                    </label>
                    {editing ? (
                      <select
                        value={editForm.deliverableId}
                        onChange={(e) => setEditForm({ ...editForm, deliverableId: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">None</option>
                        {deliverables.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    ) : task.deliverableId ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        {task.deliverableId.name}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">None</span>
                    )}
                  </div>

                  {/* Internal deadline */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Internal Deadline
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={editForm.internalDeadline}
                        onChange={(e) => setEditForm({ ...editForm, internalDeadline: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <DeadlineBadge date={task.internalDeadline} closed={isLive} />
                    )}
                  </div>

                  {/* External deadline */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      External Deadline
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={editForm.externalDeadline}
                        onChange={(e) => setEditForm({ ...editForm, externalDeadline: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <DeadlineBadge date={task.externalDeadline} closed={isLive} />
                    )}
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Assignees
                  </label>
                  {editing ? (
                    <div className="flex flex-wrap gap-2">
                      {brandMembers.map((member) => {
                        const id = member.userId?._id || member.userId;
                        const name = member.userId?.name || 'Unknown';
                        const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                        const selected = editForm.assignees.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleEditAssignee(id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${selected
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {initials}
                            </span>
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  ) : task.assignees?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((user) => {
                        const name = user.name || '';
                        const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <div
                            key={user._id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center">
                              {initials}
                            </span>
                            <span className="text-sm text-gray-700">{name}</span>
                            <span className="text-xs text-gray-400">{user.role?.replace(/_/g, ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No assignees</span>
                  )}
                </div>

                {/* Edit save/cancel */}
                {editing && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdits}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* Status Transitions */}
                {!editing && !isLive && validNext.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Move Task
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {validNext.map((next) => {
                        const isReject = next === 'rejected';
                        const needsAM = isReject || task.status === 'rejected';
                        if (needsAM && !canManage) return null;
                        return (
                          <button
                            key={next}
                            onClick={() => handleTransition(next)}
                            disabled={transitioning}
                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-60 ${isReject
                                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                            {STATUS_LABELS[next]}
                          </button>
                        );
                      })}

                      {/* Route out of rejected */}
                      {task.status === 'rejected' && canManage && (
                        <button
                          onClick={() => setShowRouteDialog(true)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                          Route for Revision
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isLive && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    <Check className="w-4 h-4" />
                    This task is live and closed.
                    {task.closedAt && (
                      <span className="text-emerald-600 ml-1">
                        Completed {format(new Date(task.closedAt), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
              <div className="p-6 flex flex-col" style={{ minHeight: '400px' }}>
                <CommentThread
                  taskId={task._id}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  brandMembers={brandMembers}
                />
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div className="p-6">
                <ActivityFeed taskId={task._id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete{' '}
              <span className="font-medium">"{task.title}"</span>. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <RejectionDialog
          task={task}
          onClose={() => setShowRejectDialog(false)}
          onRejected={(updated) => {
            setTask(updated);
            onUpdated(updated);
            setShowRejectDialog(false);
          }}
        />
      )}

      {showRouteDialog && (
        <RouteRejectionDialog
          task={task}
          onClose={() => setShowRouteDialog(false)}
          onRouted={(updated) => {
            setTask(updated);
            onUpdated(updated);
            setShowRouteDialog(false);
          }}
        />
      )}
    </>
  );
}