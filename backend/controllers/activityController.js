const ActivityLog = require('../models/ActivityLog');

// Helper function to log activity
exports.logActivity = async (userId, action, options = {}, req = null) => {
  try {
    const activity = new ActivityLog({
      userId,
      action,
      entityType: options.entityType || 'system',
      entityId: options.entityId,
      metadata: options.metadata,
      ipAddress: req?.ip || options.ipAddress,
      userAgent: req?.get('user-agent') || options.userAgent,
      status: options.status || 'success',
      errorMessage: options.errorMessage
    });

    return await activity.save();
  } catch (error) {
    console.error('Log activity error:', error);
  }
};

// Get user activity logs
exports.getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, action, startDate, endDate } = req.query;

    let filter = { userId };

    if (action) {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'name email')
        .populate('entityId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get activity analytics
exports.getActivityAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [actionStats, userStats, hourlyStats] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        actionStats,
        topUsers: userStats,
        hourlyStats,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Get activity analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user's most viewed products
exports.getUserViewHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const viewedProducts = await ActivityLog.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          action: 'view_product'
        }
      },
      { $group: { _id: '$entityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      }
    ]);

    res.json({
      success: true,
      data: viewedProducts
    });
  } catch (error) {
    console.error('Get view history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get activity dashboard (admin)
exports.getActivityDashboard = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalActivities, loginCount, purchaseCount, successRate] = await Promise.all([
      ActivityLog.countDocuments({ createdAt: { $gte: startDate } }),
      ActivityLog.countDocuments({ 
        action: 'login', 
        createdAt: { $gte: startDate } 
      }),
      ActivityLog.countDocuments({ 
        action: 'purchase', 
        createdAt: { $gte: startDate } 
      }),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const successPercentage = successRate[0] 
      ? ((successRate[0].successful / successRate[0].total) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalActivities,
        loginCount,
        purchaseCount,
        successRate: successPercentage + '%',
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Get activity dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete old activity logs (cleanup)
exports.deleteOldActivityLogs = async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} activity logs older than ${days} days`
    });
  } catch (error) {
    console.error('Delete activity logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
