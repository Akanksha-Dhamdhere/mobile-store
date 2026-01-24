const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    enum: [
      'login',
      'logout',
      'view_product',
      'add_to_cart',
      'remove_from_cart',
      'add_to_wishlist',
      'remove_from_wishlist',
      'checkout',
      'purchase',
      'review_product',
      'search',
      'update_profile',
      'change_password',
      'admin_access'
    ],
    required: true
  },
  entityType: {
    type: String,
    enum: ['product', 'order', 'user', 'cart', 'wishlist', 'review', 'system'],
    default: 'system'
  },
  entityId: mongoose.Schema.Types.ObjectId,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
