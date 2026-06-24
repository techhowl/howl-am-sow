// src/components/tasks/CreateTaskModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

const PRIORITIES     = ['high', 'medium', 'low'];
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

const FIXED_TASK_TYPES = [
  'Static', 'Static Adapt', 'Video', 'Video Adapt',
  'Reel', 'Carousel', 'GIF', 'Story', 'Performance Asset', 'Other',
];

// Order matches the workflow: Copy → Design → Video
const WORKFLOW_FLAGS = [
  { key: 'copyRequired',   label: 'Copy'   },
  { key: 'designRequired', label: 'Design' },
  { key: 'videoRequired',  label: 'Video'  },
];

export default function CreateTaskModal({ brandId, brandMembers = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    title:            '',
    description:      '',
    type:             '',
    priority:         'medium',
    assignees:        [],
    copyRequired:     true,
    videoRequired:    false,
    designRequired:   true,
    internalDeadline: '',
    externalDeadline: '',
  });
  const [taskTypes, setTaskTypes] = useState(FIXED_TASK_TYPES);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [mounted, setMounted]     = useState(false);

  useEffect(() => { setMounted(true) }, []);

  // Load SOW types for this brand (current month) to populate dropdown
  useEffect(() => {
    if (!brandId) return;
    const month = new Date().toISOString().slice(0, 7);
    fetch(`/api/brands/${brandId}/sow?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        const sowTypes = (data.sow?.items || data.baseline || []).map((i) => i.type);
        if (sowTypes.length > 0) {
          const merged = [...new Set([...sowTypes, ...FIXED_TASK_TYPES])];
          setTaskTypes(merged);
          setForm((f) => ({ ...f, type: sowTypes[0] }));
        } else {
          setForm((f) => ({ ...f, type: FIXED_TASK_TYPES[0] }));
        }
      })
      .catch(() => {
        setForm((f) => ({ ...f, type: FIXED_TASK_TYPES[0] }));
      });
  }, [brandId]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function toggleAssignee(userId) {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId],
    }));
  }

  // New order: copy → design → video → sent to client
  function getInitialStatus() {
    if (form.copyRequired)   return 'Copy WIP';
    if (form.designRequired) return 'Design WIP';
    if (form.videoRequired)  return 'Video WIP';
    return 'Sent to Client';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.type)         { setError('Content type is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/brands/${brandId}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          internalDeadline: form.internalDeadline || null,
          externalDeadline: form.externalDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');
      onCreated(data.task); onClose();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (!mounted) return null;

  return createPortal(
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 25px 80px rgba(0,0,0,0.15)', width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Create Task</h2>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          ><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Title */}
            <div>
              <label style={lbl}>Title *</label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Summer Campaign Video" style={inp}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ring)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in oklch, var(--ring) 30%, transparent)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Type + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Content Type *</label>
                <select value={form.type} onChange={(e) => set('type', e.target.value)} style={inp} required>
                  <option value="" disabled>Select type...</option>
                  {taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select value={form.priority} onChange={(e) => set('priority', e.target.value)} style={inp}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={lbl}>Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                rows={2} placeholder="Brief task description..." style={{ ...inp, resize: 'none', fontFamily: 'inherit' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ring)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in oklch, var(--ring) 30%, transparent)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Workflow flags */}
            <div>
              <label style={lbl}>Workflow Stages</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WORKFLOW_FLAGS.map(({ key, label }) => {
                  const isActive = form[key];
                  const colors = {
                    copyRequired:   { bg: 'color-mix(in oklch, var(--chart-4) 12%, transparent)', border: 'color-mix(in oklch, var(--chart-4) 40%, transparent)', text: 'var(--chart-4)' },
                    designRequired: { bg: 'color-mix(in oklch, var(--chart-2) 12%, transparent)', border: 'color-mix(in oklch, var(--chart-2) 40%, transparent)', text: 'var(--chart-2)' },
                    videoRequired:  { bg: 'color-mix(in oklch, var(--chart-5) 12%, transparent)', border: 'color-mix(in oklch, var(--chart-5) 40%, transparent)', text: 'var(--chart-5)' },
                  }[key];
                  return (
                    <button key={key} type="button" onClick={() => set(key, !isActive)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease', border: `1px solid ${isActive ? colors.border : 'var(--border)'}`, background: isActive ? colors.bg : 'var(--card)', color: isActive ? colors.text : 'var(--muted-foreground)' }}
                    >
                      {isActive && <Check size={13} />}{label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6 }}>
                Task starts at: <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{getInitialStatus()}</span>
              </p>
            </div>

            {/* Deadlines */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Internal Deadline</label>
                <input type="date" value={form.internalDeadline} onChange={(e) => set('internalDeadline', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>External Deadline</label>
                <input type="date" value={form.externalDeadline} onChange={(e) => set('externalDeadline', e.target.value)} style={inp} />
              </div>
            </div>

            {/* Assignees */}
            {brandMembers.length > 0 && (
              <div>
                <label style={lbl}>Assignees</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {brandMembers.map((member) => {
                    const id       = member.userId?._id || member.userId;
                    const name     = member.userId?.name || 'Unknown';
                    const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                    const selected = form.assignees.includes(id);
                    return (
                      <button key={id} type="button" onClick={() => toggleAssignee(id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease', border: `1px solid ${selected ? 'color-mix(in oklch, var(--primary) 40%, transparent)' : 'var(--border)'}`, background: selected ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'var(--card)', color: selected ? 'var(--primary)' : 'var(--foreground)' }}
                      >
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? 'var(--primary)' : 'var(--muted)', color: selected ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {initials}
                        </span>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: 13, color: 'var(--destructive)', background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', background: 'var(--muted)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
            >Cancel</button>
            <button type="submit" disabled={loading}
              style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, color: 'var(--primary-foreground)', background: 'var(--primary)', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 90%, black)' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'var(--primary)' }}
            >{loading ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: 'inherit' };
const inp = { width: '100%', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)', fontSize: 13, padding: '8px 12px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };