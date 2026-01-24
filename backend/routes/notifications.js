const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Get user notifications
router.get('/user/:userId', auth, notificationController.getUserNotifications);

// Mark notification as read
router.patch('/:notificationId/read', auth, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/user/:userId/read-all', auth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', auth, notificationController.deleteNotification);

// Clear old notifications (admin)
router.delete('/admin/clear-old', auth, notificationController.clearOldNotifications);

module.exports = router;
