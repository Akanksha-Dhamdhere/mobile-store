const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

// Get user activity logs
router.get('/user/:userId', auth, activityController.getUserActivityLogs);

// Get activity analytics
router.get('/analytics', auth, activityController.getActivityAnalytics);

// Get user's view history
router.get('/history/:userId', auth, activityController.getUserViewHistory);

// Get activity dashboard (admin)
router.get('/dashboard', auth, activityController.getActivityDashboard);

// Delete old activity logs
router.delete('/cleanup', auth, activityController.deleteOldActivityLogs);

module.exports = router;
