const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductRecommendation = require('../models/ProductRecommendation');
const User = require('../models/User');

// Get personalized recommendations for user
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user's purchase history
    const userOrders = await Order.find({ userId }).select('items');
    const purchasedCategories = new Set();
    const purchasedProducts = new Set();

    userOrders.forEach(order => {
      order.items?.forEach(item => {
        purchasedCategories.add(item.category);
        purchasedProducts.add(item.productId?.toString());
      });
    });

    // Find products in similar categories, excluding purchased ones
    const recommendations = await Product.find({
      $or: [
        { category: { $in: Array.from(purchasedCategories) } },
        { averageRating: { $gte: 4 } } // Also include highly rated products
      ],
      _id: { $nin: Array.from(purchasedProducts) },
      status: 'active'
    })
      .sort({ averageRating: -1, soldCount: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: recommendations,
      reason: 'Based on your purchase history'
    });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get similar products
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Find similar products by category and price range
    const similarProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category,
      price: {
        $gte: product.price * 0.7,
        $lte: product.price * 1.3
      },
      status: 'active'
    })
      .sort({ averageRating: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: similarProducts,
      reason: 'Similar products in ' + product.category
    });
  } catch (error) {
    console.error('Similar products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get trending products
exports.getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trendingProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { 
        $group: {
          _id: '$items.productId',
          count: { $sum: '$items.quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      }
    ]);

    const products = trendingProducts
      .map(item => item.productDetails[0])
      .filter(p => p && p.status === 'active');

    res.json({
      success: true,
      data: products,
      reason: `Trending in last ${days} days`
    });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get best sellers
exports.getBestSellers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const bestSellers = await Product.find({ status: 'active' })
      .sort({ soldCount: -1, averageRating: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: bestSellers,
      reason: 'Best selling products'
    });
  } catch (error) {
    console.error('Best sellers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Track recommendation click (for analytics)
exports.trackRecommendationClick = async (req, res) => {
  try {
    const { recommendationId } = req.params;

    await ProductRecommendation.findByIdAndUpdate(
      recommendationId,
      {
        $inc: { clickCount: 1 },
        clickedAt: new Date()
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
