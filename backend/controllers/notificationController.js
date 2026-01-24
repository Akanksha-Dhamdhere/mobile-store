const Notification = require('../models/Notification');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create notification (internal use)
exports.createNotification = async (userId, type, title, message, options = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      link: options.link,
      data: options.data,
      priority: options.priority || 'medium',
      expiresAt: options.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    });

    return await notification.save();
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Clear old notifications
exports.clearOldNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days old
    });

    res.json({
      success: true,
      message: 'Old notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
