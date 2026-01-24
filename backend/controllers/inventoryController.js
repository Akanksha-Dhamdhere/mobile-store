const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

// Log inventory change
exports.logInventoryChange = async (productId, action, quantity, options = {}) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const previousQuantity = product.stock;
    let newQuantity = previousQuantity;

    // Update product stock
    if (action === 'add' || action === 'restock') {
      newQuantity = previousQuantity + quantity;
    } else if (action === 'remove' || action === 'sold') {
      newQuantity = Math.max(0, previousQuantity - quantity);
    } else if (action === 'return') {
      newQuantity = previousQuantity + quantity;
    }

    // Create inventory log
    const log = new InventoryLog({
      productId,
      action,
      quantity,
      previousQuantity,
      newQuantity,
      reason: options.reason,
      reference: options.reference,
      performedBy: options.performedBy,
      notes: options.notes
    });

    await log.save();

    // Update product stock (if tracking stock in Product model)
    if (product.stock !== undefined) {
      product.stock = newQuantity;
      await product.save();
    }

    return log;
  } catch (error) {
    console.error('Log inventory change error:', error);
    throw error;
  }
};

// Get inventory logs for product
exports.getInventoryLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 50, action } = req.query;

    let filter = { productId };
    if (action) {
      filter.action = action;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      InventoryLog.find(filter)
        .populate('productId', 'name')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      InventoryLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get inventory logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get inventory summary for all products
exports.getInventorySummary = async (req, res) => {
  try {
    const { lowStockThreshold = 10 } = req.query;

    const summary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          lowStockProducts: {
            $sum: {
              $cond: [{ $lt: ['$stock', parseInt(lowStockThreshold)] }, 1, 0]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const lowStockProducts = await Product.find({
      stock: { $lt: parseInt(lowStockThreshold), $gt: 0 }
    }).select('name stock sku');

    const outOfStockProducts = await Product.find({ stock: 0 }).select('name sku');

    res.json({
      success: true,
      data: {
        summary: summary[0] || {},
        lowStockProducts,
        outOfStockProducts
      }
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Adjust inventory
exports.adjustInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reason, notes } = req.body;

    if (!quantity || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quantity and reason are required' 
      });
    }

    const log = await this.logInventoryChange(productId, 'adjustment', quantity, {
      reason,
      notes,
      performedBy: req.user?.id
    });

    res.json({
      success: true,
      data: log,
      message: 'Inventory adjusted successfully'
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get inventory history for date range
exports.getInventoryHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    let filter = { productId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const history = await InventoryLog.find(filter)
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email');

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
