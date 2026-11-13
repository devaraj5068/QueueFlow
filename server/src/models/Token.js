const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    queue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: [true, 'Token must belong to a queue'],
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
      required: [true, 'Token must belong to a manager'],
      index: true,
    },
    personName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    number: {
      type: Number,
      required: [true, 'Token sequential number is required'],
    },
    code: {
      type: String,
      required: [true, 'Formatted token code is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'serving', 'completed', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    servedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queue and analytics querying
tokenSchema.index({ queue: 1, status: 1, position: 1 });
tokenSchema.index({ queue: 1, number: 1 }, { unique: true });
tokenSchema.index({ manager: 1, status: 1, joinedAt: -1 });
tokenSchema.index({ manager: 1, joinedAt: -1 });

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
