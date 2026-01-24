const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const auth = require('../middleware/auth');

// Public routes
router.post('/subscribe', newsletterController.subscribeNewsletter);
router.post('/unsubscribe', newsletterController.unsubscribeNewsletter);
router.get('/preferences/:email', newsletterController.getSubscriberPreferences);
router.put('/preferences/:email', newsletterController.updateSubscriberPreferences);

// Admin routes
router.get('/subscribers', auth, newsletterController.getAllSubscribers);
router.post('/campaigns', auth, newsletterController.createCampaign);
router.get('/campaigns', auth, newsletterController.getCampaigns);
router.post('/campaigns/:campaignId/send', auth, newsletterController.sendCampaign);
router.get('/stats', auth, newsletterController.getNewsletterStats);

module.exports = router;
