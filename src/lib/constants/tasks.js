// src/lib/constants/tasks.js
// Client-safe constants — never import Mongoose models here

export const TASK_STATUSES = [
  'copy_wip',
  'design_wip',
  'video_wip',
  'sent_to_client',
  'approved',
  'rejected',
  'live',
];

export const TASK_PRIORITIES = ['high', 'medium', 'low'];

export const STATUS_LABELS = {
  copy_wip:       'Copy WIP',
  design_wip:     'Design WIP',
  video_wip:      'Video WIP',
  sent_to_client: 'Sent to Client',
  approved:       'Approved',
  rejected:       'Rejected',
  live:           'Live',
};

export const PRIORITY_LABELS = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
};

// Kanban columns — order: copy → design → video → client → approved → rejected → live
export const KANBAN_COLUMNS = [
  'copy_wip',
  'design_wip',
  'video_wip',
  'sent_to_client',
  'approved',
  'rejected',
  'live',
];

// Valid forward transitions — mirrored from server for display hints only.
// Server always re-validates; this is UI-only.
// Each stage can skip ahead (a task with no video skips video_wip).
export const VALID_TRANSITIONS = {
  copy_wip:       ['design_wip', 'video_wip', 'sent_to_client'],
  design_wip:     ['video_wip', 'sent_to_client'],
  video_wip:      ['sent_to_client'],
  sent_to_client: ['approved', 'rejected'],
  approved:       ['live'],
  rejected:       [], // dead-end — AM uses "Route for Revision" to move it back
  live:           [],
};

// Backward transitions — used by the back button in TaskDetailModal
export const BACKWARD_TRANSITIONS = {
  design_wip:     'copy_wip',
  video_wip:      'design_wip',
  sent_to_client: 'video_wip',
  approved:       'sent_to_client',
};