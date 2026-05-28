// src/lib/db/models/Task.js
import mongoose from 'mongoose'

export const TASK_STATUSES = [
  'copy_wip', 'design_wip', 'video_wip',
  'sent_to_client', 'approved', 'rejected', 'live',
]

export const TASK_PRIORITIES = ['high', 'medium', 'low']

// Fixed task types — UI can offer custom SOW-derived types too, so the schema
// itself does NOT enforce this list as an enum (would reject custom SOW item names
// like "Reels & Videos (Upto 30-45 sec)"). UI uses this list as a fallback.
export const TASK_TYPES = [
  'Static', 'Static Adapt', 'Video', 'Video Adapt',
  'Reel', 'Carousel', 'GIF', 'Story', 'Performance Asset', 'Other',
]

const TaskSchema = new mongoose.Schema({
  brandId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  title:     { type: String, required: [true, 'Task title is required'], trim: true },
  description: { type: String, default: null, trim: true },
  // No default — task creation API requires this field explicitly.
  // Previously had default: 'Static' which masked a bug where the API
  // didn't destructure `type` from the request body.
  type:      { type: String, required: [true, 'Task type is required'], trim: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  priority:  { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status:    { type: String, enum: TASK_STATUSES, default: 'copy_wip' },
  copyRequired:   { type: Boolean, default: true },
  videoRequired:  { type: Boolean, default: false },
  designRequired: { type: Boolean, default: true },
  internalDeadline: { type: Date, default: null },
  externalDeadline: { type: Date, default: null },
  liveDate:    { type: Date, default: null },
  revisionCount: { type: Number, default: 0 },
  closedAt:    { type: Date, default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

TaskSchema.index({ brandId: 1 })
TaskSchema.index({ status: 1 })
TaskSchema.index({ assignees: 1 })
TaskSchema.index({ brandId: 1, status: 1 })
TaskSchema.index({ brandId: 1, type: 1 })
TaskSchema.index({ internalDeadline: 1 })
TaskSchema.index({ externalDeadline: 1 })

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)
export default Task