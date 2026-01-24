const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

// Get inventory logs for product
router.get('/logs/:productId', inventoryController.getInventoryLogs);

// Get inventory summary
router.get('/summary', inventoryController.getInventorySummary);

// Adjust inventory
router.post('/adjust/:productId', auth, inventoryController.adjustInventory);

// Get inventory history for date range
router.get('/history/:productId', inventoryController.getInventoryHistory);

module.exports = router;
