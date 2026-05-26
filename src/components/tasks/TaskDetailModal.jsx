// src/components/tasks/TaskDetailModal.jsx
'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Trash2, Edit2, Check, RotateCcw, Calendar } from 'lucide-react';
import Portal from '@/components/shared/Portal';
import PriorityBadge from '@/components/shared/PriorityBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';
import RejectionDialog from '@/components/tasks/RejectionDialog';
import CommentThread from '@/components/tasks/CommentThread';
import ActivityFeed from '@/components/tasks/ActivityFeed';
import { format } from 'date-fns';

// Workflow order: copy → design → video → sent_to_client → approved → live
// Stages can skip ahead when not required (no-video task: design_wip → sent_to_client)
const VALID_TRANSITIONS = {
  copy_wip:       ['design_wip', 'video_wip', 'sent_to_client'],
  design_wip:     ['video_wip', 'sent_to_client'],
  video_wip:      ['sent_to_client'],
  sent_to_client: ['approved', 'rejected'],
  approved:       ['live'],
  rejected:       [],
  live:           [],
};

const BACKWARD_TRANSITIONS = {
  design_wip:     'copy_wip',
  video_wip:      'design_wip',
  sent_to_client: 'video_wip',
  approved:       'sent_to_client',
};

const STATUS_LABELS = {
  copy_wip:       'Copy WIP',
  design_wip:     'Design WIP',
  video_wip:      'Video WIP',
  sent_to_client: 'Sent to Client',
  approved:       'Approved',
  rejected:       'Rejected',
  live:           'Live',
};

