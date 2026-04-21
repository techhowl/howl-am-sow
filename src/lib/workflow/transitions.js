// src/lib/workflow/transitions.js

export const VALID_TRANSITIONS = {
  copy_wip: ['design_wip'],
  design_wip: ['internal_review'],
  internal_review: ['sent_to_client'],
  sent_to_client: ['approved', 'rejected'],
  approved: ['live'],
  rejected: ['copy_wip', 'design_wip'],
  live: [],
};

export const STATUS_LABELS = {
  copy_wip:        'Copy WIP',
  design_wip:      'Design WIP',
  internal_review: 'Internal Review',
  sent_to_client:  'Sent to Client',
  approved:        'Approved',
  rejected:        'Rejected',
  live:            'Live',
};

export const STATUS_COLORS = {
  copy_wip:        'purple',
  design_wip:      'blue',
  internal_review: 'amber',
  sent_to_client:  'teal',
  approved:        'green',
  rejected:        'red',
  live:            'green',
};

export function getValidTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

export function isValidTransition(from, to) {
  return getValidTransitions(from).includes(to);
}

export function getInitialStatus(copyRequired, designRequired) {
  if (copyRequired) return 'copy_wip';
  if (designRequired) return 'design_wip';
  return 'internal_review';
}