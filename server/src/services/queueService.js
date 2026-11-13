const Queue = require('../models/Queue');
const Token = require('../models/Token');
const { formatTokenCode } = require('../utils/generateToken');

/**
 * Recalculate and re-index sequential positions for all waiting tokens in a queue
 * @param {ObjectId} queueId
 * @param {ObjectId} managerId
 */
const reindexWaitingTokens = async (queueId, managerId) => {
  const waitingTokens = await Token.find({
    queue: queueId,
    manager: managerId,
    status: 'waiting',
  }).sort({ position: 1, joinedAt: 1, _id: 1 });

  const bulkOps = waitingTokens.map((token, index) => ({
    updateOne: {
      filter: { _id: token._id },
      update: { $set: { position: index + 1 } },
    },
  }));

  if (bulkOps.length > 0) {
    await Token.bulkWrite(bulkOps);
  }

  return waitingTokens.length;
};

/**
 * Generate a new token atomically with incremented sequential number
 */
const generateToken = async (queueId, managerId, personName) => {
  // Atomically get and increment nextNumber on the queue
  const queue = await Queue.findOneAndUpdate(
    { _id: queueId, manager: managerId, isActive: true },
    { $inc: { nextNumber: 1 } },
    { new: false } // returns document before increment
  );

  if (!queue) {
    const error = new Error('Queue not found or inactive');
    error.statusCode = 404;
    throw error;
  }

  const tokenNumber = queue.nextNumber;
  const tokenCode = formatTokenCode(queue.prefix, tokenNumber);

  // Calculate position: next position after all currently waiting tokens
  const waitingCount = await Token.countDocuments({
    queue: queueId,
    manager: managerId,
    status: 'waiting',
  });
  const position = waitingCount + 1;

  const token = await Token.create({
    queue: queueId,
    manager: managerId,
    personName: personName.trim(),
    number: tokenNumber,
    code: tokenCode,
    status: 'waiting',
    position,
    joinedAt: new Date(),
  });

  return token;
};

/**
 * Assign the next waiting token to be served.
 * Concurrency-safe: marks previous serving token as completed and promotes position 1 token.
 */
const assignNextToken = async (queueId, managerId) => {
  const queue = await Queue.findOne({ _id: queueId, manager: managerId });
  if (!queue) {
    const error = new Error('Queue not found');
    error.statusCode = 404;
    throw error;
  }

  // Find candidate waiting token at position 1
  const nextToken = await Token.findOne({
    queue: queueId,
    manager: managerId,
    status: 'waiting',
  }).sort({ position: 1, joinedAt: 1 });

  if (!nextToken) {
    const error = new Error('No waiting customers in this queue.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // If another token is currently serving in this queue, mark it as completed
  if (queue.currentServing) {
    await Token.findOneAndUpdate(
      { _id: queue.currentServing, status: 'serving' },
      {
        $set: {
          status: 'completed',
          completedAt: now,
          position: 0,
        },
      }
    );
  }

  // Check if there are any lingering 'serving' tokens in this queue and complete them
  await Token.updateMany(
    { queue: queueId, manager: managerId, status: 'serving', _id: { $ne: nextToken._id } },
    {
      $set: {
        status: 'completed',
        completedAt: now,
        position: 0,
      },
    }
  );

  // Mark selected waiting token as serving
  nextToken.status = 'serving';
  nextToken.servedAt = now;
  nextToken.position = 0;
  await nextToken.save();

  // Update queue with current serving reference
  queue.currentServing = nextToken._id;
  await queue.save();

  // Renumber remaining waiting tokens
  await reindexWaitingTokens(queueId, managerId);

  return nextToken;
};

/**
 * Complete the currently serving token
 */
const completeServingToken = async (queueId, managerId, tokenId) => {
  const queue = await Queue.findOne({ _id: queueId, manager: managerId });
  if (!queue) {
    const error = new Error('Queue not found');
    error.statusCode = 404;
    throw error;
  }

  const query = {
    _id: tokenId,
    queue: queueId,
    manager: managerId,
    status: 'serving',
  };

  const token = await Token.findOne(query);
  if (!token) {
    const error = new Error('Serving token not found or already completed');
    error.statusCode = 404;
    throw error;
  }

  token.status = 'completed';
  token.completedAt = new Date();
  token.position = 0;
  await token.save();

  // Clear currentServing if it matches
  if (queue.currentServing && queue.currentServing.toString() === tokenId.toString()) {
    queue.currentServing = null;
    await queue.save();
  }

  return token;
};

/**
 * Move a waiting token up or down in the queue
 */
const moveTokenPosition = async (queueId, managerId, tokenId, direction) => {
  if (!['up', 'down'].includes(direction)) {
    const error = new Error("Invalid direction. Must be 'up' or 'down'.");
    error.statusCode = 400;
    throw error;
  }

  // First ensure positions are consistent
  await reindexWaitingTokens(queueId, managerId);

  const token = await Token.findOne({
    _id: tokenId,
    queue: queueId,
    manager: managerId,
    status: 'waiting',
  });

  if (!token) {
    const error = new Error('Waiting token not found');
    error.statusCode = 404;
    throw error;
  }

  const currentPos = token.position;

  if (direction === 'up') {
    if (currentPos <= 1) {
      const error = new Error('Token is already at the first position');
      error.statusCode = 400;
      throw error;
    }

    const neighborToken = await Token.findOne({
      queue: queueId,
      manager: managerId,
      status: 'waiting',
      position: currentPos - 1,
    });

    if (neighborToken) {
      neighborToken.position = currentPos;
      token.position = currentPos - 1;
      await Promise.all([neighborToken.save(), token.save()]);
    }
  } else if (direction === 'down') {
    const maxPosToken = await Token.findOne({
      queue: queueId,
      manager: managerId,
      status: 'waiting',
    }).sort({ position: -1 });

    if (!maxPosToken || currentPos >= maxPosToken.position) {
      const error = new Error('Token is already at the last position');
      error.statusCode = 400;
      throw error;
    }

    const neighborToken = await Token.findOne({
      queue: queueId,
      manager: managerId,
      status: 'waiting',
      position: currentPos + 1,
    });

    if (neighborToken) {
      neighborToken.position = currentPos;
      token.position = currentPos + 1;
      await Promise.all([neighborToken.save(), token.save()]);
    }
  }

  return token;
};

/**
 * Cancel a waiting or serving token
 */
const cancelToken = async (queueId, managerId, tokenId) => {
  const token = await Token.findOne({
    _id: tokenId,
    queue: queueId,
    manager: managerId,
  });

  if (!token) {
    const error = new Error('Token not found');
    error.statusCode = 404;
    throw error;
  }

  if (token.status === 'completed') {
    const error = new Error('Cannot cancel a completed token');
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = token.status;
  token.status = 'cancelled';
  token.cancelledAt = new Date();
  token.position = 0;
  await token.save();

  // If it was the serving token, clear queue currentServing
  if (previousStatus === 'serving') {
    await Queue.updateOne(
      { _id: queueId, manager: managerId, currentServing: token._id },
      { $set: { currentServing: null } }
    );
  } else if (previousStatus === 'waiting') {
    // Reindex remaining waiting tokens
    await reindexWaitingTokens(queueId, managerId);
  }

  return token;
};

module.exports = {
  reindexWaitingTokens,
  generateToken,
  assignNextToken,
  completeServingToken,
  moveTokenPosition,
  cancelToken,
};
