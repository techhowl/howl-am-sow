// src/components/tasks/RejectionDialog.jsx
'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Portal from '@/components/shared/Portal';

export default function RejectionDialog({ task, onClose, onRejected }) {
  const options = [];
  if (task.copyRequired  !== false) options.push({ value: 'copy_wip',  label: 'Copy WIP' });
  if (task.videoRequired)           options.push({ value: 'video_wip', label: 'Video WIP' });
  if (task.designRequired !== false) options.push({ value: 'design_wip', label: 'Design WIP' });
  if (options.length === 0) options.push({ value: 'copy_wip', label: 'Copy WIP' });

  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleReject() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:          'rejected',
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
    <Portal>
      <div
        style={{
          position:        'fixed',
          inset:           0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter:  'blur(4px)',
          zIndex:          100001,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         '16px',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            background:    'var(--card)',
            borderRadius:  '16px',
            border:        '1px solid var(--border)',
            boxShadow:     '0 25px 80px rgba(0, 0, 0, 0.18)',
            width:         '100%',
            maxWidth:      '400px',
            overflow:      'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={16} color="var(--destructive)" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Reject Task</p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', fontSize: 12, color: 'var(--destructive)', lineHeight: 1.5 }}>
              This will increment the revision count. The task will stay in the <strong>Rejected</strong> column until you route it back for revision.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reason <span style={{ color: 'var(--muted-foreground)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What needs to be changed?"
                rows={3}
                style={{
                  width: '100%', background: 'var(--input)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--foreground)', fontSize: 13, padding: '8px 12px',
                  fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none', outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in oklch, var(--ring) 30%, transparent)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'var(--destructive)', background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', borderRadius: 8, padding: '8px 12px', margin: 0 }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', background: 'var(--muted)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              style={{ padding: '8px 18px', fontSize: 13, fontWeight: 500, color: 'var(--destructive-foreground)', background: 'var(--destructive)', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}