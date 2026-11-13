const express = require('express');
const router = express.Router();
const {
  getKpiMetrics,
  getQueueBreakdown,
  getHourlyArrivals,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getKpiMetrics);
router.get('/queues', getQueueBreakdown);
router.get('/hourly', getHourlyArrivals);

module.exports = router;
