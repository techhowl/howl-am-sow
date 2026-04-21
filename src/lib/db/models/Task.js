// lib/db/models/Task.js

import mongoose from 'mongoose'

export const TASK_STATUSES = [
  'copy_wip',
  'design_wip',
  'internal_review',
  'sent_to_client',
  'approved',
  'rejected',
  'live',
]

export const TASK_PRIORITIES = ['high', 'medium', 'low']

const TaskSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    deliverableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverable',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'copy_wip',
    },
    copyRequired: {
      type: Boolean,
      default: true,
    },
    designRequired: {
      type: Boolean,
      default: true,
    },
    internalDeadline: {
      type: Date,
      default: null,
    },
    externalDeadline: {
      type: Date,
      default: null,
    },
    revisionCount: {
      type: Number,
      default: 0,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

TaskSchema.index({ brandId: 1 })
TaskSchema.index({ deliverableId: 1 })
TaskSchema.index({ status: 1 })
TaskSchema.index({ assignees: 1 })
TaskSchema.index({ brandId: 1, status: 1 })
TaskSchema.index({ internalDeadline: 1 })
TaskSchema.index({ externalDeadline: 1 })

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)

export default Task