const STATUS_COLORS = {
  copy_wip:       { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  design_wip:     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  video_wip:      { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  sent_to_client: { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  approved:       { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  rejected:       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  live:           { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' },
};

const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const PRIORITY_LABELS  = { high: 'High', medium: 'Medium', low: 'Low' };

const TABS = [
  { key: 'details',  label: 'Details'  },
  { key: 'comments', label: 'Comments' },
  { key: 'activity', label: 'Activity' },
];

// ── Live date dialog ───────────────────────────────────────────────────────
function LiveDateDialog({ onConfirm, onCancel, loading }) {
  const [liveDate, setLiveDate] = useState('');
  return (
    <Portal>
      <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
        <div style={{ ...modalBoxStyle, maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="#15803d" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Set Live Date</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>When will this go live?</p>
              </div>
            </div>
            <button onClick={onCancel} style={iconBtnStyle}><X size={16} /></button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <label style={labelStyle}>Live Date <span style={{ color: '#9ca3af', fontWeight: 400 }}>(leave blank for today)</span></label>
            <input type="date" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={modalFooterStyle}>
            <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
            <button
              onClick={() => onConfirm(liveDate || null)}
              disabled={loading}
              style={{ ...submitBtnStyle, background: '#059669' }}
            >
              {loading ? 'Going live...' : 'Mark as Live'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Route from rejected dialog ─────────────────────────────────────────────
function RouteFromRejectedDialog({ task, onConfirm, onClose, loading }) {
  // Options follow workflow order: copy → design → video
  const options = [];
  if (task.copyRequired   !== false) options.push({ value: 'copy_wip',   label: 'Copy WIP' });
  if (task.designRequired !== false) options.push({ value: 'design_wip', label: 'Design WIP' });
  if (task.videoRequired)            options.push({ value: 'video_wip',  label: 'Video WIP' });
  if (options.length === 0) options.push({ value: 'copy_wip', label: 'Copy WIP' });

  const [routeTo, setRouteTo] = useState(options[0].value);

  return (
    <Portal>
      <div style={{ ...backdropStyle, zIndex: 100001 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ ...modalBoxStyle, maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeaderStyle}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Route for Revision</p>
            <button onClick={onClose} style={iconBtnStyle}><X size={16} /></button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Route back to</label>
            {options.map((opt) => (
              <label
                key={opt.value}
                onClick={() => setRouteTo(opt.value)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '12px',
                  padding:      '12px',
                  borderRadius: '10px',
                  border:       `1px solid ${routeTo === opt.value ? '#c4b5fd' : '#e5e7eb'}`,
                  background:   routeTo === opt.value ? '#faf5ff' : '#ffffff',
                  cursor:       'pointer',
                  transition:   'all 0.15s ease',
                }}
              >
                <div style={{
                  width:        16, height: 16,
                  borderRadius: '50%',
                  border:       `2px solid ${routeTo === opt.value ? '#7c3aed' : '#d1d5db'}`,
                  background:   routeTo === opt.value ? '#7c3aed' : 'transparent',
                  display:      'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink:   0,
                }}>
                  {routeTo === opt.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: routeTo === opt.value ? '#6d28d9' : '#374151' }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
          <div style={modalFooterStyle}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button onClick={() => onConfirm(routeTo)} disabled={loading} style={submitBtnStyle}>
              {loading ? 'Routing...' : 'Route for Revision'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────
export default function TaskDetailModal({
  task: initialTask,
  brandMembers = [],
  currentUserRole,
  currentUserId,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [task, setTask]               = useState(initialTask);
  const [activeTab, setActiveTab]     = useState('details');
  const [editing, setEditing]         = useState(false);
  const [editForm, setEditForm]       = useState({
    title:            initialTask.title,
    description:      initialTask.description || '',
    priority:         initialTask.priority,
    internalDeadline: initialTask.internalDeadline ? format(new Date(initialTask.internalDeadline), 'yyyy-MM-dd') : '',
    externalDeadline: initialTask.externalDeadline ? format(new Date(initialTask.externalDeadline), 'yyyy-MM-dd') : '',
    assignees:        initialTask.assignees?.map((a) => a._id || a) || [],
  });
  const [saving, setSaving]                     = useState(false);
  const [transitioning, setTransitioning]       = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showLiveDateDialog, setShowLiveDateDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog]   = useState(false);
  const [deleteConfirm, setDeleteConfirm]       = useState(false);
  const [selectedStatus, setSelectedStatus]     = useState('');
  const [error, setError]                       = useState('');

  const canManage  = ['admin', 'account_manager'].includes(currentUserRole);
  const isLive     = task.status === 'live';
  const isRejected = task.status === 'rejected';

  const forwardOptions = VALID_TRANSITIONS[task.status] || [];
  const backwardTarget = BACKWARD_TRANSITIONS[task.status] || null;
  const dropdownOptions = forwardOptions.filter((s) => s !== 'rejected');
  const statusStyle     = STATUS_COLORS[task.status] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };

  function toggleAssignee(id) {
    setEditForm((p) => ({
      ...p,
      assignees: p.assignees.includes(id) ? p.assignees.filter((a) => a !== id) : [...p.assignees, id],
    }));
  }

  async function saveEdits() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          internalDeadline: editForm.internalDeadline || null,
          externalDeadline: editForm.externalDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setTask(data.task); setEditing(false); onUpdated(data.task);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function moveToStatus(newStatus, extra = {}) {
    setTransitioning(true); setError('');
    try {
      const res = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to move status');
      setTask(data.task); onUpdated(data.task); setSelectedStatus('');
    } catch (err) { setError(err.message); }
    finally { setTransitioning(false); }
  }

  function handleForward() {
    if (!selectedStatus && dropdownOptions.length === 1) {
      const next = dropdownOptions[0];
      if (next === 'live') { setShowLiveDateDialog(true); return; }
      moveToStatus(next); return;
    }
    if (!selectedStatus) { setError('Select a status to move to'); return; }
    if (selectedStatus === 'live') { setShowLiveDateDialog(true); return; }
    moveToStatus(selectedStatus);
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onDeleted(task._id); onClose();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <Portal>
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <div style={{ ...modalBoxStyle, maxWidth: '640px', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ ...modalHeaderStyle, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                {editing ? (
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }}
                  />
                ) : (
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                    {task.title}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                  }}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.revisionCount > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                      background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                    }}>
                      <RotateCcw size={10} />
                      Rev {task.revisionCount}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {canManage && !isLive && (
                  <button onClick={() => setEditing(!editing)} style={iconBtnStyle} title="Edit">
                    <Edit2 size={15} />
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    style={{ ...iconBtnStyle }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button onClick={onClose} style={iconBtnStyle}><X size={15} /></button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 24px', flexShrink: 0 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding:        '10px 16px',
                    fontSize:       12,
                    fontWeight:     600,
                    border:         'none',
                    borderBottom:   `2px solid ${activeTab === tab.key ? '#4f46e5' : 'transparent'}`,
                    background:     'transparent',
                    color:          activeTab === tab.key ? '#4f46e5' : '#9ca3af',
                    cursor:         'pointer',
                    fontFamily:     'inherit',
                    marginBottom:   '-1px',
                    transition:     'color 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* DETAILS TAB */}
              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Description */}
                  <div>
                    <label style={labelStyle}>Description</label>
                    {editing ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                      />
                    ) : (
                      <p style={{ fontSize: 13, color: task.description ? '#374151' : '#9ca3af', fontStyle: task.description ? 'normal' : 'italic', margin: 0, lineHeight: 1.6 }}>
                        {task.description || 'No description'}
                      </p>
                    )}
                  </div>

                  {/* Meta grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Priority */}
                    <div>
                      <label style={labelStyle}>Priority</label>
                      {editing ? (
                        <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} style={inputStyle}>
                          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                        </select>
                      ) : <PriorityBadge priority={task.priority} />}
                    </div>

                    {/* Content Type */}
                    <div>
                      <label style={labelStyle}>Content Type</label>
                      <span style={{ fontSize: 13, color: task.type ? '#374151' : '#9ca3af', fontStyle: task.type ? 'normal' : 'italic' }}>
                        {task.type || 'Not set'}
                      </span>
                    </div>

                    {/* Internal deadline */}
                    <div>
                      <label style={labelStyle}>Internal Deadline</label>
                      {editing ? (
                        <input type="date" value={editForm.internalDeadline} onChange={(e) => setEditForm({ ...editForm, internalDeadline: e.target.value })} style={inputStyle} />
                      ) : <DeadlineBadge date={task.internalDeadline} label="Int" closed={isLive} />}
                    </div>

                    {/* External deadline */}
                    <div>
                      <label style={labelStyle}>External Deadline</label>
                      {editing ? (
                        <input type="date" value={editForm.externalDeadline} onChange={(e) => setEditForm({ ...editForm, externalDeadline: e.target.value })} style={inputStyle} />
                      ) : <DeadlineBadge date={task.externalDeadline} label="Ext" closed={isLive} />}
                    </div>

                    {/* Live date */}
                    {task.liveDate && (
                      <div>
                        <label style={labelStyle}>Live Date</label>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                          background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7',
                        }}>
                          <Calendar size={10} />
                          {format(new Date(task.liveDate), 'dd MMM yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Assignees */}
                  <div>
                    <label style={labelStyle}>Assignees</label>
                    {editing ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {brandMembers.map((m) => {
                          const id   = m.userId?._id || m.userId;
                          const name = m.userId?.name || 'Unknown';
                          const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                          const sel  = editForm.assignees.includes(id);
                          return (
                            <button key={id} type="button" onClick={() => toggleAssignee(id)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 8,
                              padding: '6px 12px', borderRadius: 8,
                              border: `1px solid ${sel ? '#a5b4fc' : '#e5e7eb'}`,
                              background: sel ? '#eef2ff' : '#fff',
                              color: sel ? '#4338ca' : '#374151',
                              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: sel ? '#4f46e5' : '#f3f4f6', color: sel ? '#fff' : '#6b7280', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {initials}
                              </span>
                              {name}
                              {sel && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    ) : task.assignees?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {task.assignees.map((user) => {
                          const name = user.name || '';
                          const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                          return (
                            <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{name}</span>
                              <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{user.role?.replace(/_/g, ' ')}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <span style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No assignees</span>}
                  </div>

                  {/* Edit save/cancel */}
                  {editing && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button onClick={() => setEditing(false)} style={cancelBtnStyle}>Cancel</button>
                      <button onClick={saveEdits} disabled={saving} style={submitBtnStyle}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}

                  {error && <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{error}</p>}

                  {/* ── Move Task ── */}
                  {!editing && !isLive && (
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                      <label style={{ ...labelStyle, marginBottom: 12 }}>Move Task</label>
                      {isRejected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <RotateCcw size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>
                              This task was rejected. Route it back for revision to continue.
                            </p>
                          </div>
                          {canManage && (
                            <button onClick={() => setShowRouteDialog(true)} disabled={transitioning} style={{ ...submitBtnStyle, justifyContent: 'center', opacity: transitioning ? 0.5 : 1 }}>
                              <RotateCcw size={13} />
                              Route for Revision
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Back button */}
                            {backwardTarget && canManage && (
                              <button
                                onClick={() => moveToStatus(backwardTarget)}
                                disabled={transitioning}
                                title={`Back to ${STATUS_LABELS[backwardTarget]}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                  border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280',
                                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
                                  opacity: transitioning ? 0.5 : 1,
                                }}
                              >
                                <ChevronLeft size={13} />
                                {STATUS_LABELS[backwardTarget]}
                              </button>
                            )}

                            {/* Dropdown when multiple forward options */}
                            {dropdownOptions.length > 1 && (
                              <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                style={{ ...inputStyle, flex: 1, minWidth: 160 }}
                              >
                                <option value="">Select next stage...</option>
                                {dropdownOptions.map((s) => (
                                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                            )}

                            {/* Forward button */}
                            {dropdownOptions.length > 0 && (
                              <button
                                onClick={handleForward}
                                disabled={transitioning || (dropdownOptions.length > 1 && !selectedStatus)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                  border: '1px solid #c4b5fd', background: '#faf5ff', color: '#6d28d9',
                                  cursor: (transitioning || (dropdownOptions.length > 1 && !selectedStatus)) ? 'not-allowed' : 'pointer',
                                  fontFamily: 'inherit', transition: 'all 0.15s ease',
                                  opacity: (transitioning || (dropdownOptions.length > 1 && !selectedStatus)) ? 0.5 : 1,
                                }}
                              >
                                {dropdownOptions.length === 1
                                  ? STATUS_LABELS[dropdownOptions[0]]
                                  : (selectedStatus ? STATUS_LABELS[selectedStatus] : 'Move Forward')
                                }
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>

                          {/* Reject button */}
                          {forwardOptions.includes('rejected') && canManage && (
                            <button
                              onClick={() => setShowRejectDialog(true)}
                              disabled={transitioning}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626',
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
                                opacity: transitioning ? 0.5 : 1, alignSelf: 'flex-start',
                              }}
                            >
                              <X size={13} />
                              Reject Task
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isLive && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #6ee7b7', fontSize: 13, color: '#047857' }}>
                      <Check size={15} />
                      Task is live and closed.
                      {task.liveDate && <span style={{ fontSize: 11, opacity: 0.7 }}>· Live {format(new Date(task.liveDate), 'dd MMM yyyy')}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* COMMENTS TAB */}
              {activeTab === 'comments' && (
                <div style={{ minHeight: 360 }}>
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
                <ActivityFeed taskId={task._id} />
              )}
            </div>
          </div>
        </div>
      </Portal>

      {/* Delete confirm */}
      {deleteConfirm && (
        <Portal>
          <div style={{ ...backdropStyle, zIndex: 100001 }}>
            <div style={{ ...modalBoxStyle, maxWidth: 360 }}>
              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>Delete Task?</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Permanently delete <strong>&quot;{task.title}&quot;</strong>? This cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setDeleteConfirm(false)} style={cancelBtnStyle}>Cancel</button>
                  <button onClick={handleDelete} style={{ ...submitBtnStyle, background: '#dc2626' }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showRejectDialog && (
        <RejectionDialog
          task={task}
          onClose={() => setShowRejectDialog(false)}
          onRejected={(updated) => { setTask(updated); onUpdated(updated); setShowRejectDialog(false); }}
        />
      )}

      {showLiveDateDialog && (
        <LiveDateDialog
          loading={transitioning}
          onConfirm={(liveDate) => { setShowLiveDateDialog(false); moveToStatus('live', { liveDate }); }}
          onCancel={() => setShowLiveDateDialog(false)}
        />
      )}

      {showRouteDialog && (
        <RouteFromRejectedDialog
          task={task}
          loading={transitioning}
          onClose={() => setShowRouteDialog(false)}
          onConfirm={(routeTo) => { setShowRouteDialog(false); moveToStatus(routeTo); }}
        />
      )}
    </>
  );
}

// ── Shared style objects ───────────────────────────────────────────────────
const backdropStyle = {
  position:        'fixed',
  inset:           0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter:  'blur(4px)',
  zIndex:          100000,
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  padding:         '16px',
};
const modalBoxStyle = {
  background:    '#ffffff',
  borderRadius:  '16px',
  border:        '1px solid #e5e7eb',
  boxShadow:     '0 25px 80px rgba(0, 0, 0, 0.18)',
  width:         '100%',
  display:       'flex',
  flexDirection: 'column',
  overflow:      'hidden',
};
const modalHeaderStyle = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        '20px 24px',
  borderBottom:   '1px solid #f3f4f6',
  flexShrink:     0,
};
const modalFooterStyle = {
  display:        'flex',
  justifyContent: 'flex-end',
  gap:            '10px',
  padding:        '16px 24px',
  borderTop:      '1px solid #f3f4f6',
  flexShrink:     0,
};
const iconBtnStyle = {
  padding:        '6px',
  borderRadius:   '8px',
  border:         'none',
  background:     'transparent',
  cursor:         'pointer',
  color:          '#9ca3af',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  transition:     'all 0.15s ease',
};
const labelStyle = {
  display:      'block',
  fontSize:     '11px',
  fontWeight:   600,
  color:        '#6b7280',
  marginBottom: '6px',
  textTransform:'uppercase',
  letterSpacing:'0.05em',
  fontFamily:   'inherit',
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
  outline:      'none',
};
const cancelBtnStyle = {
  padding:      '8px 16px',
  fontSize:     '13px',
  fontWeight:   500,
  color:        '#374151',
  background:   '#f3f4f6',
  border:       'none',
  borderRadius: '8px',
  cursor:       'pointer',
  fontFamily:   'inherit',
};
const submitBtnStyle = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          '6px',
  padding:      '8px 18px',
  fontSize:     '13px',
  fontWeight:   500,
  color:        '#ffffff',
  background:   '#4f46e5',
  border:       'none',
  borderRadius: '8px',
  cursor:       'pointer',
  fontFamily:   'inherit',
};