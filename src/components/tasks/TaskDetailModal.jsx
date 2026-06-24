// src/components/tasks/TaskDetailModal.jsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Trash2, Edit2, Check, RotateCcw, Calendar } from 'lucide-react';
import Portal from '@/components/shared/Portal';
import PriorityBadge from '@/components/shared/PriorityBadge';
import DeadlineBadge from '@/components/shared/DeadlineBadge';
import RejectionDialog from '@/components/tasks/RejectionDialog';
import CommentThread from '@/components/tasks/CommentThread';
import ActivityFeed from '@/components/tasks/ActivityFeed';
import { format } from 'date-fns';
import { getBackwardTransition } from '@/lib/workflow/transitions';

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
  copy_wip:       { bg: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', border: 'color-mix(in oklch, var(--primary) 30%, transparent)' },
  design_wip:     { bg: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', border: 'color-mix(in oklch, var(--primary) 30%, transparent)' },
  video_wip:      { bg: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', border: 'color-mix(in oklch, var(--primary) 30%, transparent)' },
  sent_to_client: { bg: 'color-mix(in oklch, var(--warning) 10%, transparent)', color: 'var(--warning)', border: 'color-mix(in oklch, var(--warning) 30%, transparent)' },
  approved:       { bg: 'color-mix(in oklch, var(--success) 10%, transparent)', color: 'var(--success)', border: 'color-mix(in oklch, var(--success) 30%, transparent)' },
  rejected:       { bg: 'color-mix(in oklch, var(--destructive) 10%, transparent)', color: 'var(--destructive)', border: 'color-mix(in oklch, var(--destructive) 30%, transparent)' },
  live:           { bg: 'color-mix(in oklch, var(--success) 10%, transparent)', color: 'var(--success)', border: 'color-mix(in oklch, var(--success) 30%, transparent)' },
};

// Tones map to .chip[data-tone] — WIP stages read as sage `primary`.
const STATUS_CHIP_TONE = {
  copy_wip:       'primary',
  design_wip:     'primary',
  video_wip:      'primary',
  sent_to_client: 'warning',
  approved:       'success',
  rejected:       'destructive',
  live:           'success',
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
      <div className="modal-backdrop" style={{ zIndex: 100001 }} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
        <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'color-mix(in oklch, var(--success) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="var(--success)" />
              </div>
              <div>
                <p className="editorial-h2 text-foreground" style={{ margin: 0, fontSize: '1.05rem' }}>Set Live Date</p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>When will this go live?</p>
              </div>
            </div>
            <button onClick={onCancel} className="btn-ghost" style={iconBtnStyle}><X size={16} /></button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <label className="label">Live Date <span style={{ color: 'var(--muted-foreground)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(leave blank for today)</span></label>
            <input type="date" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} className="input" />
          </div>
          <div className="modal-footer">
            <button onClick={onCancel} className="btn-ghost">Cancel</button>
            <button
              onClick={() => onConfirm(liveDate || null)}
              disabled={loading}
              className="btn-primary"
              style={{ background: 'var(--success)', color: 'var(--success-foreground)' }}
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
      <div className="modal-backdrop" style={{ zIndex: 100001 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <p className="editorial-h2 text-foreground" style={{ margin: 0, fontSize: '1.05rem' }}>Route for Revision</p>
            <button onClick={onClose} className="btn-ghost" style={iconBtnStyle}><X size={16} /></button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="label">Route back to</label>
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
                  border:       `1px solid ${routeTo === opt.value ? 'color-mix(in oklch, var(--primary) 40%, transparent)' : 'var(--border)'}`,
                  background:   routeTo === opt.value ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'var(--card)',
                  cursor:       'pointer',
                  transition:   'all 0.15s ease',
                }}
              >
                <div style={{
                  width:        16, height: 16,
                  borderRadius: '50%',
                  border:       `2px solid ${routeTo === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                  background:   routeTo === opt.value ? 'var(--primary)' : 'transparent',
                  display:      'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink:   0,
                }}>
                  {routeTo === opt.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-foreground)' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: routeTo === opt.value ? 'var(--primary)' : 'var(--foreground)' }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={() => onConfirm(routeTo)} disabled={loading} className="btn-primary">
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
  const reduce = useReducedMotion();
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

  const canManage  = ['superadmin', 'admin', 'account_manager'].includes(currentUserRole);
  const isLive     = task.status === 'live';
  const isRejected = task.status === 'rejected';

  const forwardOptions = VALID_TRANSITIONS[task.status] || [];
  const backwardTarget = getBackwardTransition(task.status, task);
  const dropdownOptions = forwardOptions.filter((s) => s !== 'rejected');
  const statusStyle     = STATUS_COLORS[task.status] || { bg: 'var(--muted)', color: 'var(--muted-foreground)', border: 'var(--border)' };
  const statusTone      = STATUS_CHIP_TONE[task.status];

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

  // ── Tab panel contents (rendered inside the crossfade wrapper) ────────────
  function renderTabPanel() {
    if (activeTab === 'comments') {
      return (
        <div style={{ minHeight: 360 }}>
          <CommentThread
            taskId={task._id}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            brandMembers={brandMembers}
          />
        </div>
      );
    }

    if (activeTab === 'activity') {
      return <ActivityFeed taskId={task._id} />;
    }

    // DETAILS TAB
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Description */}
        <div>
          <label className="label">Description</label>
          {editing ? (
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="input"
              style={{ resize: 'none' }}
            />
          ) : (
            <p style={{ fontSize: 13, color: task.description ? 'var(--foreground)' : 'var(--muted-foreground)', fontStyle: task.description ? 'normal' : 'italic', margin: 0, lineHeight: 1.6 }}>
              {task.description || 'No description'}
            </p>
          )}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Priority */}
          <div>
            <label className="label">Priority</label>
            {editing ? (
              <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="input">
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            ) : <PriorityBadge priority={task.priority} />}
          </div>

          {/* Content Type */}
          <div>
            <label className="label">Content Type</label>
            <span style={{ fontSize: 13, color: task.type ? 'var(--foreground)' : 'var(--muted-foreground)', fontStyle: task.type ? 'normal' : 'italic' }}>
              {task.type || 'Not set'}
            </span>
          </div>

          {/* Internal deadline */}
          <div>
            <label className="label">Internal Deadline</label>
            {editing ? (
              <input type="date" value={editForm.internalDeadline} onChange={(e) => setEditForm({ ...editForm, internalDeadline: e.target.value })} className="input" />
            ) : <DeadlineBadge date={task.internalDeadline} label="Int" closed={isLive} />}
          </div>

          {/* External deadline */}
          <div>
            <label className="label">External Deadline</label>
            {editing ? (
              <input type="date" value={editForm.externalDeadline} onChange={(e) => setEditForm({ ...editForm, externalDeadline: e.target.value })} className="input" />
            ) : <DeadlineBadge date={task.externalDeadline} label="Ext" closed={isLive} />}
          </div>

          {/* Live date */}
          {task.liveDate && (
            <div>
              <label className="label">Live Date</label>
              <span className="chip" data-tone="success">
                <Calendar size={10} />
                {format(new Date(task.liveDate), 'dd MMM yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Assignees */}
        <div>
          <label className="label">Assignees</label>
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
                    border: `1px solid ${sel ? 'color-mix(in oklch, var(--primary) 40%, transparent)' : 'var(--border)'}`,
                    background: sel ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'var(--card)',
                    color: sel ? 'var(--primary)' : 'var(--foreground)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: sel ? 'var(--primary)' : 'var(--muted)', color: sel ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                  <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{name}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>{user.role?.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          ) : <span style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No assignees</span>}
        </div>

        {/* Edit save/cancel */}
        {editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            <button onClick={saveEdits} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: 'var(--destructive)', background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{error}</p>}

        {/* ── Move Task ── */}
        {!editing && !isLive && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <label className="label" style={{ marginBottom: 12 }}>Move Task</label>
            {isRejected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)' }}>
                  <RotateCcw size={15} color="var(--destructive)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--destructive)', margin: 0 }}>
                    This task was rejected. Route it back for revision to continue.
                  </p>
                </div>
                {canManage && (
                  <button onClick={() => setShowRouteDialog(true)} disabled={transitioning} className="btn-primary" style={{ justifyContent: 'center' }}>
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
                      className="btn-ghost"
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
                      className="input"
                      style={{ flex: 1, minWidth: 160 }}
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
                      className="btn-primary"
                      style={{
                        border: '1px solid color-mix(in oklch, var(--primary) 40%, transparent)',
                        background: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                        color: 'var(--primary)',
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
                    className="btn-danger"
                    style={{ alignSelf: 'flex-start' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, background: 'color-mix(in oklch, var(--success) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)', fontSize: 13, color: 'var(--success)' }}>
            <Check size={15} />
            Task is live and closed.
            {task.liveDate && <span style={{ fontSize: 11, opacity: 0.7 }}>· Live {format(new Date(task.liveDate), 'dd MMM yyyy')}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Portal>
        <div className="modal-backdrop" style={{ zIndex: 100000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <div className="modal" style={{ maxWidth: 640, maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Hero header */}
            <div className="modal-header" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                {editing ? (
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="input"
                    style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}
                  />
                ) : (
                  <p className="editorial-h2 text-foreground" style={{ margin: '0 0 10px 0' }}>
                    {task.title}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    className="chip"
                    data-tone={statusTone === 'primary' ? 'primary' : undefined}
                    style={statusTone && statusTone !== 'primary'
                      ? { color: statusStyle.color, borderColor: statusStyle.border, background: statusStyle.bg }
                      : undefined}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.revisionCount > 0 && (
                    <span className="chip" style={{ color: 'var(--warning)', borderColor: 'color-mix(in oklch, var(--warning) 30%, transparent)', background: 'color-mix(in oklch, var(--warning) 10%, transparent)' }}>
                      <RotateCcw size={10} />
                      Rev {task.revisionCount}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {canManage && !isLive && (
                  <button onClick={() => setEditing(!editing)} className="btn-ghost" style={iconBtnStyle} title="Edit">
                    <Edit2 size={15} />
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="btn-ghost"
                    style={iconBtnStyle}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button onClick={onClose} className="btn-ghost" style={iconBtnStyle} title="Close"><X size={15} /></button>
              </div>
            </div>

            {/* Tabs — segmented control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="chip"
                  data-active={activeTab === tab.key ? 'true' : undefined}
                  style={{ position: 'relative', cursor: 'pointer', fontFamily: 'inherit', padding: '5px 14px' }}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.span
                      layoutId="taskTabUnderline"
                      style={{
                        position: 'absolute', left: 12, right: 12, bottom: -13, height: 2,
                        borderRadius: 2, background: 'var(--foreground)',
                      }}
                      transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Body — crossfade between tab panels */}
            <div className="modal-body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={reduce ? false : { opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? {} : { opacity: 0, x: -6 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                >
                  {renderTabPanel()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Portal>

      {/* Delete confirm */}
      {deleteConfirm && (
        <Portal>
          <div className="modal-backdrop" style={{ zIndex: 100001 }} onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(false); }}>
            <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '24px' }}>
                <p className="editorial-h2 text-foreground" style={{ margin: '0 0 8px 0', fontSize: '1.05rem' }}>Delete Task?</p>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Permanently delete <strong>&quot;{task.title}&quot;</strong>? This cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setDeleteConfirm(false)} className="btn-ghost">Cancel</button>
                  <button onClick={handleDelete} className="btn-primary" style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>Delete</button>
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

// Icon-button sizing override layered on .btn-ghost (square, padded for icon-only).
const iconBtnStyle = {
  padding: 7,
  width: 32,
  height: 32,
  justifyContent: 'center',
};
