// src/components/tasks/CreateTaskModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

export default function CreateTaskModal({ brandId, brandMembers = [], deliverables = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deliverableId: '',
    priority: 'medium',
    assignees: [],
    copyRequired: true,
    designRequired: true,
    internalDeadline: '',
    externalDeadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleAssignee(userId) {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/brands/${brandId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          internalDeadline: form.internalDeadline || null,
          externalDeadline: form.externalDeadline || null,
          deliverableId: form.deliverableId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');
      onCreated(data.task);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Create Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Design landing banner v1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief task description..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Priority + Deliverable */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deliverable</label>
              <select
                value={form.deliverableId}
                onChange={(e) => setForm({ ...form, deliverableId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">None</option>
                {deliverables.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skip flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.copyRequired}
                onChange={(e) => setForm({ ...form, copyRequired: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-100"
              />
              Copy Required
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.designRequired}
                onChange={(e) => setForm({ ...form, designRequired: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-100"
              />
              Design Required
            </label>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Internal Deadline</label>
              <input
                type="date"
                value={form.internalDeadline}
                onChange={(e) => setForm({ ...form, internalDeadline: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">External Deadline</label>
              <input
                type="date"
                value={form.externalDeadline}
                onChange={(e) => setForm({ ...form, externalDeadline: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Assignees */}
          {brandMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {brandMembers.map((member) => {
                  const selected = form.assignees.includes(member.userId?._id || member.userId);
                  const id = member.userId?._id || member.userId;
                  const name = member.userId?.name || 'Unknown';
                  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAssignee(id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {initials}
                      </span>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}