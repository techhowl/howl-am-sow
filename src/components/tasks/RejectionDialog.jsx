// src/components/tasks/RejectionDialog.jsx
'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function RejectionDialog({ task, onClose, onRejected }) {
  const [reason, setReason] = useState('');
  const [routeTo, setRouteTo] = useState(
    task.copyRequired !== false ? 'copy_wip' : 'design_wip'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const routeOptions = [];
  if (task.copyRequired !== false) routeOptions.push({ value: 'copy_wip', label: 'Copy WIP' });
  if (task.designRequired !== false) routeOptions.push({ value: 'design_wip', label: 'Design WIP' });
  if (routeOptions.length === 0) {
    routeOptions.push({ value: 'copy_wip', label: 'Copy WIP' });
    routeOptions.push({ value: 'design_wip', label: 'Design WIP' });
  }

  async function handleReject() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',          // ← was newStatus, now status
          routeTo,                     // ← was missing entirely
          rejectionReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject task');
      onRejected(data.task);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Reject Task</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You are rejecting <span className="font-medium text-gray-900">"{task.title}"</span>. This will increment the revision count.
          </p>

          {/* Route back selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route back to *</label>
            <div className="flex flex-col gap-2">
              {routeOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    routeTo === opt.value
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    routeTo === opt.value ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {routeTo === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    value={opt.value}
                    checked={routeTo === opt.value}
                    onChange={() => setRouteTo(opt.value)}
                  />
                  <span className={`text-sm font-medium ${routeTo === opt.value ? 'text-red-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rejection Reason <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Describe what needs to be changed..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}