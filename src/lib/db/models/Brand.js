// lib/db/models/Brand.js

import mongoose from 'mongoose'

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    customDeliverableTypes: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

BrandSchema.index({ name: 1 })
BrandSchema.index({ createdBy: 1 })
BrandSchema.index({ isActive: 1 })

const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema)

export default Brand