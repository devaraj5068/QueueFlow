const analyticsService = require('../services/analyticsService');

/**
 * @desc    Get overall KPI metrics (avg wait time, waiting, served, cancelled)
 * @route   GET /api/analytics
 * @access  Private
 */
const getKpiMetrics = async (req, res, next) => {
  try {
    const { filter = '7days', startDate, endDate } = req.query;

    const metrics = await analyticsService.getKpiMetrics(
      req.manager._id,
      filter,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get queue performance breakdown for bar chart
 * @route   GET /api/analytics/queues
 * @access  Private
 */
const getQueueBreakdown = async (req, res, next) => {
  try {
    const { filter = '7days', startDate, endDate } = req.query;

    const breakdown = await analyticsService.getQueueBreakdown(
      req.manager._id,
      filter,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      count: breakdown.length,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get hourly token arrival distribution for line chart
 * @route   GET /api/analytics/hourly
 * @access  Private
 */
const getHourlyArrivals = async (req, res, next) => {
  try {
    const { filter = 'today', startDate, endDate } = req.query;

    const hourly = await analyticsService.getHourlyArrivals(
      req.manager._id,
      filter,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      data: hourly,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKpiMetrics,
  getQueueBreakdown,
  getHourlyArrivals,
};
