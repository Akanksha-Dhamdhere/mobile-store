const Accessory = require('../models/Accessory');

// Add a review to an accessory (for POST /api/accessories/:id/reviews)
exports.addReview = async (req, res) => {
  try {
    // Validate authentication - user must be logged in
    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { value, review, avatar } = req.body;
    
    // Validate inputs
    if (typeof value !== 'number' || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'Rating value must be between 1 and 5' });
    }
    
    if (!review || typeof review !== 'string' || review.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Review text is required' });
    }

    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ success: false, message: 'Accessory not found' });
    }

    accessory.reviews = accessory.reviews || [];
    
    // Prevent duplicate reviews by same user
    const userEmail = req.user.email;
    const existing = accessory.reviews.find(r => r.user === userEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this accessory' });
    }

    // Add new review with authenticated user's email
    accessory.reviews.push({ 
      user: userEmail, 
      value, 
      review: review.trim(), 
      avatar: avatar || req.user.avatar || '',
      date: new Date(),
      userId: req.userId // Store user ID for future authorization checks
    });

    await accessory.save();

    // Recalculate average rating
    const reviews = accessory.reviews;
    const ratingCount = reviews.length;
    const avgRating = ratingCount ? (reviews.reduce((sum, r) => sum + r.value, 0) / ratingCount).toFixed(2) : null;

    res.json({
      success: true,
      message: 'Review added successfully',
      data: {
        reviews,
        avgRating,
        ratingCount
      }
    });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ success: false, message: 'Failed to add review', error: err.message });
  }
};

// Controller for managing accessories
exports.getAllAccessories = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query = {
        $or: [
          { name: regex },
          { brand: regex },
          { category: regex },
          { description: regex }
        ]
      };
    }
    const accessories = await Accessory.find(query);
    const accessoriesWithRatings = accessories.map(accessory => {
      const reviews = accessory.reviews || [];
      const ratings = accessory.ratings || [];
      const allRatings = reviews.length > 0 ? reviews : ratings;
      const ratingCount = allRatings.length;
      const avgRating = ratingCount ? (allRatings.reduce((sum, r) => sum + r.value, 0) / ratingCount) : null;
      return {
        ...accessory.toObject(),
        avgRating: avgRating !== null ? Number(avgRating.toFixed(2)) : null,
        ratingCount,
      };
    });
    res.json({ success: true, message: 'Accessories fetched', data: accessoriesWithRatings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getAccessoryById = async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ success: false, message: 'Accessory not found', data: null });
    }
    
    // Calculate average rating and count (from reviews if present, else ratings)
    const reviews = accessory.reviews || [];
    const ratings = accessory.ratings || [];
    const allRatings = reviews.length > 0 ? reviews : ratings;
    const ratingCount = allRatings.length;
    const avgRating = ratingCount ? (allRatings.reduce((sum, r) => sum + r.value, 0) / ratingCount).toFixed(2) : null;
    
    const accessoryData = {
      ...accessory.toObject(),
      avgRating,
      ratingCount,
      reviews,
      images: Array.isArray(accessory.images) ? accessory.images : (accessory.image ? [accessory.image] : [])
    };
    
    res.json({
      success: true,
      message: 'Accessory fetched successfully',
      data: accessoryData
    });
  } catch (err) {
    console.error('Error fetching accessory:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null, error: err.message });
  }
};

exports.addAccessory = async (req, res) => {
  try {
    // Validate authentication - only authenticated users (preferably admins) can add accessories
    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    // Optional: Check if user is admin (if role field exists)
    if (req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can add accessories' });
    }

    const requiredFields = ['name', 'price', 'image', 'category', 'brand', 'color', 'inStock', 'stock'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === '') {
        return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
      }
    }
    const newAccessory = new Accessory({
      name: req.body.name || "",
      price: req.body.price !== undefined ? Number(req.body.price) : 0,
      image: req.body.image || "",
      images: Array.isArray(req.body.images) ? req.body.images : (req.body.image ? [req.body.image] : []),
      category: req.body.category || "",
      brand: req.body.brand || "",
      color: req.body.color || "",
      ratings: Array.isArray(req.body.ratings) ? req.body.ratings : [],
      reviews: Array.isArray(req.body.reviews) ? req.body.reviews : [],
      inStock: req.body.inStock !== undefined ? !!req.body.inStock : false,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
      isOffer: req.body.isOffer !== undefined ? !!req.body.isOffer : false,
      isBestSeller: req.body.isBestSeller !== undefined ? !!req.body.isBestSeller : false,
      badge: req.body.badge || "",
      description: req.body.description || "",
      offerPrice: req.body.offerPrice !== undefined ? Number(req.body.offerPrice) : 0,
      discountPercent: req.body.discountPercent !== undefined ? Number(req.body.discountPercent) : 0,
      freeDelivery: req.body.freeDelivery !== undefined ? !!req.body.freeDelivery : false,
      deliveryPrice: req.body.freeDelivery ? 0 : (req.body.deliveryPrice !== undefined ? Number(req.body.deliveryPrice) : 0),
      size: req.body.size || "",
      tags: req.body.tags || ""
    });
    await newAccessory.save();
    res.status(201).json({ success: true, message: 'Accessory created successfully', data: newAccessory });
  } catch (err) {
    console.error('Error adding accessory:', err);
    res.status(500).json({ success: false, message: 'Failed to create accessory', error: err.message, data: null });
  }
};

