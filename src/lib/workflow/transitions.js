// src/lib/workflow/transitions.js

// Full ordered status list — used for forward/backward navigation
export const STATUS_ORDER = [
  'copy_wip',
  'design_wip',
  'video_wip',
  'sent_to_client',
  'approved',
  'live',
]

// Valid forward transitions from each status.
// Stages can be skipped if not required (no-video task: design_wip → sent_to_client).
// rejected is a dead-end — AM manually routes it back via separate action.
export const VALID_TRANSITIONS = {
  copy_wip:       ['design_wip', 'video_wip', 'sent_to_client'],
  design_wip:     ['video_wip', 'sent_to_client'],
  video_wip:      ['sent_to_client'],
  sent_to_client: ['approved', 'rejected'],
  approved:       ['live'],
  rejected:       [], // no auto-routing — AM uses "Route for Revision" action
  live:           [],
}

// Valid backward transitions — skip rejected and live
export const BACKWARD_TRANSITIONS = {
  design_wip:     'copy_wip',
  video_wip:      'design_wip',
  sent_to_client: 'video_wip',
  approved:       'sent_to_client',
}

export const STATUS_LABELS = {
  copy_wip:       'Copy WIP',
  design_wip:     'Design WIP',
  video_wip:      'Video WIP',
  sent_to_client: 'Sent to Client',
  approved:       'Approved',
  rejected:       'Rejected',
  live:           'Live',
}

export const STATUS_COLORS = {
  copy_wip:       'purple',
  design_wip:     'blue',
  video_wip:      'violet',
  sent_to_client: 'teal',
  approved:       'green',
  rejected:       'red',
  live:           'emerald',
}

export function getValidTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || []
}

// Which workflow stages a task actually goes through, based on its flags.
// copy/design default ON (required unless explicitly false); video defaults OFF.
export function getRequiredStages(task = {}) {
  return {
    copy_wip:       task.copyRequired   !== false,
    design_wip:     task.designRequired !== false,
    video_wip:      task.videoRequired === true,
    sent_to_client: true,
    approved:       true,
    live:           true,
  }
}

// Backward target = nearest *required* stage before the current one.
// Task-aware: a no-video task at sent_to_client goes back to design_wip, not video_wip.
// Falls back to the static map when no task flags are supplied.
export function getBackwardTransition(currentStatus, task) {
  if (!task) return BACKWARD_TRANSITIONS[currentStatus] || null
  const idx = STATUS_ORDER.indexOf(currentStatus)
  if (idx <= 0) return null
  const required = getRequiredStages(task)
  for (let i = idx - 1; i >= 0; i--) {
    if (required[STATUS_ORDER[i]]) return STATUS_ORDER[i]
  }
  return null
}

export function isValidTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to)
}

// Initial status follows the new order: copy → design → video → client
export function getInitialStatus(copyRequired, videoRequired, designRequired) {
  if (copyRequired)   return 'copy_wip'
  if (designRequired) return 'design_wip'
  if (videoRequired)  return 'video_wip'
  return 'sent_to_client'
}