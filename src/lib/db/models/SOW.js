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
  type:     { type: String, required: true },         // e.g. "Reels & Videos (Upto 30-45 sec)"
  target:   { type: Number, required: true, min: 0 }, // monthly target — decimals allowed (e.g. 0.33)
  unitRate: { type: Number, default: 0, min: 0 },     // ₹ per unit (single retainer rate, integer)
  isCustom: { type: Boolean, default: false },
}, { _id: false })

const CarryOverSchema = new mongoose.Schema({
  type:           { type: String, required: true },
  amount:         { type: Number, required: true },  // unit adjustment (negative = reduce scope, positive = increase)
  moneyImpact:    { type: Number, default: 0 },      // ₹ impact = unitRate × amount (signed)
  fromMonth:      { type: String, required: true },  // "2025-04"
  note:           { type: String, default: '' },
  confirmedByAM:  { type: Boolean, default: false },
}, { _id: true })

const SOWSchema = new mongoose.Schema({
  brandId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Brand',
    required: true,
  },
  month: {
    type:     String,
    required: true,                                  // "YYYY-MM"
  },
  items:      [SOWItemSchema],
  carryOvers: [CarryOverSchema],
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

SOWSchema.index({ brandId: 1, month: 1 }, { unique: true })

// ─── Helpers (used in API layer) ──────────────────────────────────────
export function itemScopeValue(item) {
  return (item.target || 0) * (item.unitRate || 0)
}
export function itemDeliveredValue(item, achievedUnits) {
  return (achievedUnits || 0) * (item.unitRate || 0)
}

const SOW = mongoose.models.SOW || mongoose.model('SOW', SOWSchema)
export default SOW