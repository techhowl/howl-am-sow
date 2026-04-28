// src/components/tasks/CreateTaskModal.jsx
'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import Portal from '@/components/shared/Portal';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

const WORKFLOW_FLAGS = [
  { key: 'copyRequired',   label: 'Copy',   activeClass: 'bg-purple-50 border-purple-300 text-purple-700' },
  { key: 'videoRequired',  label: 'Video',  activeClass: 'bg-violet-50 border-violet-300 text-violet-700' },
  { key: 'designRequired', label: 'Design', activeClass: 'bg-blue-50 border-blue-300 text-blue-700' },
];

export default function CreateTaskModal({ brandId, brandMembers = [], deliverables = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    title:            '',
    description:      '',
    deliverableId:    '',
    priority:         'medium',
    assignees:        [],
    copyRequired:     true,
    videoRequired:    false,
    designRequired:   true,
    internalDeadline: '',
    externalDeadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function toggleAssignee(userId) {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId],
    }));
  }

  function getInitialStatus() {
    if (form.copyRequired)   return 'Copy WIP';
    if (form.videoRequired)  return 'Video WIP';
    if (form.designRequired) return 'Design WIP';
    return 'Internal Review';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/brands/${brandId}/tasks`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          internalDeadline: form.internalDeadline || null,
          externalDeadline: form.externalDeadline || null,
          deliverableId:    form.deliverableId    || null,
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
    <Portal>
      {/* Backdrop — rendered directly on body, nothing can clip it */}
      <div
        style={{
          position:        'fixed',
          inset:           0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter:  'blur(4px)',
          zIndex:          99999,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         '16px',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal */}
        <div
          style={{
            background:   '#ffffff',
            borderRadius: '16px',
            border:       '1px solid #e5e7eb',
            boxShadow:    '0 25px 80px rgba(0, 0, 0, 0.18)',
            width:        '100%',
            maxWidth:     '520px',
            maxHeight:    '90vh',
            display:      'flex',
            flexDirection:'column',
            overflow:     'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '20px 24px',
            borderBottom:   '1px solid #f3f4f6',
            flexShrink:     0,
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Create Task
            </h2>
            <button
              onClick={onClose}
              style={{
                padding:         '6px',
                borderRadius:    '8px',
                border:          'none',
                background:      'transparent',
                cursor:          'pointer',
                color:           '#9ca3af',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body — scrollable */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Design landing banner v1"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={(e) =>  { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={2}
                  placeholder="Brief task description..."
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={(e) =>  { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Priority + Deliverable */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => set('priority', e.target.value)}
                    style={inputStyle}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Link to Deliverable</label>
                  <select
                    value={form.deliverableId}
                    onChange={(e) => set('deliverableId', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    {deliverables.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Workflow flags */}
              <div>
                <label style={labelStyle}>Workflow Stages</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {WORKFLOW_FLAGS.map(({ key, label }) => {
                    const active = form[key];
                    const colors = {
                      copyRequired:   { bg: '#faf5ff', border: '#c4b5fd', text: '#6d28d9' },
                      videoRequired:  { bg: '#f5f3ff', border: '#a78bfa', text: '#7c3aed' },
                      designRequired: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
                    };
                    const c = colors[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set(key, !active)}
                        style={{
                          display:      'inline-flex',
                          alignItems:   'center',
                          gap:          '6px',
                          padding:      '7px 14px',
                          borderRadius: '8px',
                          border:       `1px solid ${active ? c.border : '#e5e7eb'}`,
                          background:   active ? c.bg : '#ffffff',
                          color:        active ? c.text : '#9ca3af',
                          fontSize:     '13px',
                          fontWeight:   500,
                          cursor:       'pointer',
                          fontFamily:   'inherit',
                          transition:   'all 0.15s ease',
                        }}
                      >
                        {active && <Check size={13} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                  Task starts at:{' '}
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>{getInitialStatus()}</span>
                </p>
              </div>

              {/* Deadlines */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Internal Deadline</label>
                  <input
                    type="date"
                    value={form.internalDeadline}
                    onChange={(e) => set('internalDeadline', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>External Deadline</label>
                  <input
                    type="date"
                    value={form.externalDeadline}
                    onChange={(e) => set('externalDeadline', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Assignees */}
              {brandMembers.length > 0 && (
                <div>
                  <label style={labelStyle}>Assignees</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {brandMembers.map((member) => {
                      const id       = member.userId?._id || member.userId;
                      const name     = member.userId?.name || 'Unknown';
                      const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                      const selected = form.assignees.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleAssignee(id)}
                          style={{
                            display:      'inline-flex',
                            alignItems:   'center',
                            gap:          '8px',
                            padding:      '6px 12px',
                            borderRadius: '8px',
                            border:       `1px solid ${selected ? '#a5b4fc' : '#e5e7eb'}`,
                            background:   selected ? '#eef2ff' : '#ffffff',
                            color:        selected ? '#4338ca' : '#374151',
                            fontSize:     '13px',
                            fontWeight:   500,
                            cursor:       'pointer',
                            fontFamily:   'inherit',
                            transition:   'all 0.15s ease',
                          }}
                        >
                          <span style={{
                            width:          '24px',
                            height:         '24px',
                            borderRadius:   '50%',
                            background:     selected ? '#4f46e5' : '#f3f4f6',
                            color:          selected ? '#ffffff' : '#6b7280',
                            fontSize:       '10px',
                            fontWeight:     700,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            flexShrink:     0,
                          }}>
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
                <p style={{
                  fontSize:     '13px',
                  color:        '#dc2626',
                  background:   '#fef2f2',
                  border:       '1px solid #fecaca',
                  borderRadius: '8px',
                  padding:      '10px 14px',
                  margin:       0,
                }}>
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display:        'flex',
              justifyContent: 'flex-end',
              gap:            '10px',
              padding:        '16px 24px',
              borderTop:      '1px solid #f3f4f6',
              flexShrink:     0,
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding:      '8px 16px',
                  fontSize:     '13px',
                  fontWeight:   500,
                  color:        '#374151',
                  background:   '#f3f4f6',
                  border:       'none',
                  borderRadius: '8px',
                  cursor:       'pointer',
                  fontFamily:   'inherit',
                  transition:   'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding:      '8px 20px',
                  fontSize:     '13px',
                  fontWeight:   500,
                  color:        '#ffffff',
                  background:   loading ? '#a5b4fc' : '#4f46e5',
                  border:       'none',
                  borderRadius: '8px',
                  cursor:       loading ? 'not-allowed' : 'pointer',
                  fontFamily:   'inherit',
                  transition:   'background 0.15s ease',
                  opacity:      loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4338ca'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#4f46e5'; }}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// Shared inline styles
const labelStyle = {
  display:       'block',
  fontSize:      '12px',
  fontWeight:    600,
  color:         '#6b7280',
  marginBottom:  '6px',
  fontFamily:    'inherit',
};

const inputStyle = {
  width:        '100%',
  background:   '#ffffff',
  border:       '1px solid #e5e7eb',
  borderRadius: '8px',
  color:        '#111827',
  fontSize:     '13px',
  padding:      '8px 12px',
  fontFamily:   'inherit',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s ease, box-shadow 0.15s ease',
  outline:      'none',
};