const Product = require('../models/Product');
const Accessory = require('../models/Accessory');

// Advanced product search with multiple filters
exports.searchProducts = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      minPrice, 
      maxPrice, 
      minRating, 
      sort = '-createdAt',
      page = 1,
      limit = 20 
    } = req.query;

    let filter = { status: 'active' };

    // Search by name or description
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available filters (categories, price range, etc.)
exports.getSearchFilters = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { status: 'active' });
    
    const priceRange = await Product.aggregate([
      { $match: { status: 'active' } },
      { 
        $group: { 
          _id: null, 
          minPrice: { $min: '$price' }, 
          maxPrice: { $max: '$price' } 
        } 
      }
    ]);

    const ratings = await Product.distinct('averageRating', { status: 'active' });

    res.json({
      success: true,
      filters: {
        categories: categories.filter(c => c),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
        ratings: ratings.sort((a, b) => a - b)
      }
    });
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Search both products and accessories
exports.globalSearch = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchRegex = { $regex: query, $options: 'i' };

    const [products, accessories] = await Promise.all([
      Product.find(
        { 
          status: 'active',
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        },
        { name: 1, price: 1, image: 1, category: 1 }
      ).limit(parseInt(limit) / 2),
      Accessory.find(
        { 
          status: 'active',
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        },
        { name: 1, price: 1, image: 1, category: 1 }
      ).limit(parseInt(limit) / 2)
    ]);

    res.json({
      success: true,
      data: {
        products,
        accessories,
        total: products.length + accessories.length
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
