// lib/db/models/ActivityLog.js

import mongoose from 'mongoose'

const ActivityLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['task', 'deliverable', 'brand', 'user', 'comment'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-delete logs older than 90 days
ActivityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
)
ActivityLogSchema.index({ entityId: 1, entityType: 1 })
ActivityLogSchema.index({ brandId: 1, createdAt: -1 })
ActivityLogSchema.index({ performedBy: 1 })

const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema)

export default ActivityLog