exports.updateAccessory = async (req, res) => {
  try {
    // Validate authentication - only authenticated users (preferably admins) can update accessories
    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    // Optional: Check if user is admin
    if (req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can update accessories' });
    }

    const updateData = {
      name: req.body.name || "",
      price: req.body.price !== undefined ? Number(req.body.price) : 0,
      image: req.body.image || "",
      images: Array.isArray(req.body.images) ? req.body.images : (req.body.image ? [req.body.image] : []),
      category: req.body.category || "",
      brand: req.body.brand || "",
      color: req.body.color || "",
      ratings: Array.isArray(req.body.ratings) ? req.body.ratings : [],
      reviews: Array.isArray(req.body.reviews) ? req.body.reviews : [],
      inStock: req.body.inStock !== undefined ? !!req.body.inStock : false,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
      isOffer: req.body.isOffer !== undefined ? !!req.body.isOffer : false,
      isBestSeller: req.body.isBestSeller !== undefined ? !!req.body.isBestSeller : false,
      badge: req.body.badge || "",
      description: req.body.description || "",
      offerPrice: req.body.offerPrice !== undefined ? Number(req.body.offerPrice) : 0,
      discountPercent: req.body.discountPercent !== undefined ? Number(req.body.discountPercent) : 0,
      freeDelivery: req.body.freeDelivery !== undefined ? !!req.body.freeDelivery : false,
      deliveryPrice: req.body.freeDelivery ? 0 : (req.body.deliveryPrice !== undefined ? Number(req.body.deliveryPrice) : 0),
      size: req.body.size || "",
      tags: req.body.tags || ""
    };
    const updated = await Accessory.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Accessory not found' });
    }
    res.json({ success: true, message: 'Accessory updated successfully', data: updated });
  } catch (err) {
    console.error('Error updating accessory:', err);
    res.status(500).json({ success: false, message: 'Failed to update accessory', error: err.message, data: null });
  }
};

exports.deleteAccessory = async (req, res) => {
  try {
    // Validate authentication - only authenticated users (preferably admins) can delete accessories
    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    // Optional: Check if user is admin
    if (req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can delete accessories' });
    }

    const deleted = await Accessory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Accessory not found' });
    }
    res.json({ success: true, message: 'Accessory deleted successfully' });
  } catch (err) {
    console.error('Error deleting accessory:', err);
    res.status(500).json({ success: false, message: 'Failed to delete accessory', error: err.message });
  }
};

exports.rateAccessory = async (req, res) => {
  try {
    // Validate authentication - user must be logged in
    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { value, review, avatar } = req.body;
    
    // Validate rating value
    if (typeof value !== 'number' || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'Rating value must be between 1 and 5' });
    }

    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ success: false, message: 'Accessory not found' });
    }

    accessory.ratings = accessory.ratings || [];
    accessory.reviews = accessory.reviews || [];

    const userEmail = req.user.email;
    
    // Check if user has already rated
    const existingRating = accessory.ratings.find(r => r.user === userEmail);
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already rated this accessory' });
    }

    // Check if user has already reviewed
    const existingReview = accessory.reviews.find(r => r.user === userEmail);
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this accessory' });
    }

    // Add rating
    accessory.ratings.push({ user: userEmail, value });

    // Optionally add review if provided
    if (review && typeof review === 'string' && review.trim().length > 0) {
      accessory.reviews.push({ 
        user: userEmail, 
        value, 
        review: review.trim(), 
        avatar: avatar || req.user.avatar || '',
        userId: req.userId,
        createdAt: new Date()
      });
    }

    await accessory.save();

    // Recalculate ratings
    const allReviews = accessory.reviews;
    const allRatings = accessory.ratings;
    const ratingCount = allReviews.length > 0 ? allReviews.length : allRatings.length;
    const avgRating = ratingCount ? (
      allReviews.length > 0 
        ? allReviews.reduce((sum, r) => sum + r.value, 0) / allReviews.length
        : allRatings.reduce((sum, r) => sum + r.value, 0) / allRatings.length
    ).toFixed(2) : null;

    res.json({ 
      success: true, 
      message: 'Rating submitted successfully',
      data: {
        reviews: allReviews,
        ratings: allRatings,
        avgRating,
        ratingCount
      }
    });
  } catch (err) {
    console.error('Error rating accessory:', err);
    res.status(500).json({ success: false, message: 'Failed to rate accessory', error: err.message });
  }
};

