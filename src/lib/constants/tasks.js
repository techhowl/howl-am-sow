// src/lib/constants/tasks.js
// Client-safe constants — never import Mongoose models in client components

export const TASK_STATUSES = [
  'copy_wip',
  'design_wip',
  'internal_review',
  'sent_to_client',
  'approved',
  'rejected',
  'live',
];

export const TASK_PRIORITIES = ['high', 'medium', 'low'];

export const STATUS_LABELS = {
  copy_wip: 'Copy WIP',
  design_wip: 'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client: 'Sent to Client',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Live',
};

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// Columns shown on the Kanban board (rejected is not a column — tasks move out immediately)
export const KANBAN_COLUMNS = [
  'copy_wip',
  'design_wip',
  'internal_review',
  'sent_to_client',
  'approved',
  'live',
];

// Valid transitions — mirrored from server for optimistic UI hints only
// Server always re-validates; this is display-only
export const VALID_TRANSITIONS = {
  copy_wip: ['design_wip'],
  design_wip: ['internal_review'],
  internal_review: ['sent_to_client'],
  sent_to_client: ['approved', 'rejected'],
  approved: ['live'],
  rejected: ['copy_wip', 'design_wip'],
  live: [],
};