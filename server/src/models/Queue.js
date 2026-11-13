const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
      required: [true, 'Queue must belong to a manager'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a queue name'],
      trim: true,
      maxlength: [100, 'Queue name cannot exceed 100 characters'],
    },
    prefix: {
      type: String,
      required: [true, 'Please provide a token prefix'],
      trim: true,
      uppercase: true,
      maxlength: [6, 'Prefix cannot exceed 6 characters'],
    },
    nextNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentServing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for manager queues
queueSchema.index({ manager: 1, createdAt: -1 });
queueSchema.index({ manager: 1, name: 1 });

const Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;
