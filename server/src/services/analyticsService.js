const mongoose = require('mongoose');
const Token = require('../models/Token');
const Queue = require('../models/Queue');

/**
 * Build date range query filter based on range param or custom dates
 */
const buildDateFilter = (filterType, startDate, endDate) => {
  const now = new Date();
  let start;
  let end = new Date(now);

  switch (filterType) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case '7days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (startDate) {
        start = new Date(startDate);
        if (endDate) {
          end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }
      } else {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      break;
    default:
      // Default to last 7 days
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    $gte: start,
    $lte: end,
  };
};

/**
 * Get core KPI metrics for a manager across all queues
 */
const getKpiMetrics = async (managerId, filterType = '7days', startDate, endDate) => {
  const dateQuery = buildDateFilter(filterType, startDate, endDate);

  // Match manager and date window on joinedAt
  const baseMatch = {
    manager: new mongoose.Types.ObjectId(managerId),
    joinedAt: dateQuery,
  };

  // Status counts within the window
  const statusCounts = await Token.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  let totalWaiting = 0;
  let totalServing = 0;
  let totalCompleted = 0;
  let totalCancelled = 0;

  statusCounts.forEach((sc) => {
    if (sc._id === 'waiting') totalWaiting = sc.count;
    else if (sc._id === 'serving') totalServing = sc.count;
    else if (sc._id === 'completed') totalCompleted = sc.count;
    else if (sc._id === 'cancelled') totalCancelled = sc.count;
  });

  const totalServed = totalCompleted + totalServing;

  // Also query live currently waiting (independent of joinedAt window to show real-time operational status)
  const liveWaiting = await Token.countDocuments({
    manager: managerId,
    status: 'waiting',
  });

  // Calculate Average Wait Time: Sum of (servedAt - joinedAt) / Number of tokens assigned for service
  // Tokens assigned for service have a valid servedAt and joinedAt
  const waitTimeAggregation = await Token.aggregate([
    {
      $match: {
        manager: new mongoose.Types.ObjectId(managerId),
        joinedAt: dateQuery,
        servedAt: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        waitDurationMs: { $subtract: ['$servedAt', '$joinedAt'] },
      },
    },
    {
      $match: {
        waitDurationMs: { $gte: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totalWaitMs: { $sum: '$waitDurationMs' },
        servedCount: { $sum: 1 },
      },
    },
  ]);

  let avgWaitMinutes = 0;
  let totalTokensServedWithTime = 0;

  if (waitTimeAggregation.length > 0 && waitTimeAggregation[0].servedCount > 0) {
    const { totalWaitMs, servedCount } = waitTimeAggregation[0];
    totalTokensServedWithTime = servedCount;
    // convert ms to minutes, round to 1 decimal place
    avgWaitMinutes = parseFloat((totalWaitMs / servedCount / (1000 * 60)).toFixed(1));
  }

  return {
    averageWaitTimeMinutes: avgWaitMinutes,
    averageWaitTimeNote: 'Average duration (in minutes) from customer arrival to service counter assignment.',
    totalCurrentlyWaiting: liveWaiting,
    totalWaitingInPeriod: totalWaiting,
    totalServed,
    totalCancelled,
    totalCreated: totalWaiting + totalServed + totalCancelled,
    tokensSampledForWaitTime: totalTokensServedWithTime,
  };
};

/**
 * Get breakdown of tokens per queue (waiting, served, cancelled)
 */
const getQueueBreakdown = async (managerId, filterType = '7days', startDate, endDate) => {
  const dateQuery = buildDateFilter(filterType, startDate, endDate);

  // Fetch all queues for this manager first to ensure zero-count queues are included
  const managerQueues = await Queue.find({ manager: managerId, isActive: true }).select('name prefix');

  const aggregation = await Token.aggregate([
    {
      $match: {
        manager: new mongoose.Types.ObjectId(managerId),
        joinedAt: dateQuery,
      },
    },
    {
      $group: {
        _id: {
          queue: '$queue',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Map to structured format
  const queueMap = {};
  managerQueues.forEach((q) => {
    queueMap[q._id.toString()] = {
      queueId: q._id,
      name: q.name,
      prefix: q.prefix,
      waiting: 0,
      served: 0,
      cancelled: 0,
      total: 0,
    };
  });

  aggregation.forEach((item) => {
    const qId = item._id.queue ? item._id.queue.toString() : null;
    if (qId && queueMap[qId]) {
      const status = item._id.status;
      if (status === 'waiting') {
        queueMap[qId].waiting += item.count;
      } else if (status === 'serving' || status === 'completed') {
        queueMap[qId].served += item.count;
      } else if (status === 'cancelled') {
        queueMap[qId].cancelled += item.count;
      }
      queueMap[qId].total += item.count;
    }
  });

  return Object.values(queueMap);
};

/**
 * Get hourly token arrival distribution over the last 24 hours (or selected day)
 */
const getHourlyArrivals = async (managerId, filterType = 'today', startDate, endDate) => {
  let start;
  let end = new Date();

  if (filterType === 'today') {
    start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
  } else if (filterType === 'last24h') {
    start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  } else {
    // Default to last 24 hours
    start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  }

  const aggregation = await Token.aggregate([
    {
      $match: {
        manager: new mongoose.Types.ObjectId(managerId),
        joinedAt: { $gte: start, $lte: end },
      },
    },
    {
      $project: {
        hour: { $hour: { date: '$joinedAt', timezone: '+00:00' } }, // Can be localized or standardized UTC/local
      },
    },
    {
      $group: {
        _id: '$hour',
        arrivals: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Populate all 24 hours (00:00 to 23:00) so the chart is smooth and complete
  const hourCounts = {};
  aggregation.forEach((item) => {
    hourCounts[item._id] = item.arrivals;
  });

  const hourlyData = [];
  for (let h = 0; h < 24; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    hourlyData.push({
      hour: h,
      time: label,
      arrivals: hourCounts[h] || 0,
    });
  }

  return hourlyData;
};

module.exports = {
  buildDateFilter,
  getKpiMetrics,
  getQueueBreakdown,
  getHourlyArrivals,
};
