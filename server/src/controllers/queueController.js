const Queue = require('../models/Queue');
const Token = require('../models/Token');

/**
 * @desc    Get all queues for authenticated manager with waiting counts & serving token
 * @route   GET /api/queues
 * @access  Private
 */
const getQueues = async (req, res, next) => {
  try {
    const queues = await Queue.find({
      manager: req.manager._id,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .populate({
        path: 'currentServing',
        select: 'personName number code status joinedAt servedAt',
      });

    // Attach real-time waiting counts to each queue
    const queueIds = queues.map((q) => q._id);
    const waitingCounts = await Token.aggregate([
      {
        $match: {
          queue: { $in: queueIds },
          manager: req.manager._id,
          status: 'waiting',
        },
      },
      {
        $group: {
          _id: '$queue',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    waitingCounts.forEach((wc) => {
      countMap[wc._id.toString()] = wc.count;
    });

    const enrichedQueues = queues.map((queue) => ({
      ...queue.toObject(),
      waitingCount: countMap[queue._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedQueues.length,
      queues: enrichedQueues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new queue
 * @route   POST /api/queues
 * @access  Private
 */
const createQueue = async (req, res, next) => {
  try {
    const { name, prefix } = req.body;
    const cleanName = name.trim();
    const cleanPrefix = (prefix || 'T').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');

    if (!cleanPrefix) {
      return res.status(400).json({
        success: false,
        message: 'Prefix must contain at least one alphanumeric character.',
      });
    }

    // Check for duplicate queue name for this manager
    const existing = await Queue.findOne({
      manager: req.manager._id,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A queue with name "${cleanName}" already exists.`,
      });
    }

    const queue = await Queue.create({
      manager: req.manager._id,
      name: cleanName,
      prefix: cleanPrefix,
      nextNumber: 1,
    });

    return res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      queue: {
        ...queue.toObject(),
        waitingCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single queue details
 * @route   GET /api/queues/:queueId
 * @access  Private
 */
const getQueueById = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await Queue.findOne({
      _id: queueId,
      manager: req.manager._id,
      isActive: true,
    }).populate('currentServing');

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.',
      });
    }

    const waitingCount = await Token.countDocuments({
      queue: queue._id,
      manager: req.manager._id,
      status: 'waiting',
    });

    return res.status(200).json({
      success: true,
      queue: {
        ...queue.toObject(),
        waitingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rename / update queue
 * @route   PATCH /api/queues/:queueId
 * @access  Private
 */
const updateQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Queue name is required for update.',
      });
    }

    const cleanName = name.trim();

    // Check duplicate name
    const duplicate = await Queue.findOne({
      _id: { $ne: queueId },
      manager: req.manager._id,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
      isActive: true,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Another queue with name "${cleanName}" already exists.`,
      });
    }

    const queue = await Queue.findOneAndUpdate(
      { _id: queueId, manager: req.manager._id, isActive: true },
      { $set: { name: cleanName } },
      { new: true }
    ).populate('currentServing');

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Queue renamed successfully',
      queue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete queue with cascade cleanup of pending tokens
 * @route   DELETE /api/queues/:queueId
 * @access  Private
 */
const deleteQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await Queue.findOne({
      _id: queueId,
      manager: req.manager._id,
      isActive: true,
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found.',
      });
    }

    // Cancel all remaining waiting tokens in this queue
    await Token.updateMany(
      { queue: queueId, manager: req.manager._id, status: 'waiting' },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          position: 0,
        },
      }
    );

    // Soft delete queue so historical analytics remain intact
    queue.isActive = false;
    queue.currentServing = null;
    await queue.save();

    return res.status(200).json({
      success: true,
      message: 'Queue deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueues,
  createQueue,
  getQueueById,
  updateQueue,
  deleteQueue,
};
