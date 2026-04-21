// lib/db/models/Deliverable.js

import mongoose from 'mongoose'
import { DELIVERABLE_TYPES } from '@/lib/constants/deliverables'

const DeliverableSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Deliverable name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: DELIVERABLE_TYPES,
      required: true,
    },
    // Only populated when type === 'custom'
    customTypeName: {
      type: String,
      default: null,
      trim: true,
    },
    // For video_adapt / static_adapt — links to source deliverable
    parentDeliverableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverable',
      default: null,
    },
    description: {
      type: String,
      default: null,
      trim: true,
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

DeliverableSchema.index({ brandId: 1 })
DeliverableSchema.index({ type: 1 })
DeliverableSchema.index({ parentDeliverableId: 1 })
DeliverableSchema.index({ brandId: 1, type: 1 })

const Deliverable =
  mongoose.models.Deliverable || mongoose.model('Deliverable', DeliverableSchema)

export default Deliverable