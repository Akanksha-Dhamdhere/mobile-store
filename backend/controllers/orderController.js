const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const { createBillForOrder } = require('../utils/bill');


// Cancel order (user)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Only allow user to cancel their own order, or admin
    if (String(order.user) !== String(req.userId)) {
      // Optionally, check if admin
      // If you want to allow admin to cancel, add admin check here
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order already cancelled' });
    }
    order.status = 'Cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// Delete order (user)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Only allow user to delete their own order, or admin
    if (String(order.user) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this order' });
    }
    
    // Only allow deletion of cancelled or delivered orders
    if (order.status !== 'Cancelled' && order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Can only delete cancelled or delivered orders' });
    }
    
    // Delete the order from database
    await Order.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
// Update order status and delivery date (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryDate } = req.body;
    const update = {};
    if (status) update.status = status;
    if (deliveryDate) update.deliveryDate = deliveryDate;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
  ).populate('user', 'email name').populate('items.product', 'name price image category brand');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order updated', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    // Return all orders only for admins; regular users should only see their own orders
    const user = await User.findById(req.userId).select('role');
    let ordersQuery;
    if (user && user.role === 'admin') {
      ordersQuery = Order.find();
    } else {
      ordersQuery = Order.find({ user: req.userId });
    }

    const orders = await ordersQuery
      .populate('user', 'email name')
      .populate('bill')
      .populate('items.product', 'name price image category brand');

    res.json({ success: true, message: 'Orders fetched', data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('bill')
      .populate('user', 'email name')
      .populate('items.product', 'name price image category brand');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order fetched', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { items, total, address, paymentInfo } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items required' });
    }

    // Reduce stock for each item (product or accessory)
    for (const item of items) {
      // If productType is provided, use it. Otherwise, try to detect by checking Product/Accessory collections.
      let isAccessory = false;
      if (item.productType === 'accessory') {
        isAccessory = true;
      } else if (item.productType === 'product') {
        isAccessory = false;
      } else {
        // Try to detect by checking existence in Product/Accessory
        const prod = await Product.findById(item.product);
        if (!prod) {
          const acc = await Accessory.findById(item.product);
          if (acc) isAccessory = true;
        }
      }
      if (isAccessory) {
        await Accessory.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    // Always use the authenticated user for the order
    // Fetch user email
    const user = req.user || (await User.findById(req.userId));
    const userEmail = user && user.email ? user.email : '';
    const order = await Order.create({ user: req.userId, userEmail, items, total, address, paymentInfo, status: 'Processing' });
    
    // Automatically generate a bill for the order
    try {
      await createBillForOrder(order._id, req.userId, order);
    } catch (billError) {
      console.error('Error creating bill for order', order._id, billError && billError.stack ? billError.stack : billError);
      // Don't fail the order if bill creation fails
    }
    
    res.status(201).json({ success: true, message: 'Order placed', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
