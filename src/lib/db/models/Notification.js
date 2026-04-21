// lib/db/models/Notification.js

import mongoose from 'mongoose'

export const NOTIFICATION_TYPES = [
  'task_assigned',
  'status_changed',
  'task_rejected',
  'task_approved',
  'task_live',
  'mentioned',
  'brand_added',
]

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    // e.g. "Hamza moved 'Ramadan Video' to Design WIP"
    message: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['task', 'brand', 'comment'],
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
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-delete notifications older than 60 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 60 }
)
NotificationSchema.index({ recipientId: 1, isRead: 1 })
NotificationSchema.index({ recipientId: 1, createdAt: -1 })

const Notification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)

export default Notification