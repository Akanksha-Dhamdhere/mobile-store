const mongoose = require('mongoose');

const NewsletterCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  htmlContent: String,
  categories: {
    type: [String],
    enum: ['promotions', 'new_products', 'deals', 'tips', 'announcements'],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft'
  },
  scheduledFor: Date,
  sentAt: Date,
  recipientCount: {
    type: Number,
    default: 0
  },
  openCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  unsubscribeCount: {
    type: Number,
    default: 0
  },
  bounceCount: {
    type: Number,
    default: 0
  },
  featuredProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NewsletterCampaign', NewsletterCampaignSchema);
