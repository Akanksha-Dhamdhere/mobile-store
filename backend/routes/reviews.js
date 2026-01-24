
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const UserReview = require('../models/UserReview');

// Add a review to a product, accessory, or as a user review
router.post('/', async (req, res) => {
  try {
    const { type, productId, accessoryId, name, rating, description, text, userName, userEmail, date } = req.body;
    // User review (not tied to product/accessory)
    if (!productId && !accessoryId) {
      if (!name || !(description || text) || !rating) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      const userReview = new UserReview({
        name,
        text: text || description,
        rating,
        date: date ? new Date(date) : new Date(),
      });
      await userReview.save();
      return res.json({ success: true, data: userReview });
    }
    // Product or accessory review
    let model, idField, idValue;
    if (type === 'Product' && productId) {
      model = Product;
      idField = '_id';
      idValue = productId;
    } else if (type === 'Accessory' && accessoryId) {
      model = Accessory;
      idField = '_id';
      idValue = accessoryId;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type or id' });
    }
    const review = {
      user: userEmail || 'Anonymous',
      value: rating,
      review: description,
      name: userName || name || 'User',
      createdAt: date ? new Date(date) : new Date(),
    };
    const doc = await model.findByIdAndUpdate(
      idValue,
      { $push: { reviews: review } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all reviews for all products, accessories, and user reviews
router.get('/', async (req, res) => {
  try {
    // Get all product reviews
    const products = await Product.find({}, 'name reviews');
    const accessories = await Accessory.find({}, 'name reviews');
    const userReviews = await UserReview.find({});
    const productReviews = products.flatMap(p => (p.reviews || []).map(r => ({
      type: 'Product',
      productId: p._id,
      name: p.name,
      ...r
    })));
    const accessoryReviews = accessories.flatMap(a => (a.reviews || []).map(r => ({
      type: 'Accessory',
      accessoryId: a._id,
      name: a.name,
      ...r
    })));
    // User reviews: add a type for clarity
    const userReviewList = userReviews.map(r => ({
      type: 'User',
      id: r._id,
      _id: r._id,
      name: r.name,
      text: r.text,
      rating: r.rating,
      avatar: r.avatar,
      date: r.date,
    }));

    res.json({ success: true, data: [...userReviewList, ...productReviews, ...accessoryReviews] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a user review by id
router.delete('/user/:id', async (req, res) => {
  try {
    const deleted = await UserReview.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User review not found' });
    return res.json({ success: true, message: 'User review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a review from a product (embedded review)
router.delete('/product/:productId/:reviewId', async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const updated = await Product.findByIdAndUpdate(productId, { $pull: { reviews: { _id: reviewId } } }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Product or review not found' });
    return res.json({ success: true, message: 'Product review deleted', data: updated.reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a review from an accessory (embedded review)
router.delete('/accessory/:accessoryId/:reviewId', async (req, res) => {
  try {
    const { accessoryId, reviewId } = req.params;
    const updated = await Accessory.findByIdAndUpdate(accessoryId, { $pull: { reviews: { _id: reviewId } } }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Accessory or review not found' });
    return res.json({ success: true, message: 'Accessory review deleted', data: updated.reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
