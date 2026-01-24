const express = require('express');
const router = express.Router();
const accessoryController = require('../controllers/accessoryController');
const auth = require('../middleware/auth');

// Get all accessories (public)
router.get('/', accessoryController.getAllAccessories);

// Get single accessory (public)
router.get('/:id', accessoryController.getAccessoryById);

// Add accessory (admin only - requires authentication)
router.post('/', auth, accessoryController.addAccessory);

// Update accessory (admin only - requires authentication)
router.put('/:id', auth, accessoryController.updateAccessory);

// Delete accessory (admin only - requires authentication)
router.delete('/:id', auth, accessoryController.deleteAccessory);

// Add review to accessory (authenticated users only)
router.post('/:id/reviews', auth, accessoryController.addReview);

// Rate accessory (authenticated users only)
router.post('/:id/rate', auth, accessoryController.rateAccessory);

module.exports = router;
