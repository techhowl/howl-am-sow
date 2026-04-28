// src/lib/workflow/transitions.js

// Full ordered status list — used for forward/backward navigation
export const STATUS_ORDER = [
  'copy_wip',
  'video_wip',
  'design_wip',
  'internal_review',
  'sent_to_client',
  'approved',
  'live',
]

// Valid forward transitions from each status
// rejected is a dead-end — AM manually routes it back via separate action
export const VALID_TRANSITIONS = {
  copy_wip:        ['video_wip', 'design_wip', 'internal_review'],
  video_wip:       ['design_wip', 'internal_review'],
  design_wip:      ['internal_review'],
  internal_review: ['sent_to_client'],
  sent_to_client:  ['approved', 'rejected'],
  approved:        ['live'],
  rejected:        [], // no auto-routing — AM uses "Route for Revision" action
  live:            [],
}

// Valid backward transitions — skip rejected and live
export const BACKWARD_TRANSITIONS = {
  video_wip:       'copy_wip',
  design_wip:      'video_wip',
  internal_review: 'design_wip',
  sent_to_client:  'internal_review',
  approved:        'sent_to_client',
}

export const STATUS_LABELS = {
  copy_wip:        'Copy WIP',
  video_wip:       'Video WIP',
  design_wip:      'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client:  'Sent to Client',
  approved:        'Approved',
  rejected:        'Rejected',
  live:            'Live',
}

export const STATUS_COLORS = {
  copy_wip:        'purple',
  video_wip:       'violet',
  design_wip:      'blue',
  internal_review: 'amber',
  sent_to_client:  'teal',
  approved:        'green',
  rejected:        'red',
  live:            'emerald',
}

export function getValidTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || []
}

export function getBackwardTransition(currentStatus) {
  return BACKWARD_TRANSITIONS[currentStatus] || null
}

export function isValidTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to)
}

export function getInitialStatus(copyRequired, videoRequired, designRequired) {
  if (copyRequired) return 'copy_wip'
  if (videoRequired) return 'video_wip'
  if (designRequired) return 'design_wip'
  return 'internal_review'
}