const mongoose = require('mongoose');

const ProductRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  baseProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  recommendedProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['similar', 'category', 'bestseller', 'trending', 'personalized'],
    default: 'similar'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  reason: String,
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  clickedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries
ProductRecommendationSchema.index({ userId: 1, createdAt: -1 });
ProductRecommendationSchema.index({ baseProductId: 1, type: 1 });

module.exports = mongoose.model('ProductRecommendation', ProductRecommendationSchema);
