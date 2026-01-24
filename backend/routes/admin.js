const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to check admin
async function adminAuth(req, res, next) {
  try {
    // Accept token from cookie or Authorization header (Bearer)
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      console.error('adminAuth: invalid token', err && err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.userId = decoded.id;
    const user = await User.findById(req.userId).select('role');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  } catch (err) {
    console.error('adminAuth error', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Get all orders
router.get('/orders', adminAuth, async (req, res) => {
  const orders = await Order.find().populate('user', 'email name').populate('items.product', 'name price image');
  res.json({ success: true, data: orders });
});

// Update order status and delivery date
const orderController = require('../controllers/orderController');
router.put('/orders/:id', adminAuth, orderController.updateOrderStatus);

// Get all products
router.get('/products', adminAuth, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Delete a user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully', data: user });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: err.message });
  }
});

// Delete an order
router.delete('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully', data: order });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, message: 'Failed to delete order', error: err.message });
  }
});

// ========== BILL MANAGEMENT ROUTES ==========
const Bill = require('../models/Bill');
const billController = require('../controllers/billController');

// Get all bills
router.get('/bills', adminAuth, billController.getAllBills);

// Get bills statistics - MUST come before /bills/:id
router.get('/bills/stats/all', adminAuth, billController.getBillsStatistics);

// Get bill by order ID - MUST come before /bills/:id
router.get('/bills/order/:orderId', adminAuth, billController.getBillByOrderId);

// Create a new bill (manual creation)
router.post('/bills', adminAuth, billController.createBill);

// Get a specific bill
router.get('/bills/:id', adminAuth, billController.getBillById);

// Update bill status
router.patch('/bills/:id/status', adminAuth, billController.updateBillStatus);

// Update bill details
router.put('/bills/:id', adminAuth, billController.updateBill);

// Delete a bill
router.delete('/bills/:id', adminAuth, billController.deleteBill);


module.exports = router;
