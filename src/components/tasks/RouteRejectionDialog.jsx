// src/components/tasks/RouteRejectionDialog.jsx
'use client';

import { useState } from 'react';
import { X, GitBranch } from 'lucide-react';

const ROUTE_OPTIONS = [
  {
    value: 'copy_wip',
    label: 'Copy WIP',
    description: 'Send back to copywriters to rework the copy first',
  },
  {
    value: 'design_wip',
    label: 'Design WIP',
    description: 'Copy is fine — send directly to design for rework',
  },
];

export default function RouteRejectionDialog({ task, onClose, onRouted }) {
  const [routeBackTo, setRouteBackTo] = useState('copy_wip');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRoute() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: routeBackTo, routeBackTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to route task');
      onRouted(data.task);
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
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Route Rejected Task</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Where should <span className="font-medium text-gray-900">"{task.title}"</span> go for revision?
          </p>

          <div className="space-y-2">
            {ROUTE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  routeBackTo === opt.value
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="routeBackTo"
                  value={opt.value}
                  checked={routeBackTo === opt.value}
                  onChange={() => setRouteBackTo(opt.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
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
              onClick={handleRoute}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Routing...' : 'Route Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}