const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const User = require('../models/User');

// Remove from wishlist (supports both Product and Accessory)
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId, model } = req.body;
    if (!productId || !model) return res.status(400).json({ success: false, message: 'Product ID and model required' });
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    console.log('removeFromWishlist called with:', { productId, model });
    console.log('User wishlist before:', JSON.stringify(user.wishlist));
    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(item => {
      // Use equals() for ObjectId comparison
      const match = item.item && item.item.equals(productId) && item.model === model;
      if (match) console.log('Removing wishlist item:', item);
      return !match;
    });
    if (user.wishlist.length === initialLength) {
      console.log('No matching item found to remove.');
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }
    await user.save();
    console.log('User wishlist after:', JSON.stringify(user.wishlist));
    res.json({ success: true, message: 'Removed from wishlist', data: user.wishlist });
  } catch (err) {
    console.error('Error in removeFromWishlist:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId, model } = req.body;
    console.log('addToWishlist called, user:', req.user && req.user.email, 'userId:', req.user && req.user._id, 'productId:', productId, 'model:', model);
    if (!productId || !model) return res.status(400).json({ success: false, message: 'Product ID and model required' });

    // Validate model and existence
    let product = null;
    if (model === 'Product') {
      product = await Product.findById(productId);
    } else if (model === 'Accessory') {
      product = await Accessory.findById(productId);
    }
    if (!product) return res.status(404).json({ success: false, message: 'Product/Accessory not found' });

    const user = req.user;
    if (!user) {
      console.log('No user found in addToWishlist');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    // Use equals() for ObjectId comparison
    if (user.wishlist.some(w => w.item && w.item.equals(productId) && w.model === model)) {
      return res.json({ success: true, message: 'Already in wishlist', data: user.wishlist });
    }
    user.wishlist.push({ item: productId, model });
    await user.save();
    res.json({ success: true, message: 'Added to wishlist', data: user.wishlist });
  } catch (err) {
    console.error('Error in addToWishlist:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('wishlist.item'); // Use refPath in schema
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Return populated wishlist items as flat array
    const populatedWishlist = user.wishlist.map(w => {
      // Handle both new and legacy formats
      if (w && w.item) {
        const item = w.item && w.item.toObject ? w.item.toObject() : w.item;
        return {
          ...item,
          _wishlistModel: w.model || (item && item.category ? 'Product' : 'Accessory')
        };
      } else if (w && w.toObject) {
        // Legacy: just ObjectId
        return w.toObject();
      } else {
        return w;
      }
    });
    res.json({ success: true, message: 'Wishlist fetched', data: populatedWishlist });
  } catch (err) {
    console.error('Error in getWishlist:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
