const express = require('express');
const router = express.Router();
const {
  getQueues,
  createQueue,
  getQueueById,
  updateQueue,
  deleteQueue,
} = require('../controllers/queueController');
const tokenRoutes = require('./tokenRoutes');
const { protect } = require('../middleware/authMiddleware');
const { validateQueue } = require('../middleware/validationMiddleware');

// All queue routes are protected
router.use(protect);

// Nested token routes: /api/queues/:queueId/tokens
router.use('/:queueId/tokens', tokenRoutes);

router.route('/')
  .get(getQueues)
  .post(validateQueue, createQueue);

router.route('/:queueId')
  .get(getQueueById)
  .patch(validateQueue, updateQueue)
  .delete(deleteQueue);

module.exports = router;
