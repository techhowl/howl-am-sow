// src/lib/db/models/RejectionLog.js
import mongoose from 'mongoose'

const RejectionLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    // Set to null at rejection time. Filled in later when the AM
    // routes the rejected task back for revision.
    routedBackTo: {
      type: String,
      enum: ['copy_wip', 'video_wip', 'design_wip', null],
      default: null,
      // NOT required — unknown until the AM routes it back
    },
    // Optional: the UI explicitly marks the rejection reason as optional,
    // so an empty string / missing value must be allowed.
    reason: {
      type: String,
      default: '',
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
    // When the AM routes the task back, record when that happened
    routedBackAt: {
      type: Date,
      default: null,
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