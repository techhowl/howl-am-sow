// lib/db/models/Copy.js

import mongoose from 'mongoose'

const CopySchema = new mongoose.Schema(
  {
    deliverableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverable',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Copy title is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
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

CopySchema.index({ deliverableId: 1 })

const Copy = mongoose.models.Copy || mongoose.model('Copy', CopySchema)

export default Copy