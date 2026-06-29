// lib/db/models/User.js

import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        'superadmin',
        'admin',
        'account_manager',
        'management_trainee_am',
        'executive_am',
        'senior_am',
        'lead_am',
        'designer',
        'copywriter',
        'motion_designer',
        'user',
      ],
      required: true,
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

export default User