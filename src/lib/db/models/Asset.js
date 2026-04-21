// lib/db/models/Asset.js

import mongoose from 'mongoose'

const AssetSchema = new mongoose.Schema(
  {
    deliverableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverable',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Asset title is required'],
      trim: true,
    },
    link: {
      type: String,
      required: [true, 'Asset link is required'],
      trim: true,
    },
    // e.g. 'google_drive', 'frame_io', 'dropbox', 'other'
    assetType: {
      type: String,
      default: 'other',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

AssetSchema.index({ deliverableId: 1 })

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema)

export default Asset