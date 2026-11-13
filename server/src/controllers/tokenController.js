const Token = require('../models/Token');
const Queue = require('../models/Queue');
const queueService = require('../services/queueService');

/**
 * Helper to emit Socket.IO real-time events safely
 */
const emitQueueUpdate = (req, queueId, action, data = {}) => {
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${queueId}`).emit('queue:update', { queueId, action, ...data });
      if (req.manager && req.manager._id) {
        io.to(`manager:${req.manager._id}`).emit('queue:update', { queueId, action, ...data });
      }
    }
  } catch (err) {
    console.warn('[QueueFlow Socket] Emission error:', err.message);
  }
};

/**
 * @desc    Get all tokens for a queue (waiting and serving)
 * @route   GET /api/queues/:queueId/tokens
 * @access  Private
 */
const getTokens = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    const { status = 'waiting' } = req.query;

    // Verify queue ownership
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

    const filter = {
      queue: queueId,
      manager: req.manager._id,
    };

    if (status !== 'all') {
      filter.status = status;
    }

    const tokens = await Token.find(filter).sort({
      position: 1,
      joinedAt: 1,
    });

    // Also fetch the current serving token if not included in the filter
    let currentServingToken = queue.currentServing;
    if (!currentServingToken && status === 'waiting') {
      currentServingToken = await Token.findOne({
        queue: queueId,
        manager: req.manager._id,
        status: 'serving',
      });
    }

    return res.status(200).json({
      success: true,
      count: tokens.length,
      currentServing: currentServingToken,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate a new customer token
 * @route   POST /api/queues/:queueId/tokens
 * @access  Private
 */
const createToken = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    const { personName } = req.body;

    const token = await queueService.generateToken(
      queueId,
      req.manager._id,
      personName
    );

    emitQueueUpdate(req, queueId, 'token:created', { token });

    return res.status(201).json({
      success: true,
      message: `Token ${token.code} generated for ${token.personName}`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign the next waiting customer to be served
 * @route   POST /api/queues/:queueId/tokens/assign-next
 * @access  Private
 */
const assignNextToken = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const token = await queueService.assignNextToken(queueId, req.manager._id);

    emitQueueUpdate(req, queueId, 'token:assigned', { token });

    return res.status(200).json({
      success: true,
      message: `Token ${token.code} (${token.personName}) is now being served.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move a token position up or down
 * @route   PATCH /api/queues/:queueId/tokens/:tokenId/move
 * @access  Private
 */
const moveToken = async (req, res, next) => {
  try {
    const { queueId, tokenId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "Direction must be either 'up' or 'down'.",
      });
    }

    const token = await queueService.moveTokenPosition(
      queueId,
      req.manager._id,
      tokenId,
      direction
    );

    emitQueueUpdate(req, queueId, 'token:moved', { tokenId, direction });

    return res.status(200).json({
      success: true,
      message: `Token moved ${direction} successfully.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a waiting or serving token
 * @route   PATCH /api/queues/:queueId/tokens/:tokenId/cancel
 * @access  Private
 */
const cancelToken = async (req, res, next) => {
  try {
    const { queueId, tokenId } = req.params;

    const token = await queueService.cancelToken(
      queueId,
      req.manager._id,
      tokenId
    );

    emitQueueUpdate(req, queueId, 'token:cancelled', { tokenId });

    return res.status(200).json({
      success: true,
      message: `Token ${token.code} has been cancelled.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a serving token as completed
 * @route   PATCH /api/queues/:queueId/tokens/:tokenId/complete
 * @access  Private
 */
const completeToken = async (req, res, next) => {
  try {
    const { queueId, tokenId } = req.params;

    const token = await queueService.completeServingToken(
      queueId,
      req.manager._id,
      tokenId
    );

    emitQueueUpdate(req, queueId, 'token:completed', { tokenId });

    return res.status(200).json({
      success: true,
      message: `Token ${token.code} marked as completed.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTokens,
  createToken,
  assignNextToken,
  moveToken,
  cancelToken,
  completeToken,
};
