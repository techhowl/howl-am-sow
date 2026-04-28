// src/lib/constants/tasks.js
// Client-safe constants — never import Mongoose models here

export const TASK_STATUSES = [
  'copy_wip',
  'video_wip',
  'design_wip',
  'internal_review',
  'sent_to_client',
  'approved',
  'rejected',
  'live',
];

export const TASK_PRIORITIES = ['high', 'medium', 'low'];

export const STATUS_LABELS = {
  copy_wip:        'Copy WIP',
  video_wip:       'Video WIP',
  design_wip:      'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client:  'Sent to Client',
  approved:        'Approved',
  rejected:        'Rejected',
  live:            'Live',
};

export const PRIORITY_LABELS = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
};

// Kanban columns — rejected IS a column now (tasks stay there until AM routes them back)
export const KANBAN_COLUMNS = [
  'copy_wip',
  'video_wip',
  'design_wip',
  'internal_review',
  'sent_to_client',
  'approved',
  'rejected',
  'live',
];

// Valid forward transitions — mirrored from server for display hints only
// Server always re-validates; this is UI-only
export const VALID_TRANSITIONS = {
  copy_wip:        ['video_wip', 'design_wip', 'internal_review'],
  video_wip:       ['design_wip', 'internal_review'],
  design_wip:      ['internal_review'],
  internal_review: ['sent_to_client'],
  sent_to_client:  ['approved', 'rejected'],
  approved:        ['live'],
  rejected:        [], // dead-end — AM uses "Route for Revision" to move it back
  live:            [],
};

// Backward transitions — used by the back button in TaskDetailModal
export const BACKWARD_TRANSITIONS = {
  video_wip:       'copy_wip',
  design_wip:      'video_wip',
  internal_review: 'design_wip',
  sent_to_client:  'internal_review',
  approved:        'sent_to_client',
};