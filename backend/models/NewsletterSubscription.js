const mongoose = require('mongoose');

const NewsletterSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firstName: String,
  lastName: String,
  categories: {
    type: [String],
    enum: ['promotions', 'new_products', 'deals', 'tips', 'announcements'],
    default: ['promotions', 'deals']
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  lastEmailSent: Date,
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  },
  source: {
    type: String,
    enum: ['website', 'mobile', 'social', 'admin'],
    default: 'website'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
NewsletterSubscriptionSchema.index({ email: 1 });
NewsletterSubscriptionSchema.index({ isActive: 1, isVerified: 1 });

module.exports = mongoose.model('NewsletterSubscription', NewsletterSubscriptionSchema);
