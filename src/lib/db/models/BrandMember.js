// lib/db/models/BrandMember.js

import mongoose from 'mongoose'

const BrandMemberSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

BrandMemberSchema.index({ brandId: 1, userId: 1 }, { unique: true })
BrandMemberSchema.index({ userId: 1 })
BrandMemberSchema.index({ brandId: 1 })

const BrandMember =
  mongoose.models.BrandMember || mongoose.model('BrandMember', BrandMemberSchema)

export default BrandMember