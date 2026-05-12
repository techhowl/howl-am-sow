// src/lib/db/models/SOW.js
import mongoose from 'mongoose'

// Fixed content types + custom ones added by AM
export const FIXED_SOW_TYPES = [
  'Static',
  'Static Adapt',
  'Video',
  'Video Adapt',
  'Reel',
  'Carousel',
  'GIF',
  'Story',
  'Performance Asset',
]

const SOWItemSchema = new mongoose.Schema({
  type:     { type: String, required: true }, // e.g. "Video", "Static", custom
  target:   { type: Number, required: true, min: 0 }, // monthly target count
  isCustom: { type: Boolean, default: false }, // true if AM added this type
}, { _id: false })

const CarryOverSchema = new mongoose.Schema({
  type:      { type: String, required: true },
  amount:    { type: Number, required: true }, // negative = deficit, positive = surplus
  fromMonth: { type: String, required: true }, // "2025-04"
  note:      { type: String, default: '' },
  confirmedByAM: { type: Boolean, default: false },
}, { _id: true })

const SOWSchema = new mongoose.Schema({
  brandId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Brand',
    required: true,
  },
  // Month this SOW applies to — stored as "YYYY-MM" string
  month: {
    type:     String,
    required: true, // e.g. "2025-04"
  },
  items: [SOWItemSchema], // array of { type, target }
  carryOvers: [CarryOverSchema], // carry-overs from previous month
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },
}, { timestamps: true })

// Compound unique index — one SOW per brand per month
SOWSchema.index({ brandId: 1, month: 1 }, { unique: true })

const SOW = mongoose.models.SOW || mongoose.model('SOW', SOWSchema)
export default SOW