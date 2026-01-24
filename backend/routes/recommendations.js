const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// Get personalized recommendations for user
router.get('/personalized/:userId', recommendationController.getPersonalizedRecommendations);

// Get similar products
router.get('/similar/:productId', recommendationController.getSimilarProducts);

// Get trending products
router.get('/trending', recommendationController.getTrendingProducts);

// Get best sellers
router.get('/bestsellers', recommendationController.getBestSellers);

// Track recommendation click
router.post('/:recommendationId/click', recommendationController.trackRecommendationClick);

module.exports = router;
