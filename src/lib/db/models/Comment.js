// lib/db/models/Comment.js

import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

CommentSchema.index({ taskId: 1, createdAt: -1 })

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema)

export default Comment