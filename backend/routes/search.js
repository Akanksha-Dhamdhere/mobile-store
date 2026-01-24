const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Advanced product search with filters
router.get('/products', searchController.searchProducts);

// Get available search filters
router.get('/filters', searchController.getSearchFilters);

// Global search across products and accessories
router.get('/global', searchController.globalSearch);

module.exports = router;
