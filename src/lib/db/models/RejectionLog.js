// lib/db/models/RejectionLog.js

import mongoose from 'mongoose'

const RejectionLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    routedBackTo: {
      type: String,
      enum: ['copy_wip', 'design_wip'],
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Rejection reason is required'],
      trim: true,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rejectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

RejectionLogSchema.index({ taskId: 1 })
RejectionLogSchema.index({ rejectedAt: -1 })

const RejectionLog =
  mongoose.models.RejectionLog || mongoose.model('RejectionLog', RejectionLogSchema)

export default RejectionLog