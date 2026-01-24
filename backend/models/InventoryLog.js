const mongoose = require('mongoose');

const InventoryLogSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  action: {
    type: String,
    enum: ['add', 'remove', 'sold', 'return', 'adjustment', 'damage', 'restock'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: Number,
  newQuantity: Number,
  reason: String,
  reference: {
    type: String, // e.g., order ID, purchase receipt
    ref: 'Order'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries
InventoryLogSchema.index({ productId: 1, createdAt: -1 });
InventoryLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', InventoryLogSchema);
