const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Bill = require('../models/Bill');
const User = require('../models/User');
const billController = require('../controllers/billController');

// Middleware to authenticate user
function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Middleware to check admin
function adminAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    User.findById(req.userId).then(user => {
      if (user && user.role === 'admin') {
        req.userRole = 'admin';
        next();
      } else {
        res.status(403).json({ message: 'Admin access required' });
      }
    }).catch(() => res.status(401).json({ message: 'Invalid token' }));
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ========== USER ROUTES ==========

// Get all bills for the authenticated user
router.get('/my-bills', auth, billController.getUserBills);

// Get bill by order ID
router.get('/order/:orderId', auth, billController.getBillByOrderId);

// Get a specific bill by ID (user can only view their own bills)
router.get('/:id', auth, billController.getBillById);

// ========== ADMIN ROUTES ==========

// Create a new bill (manual bill creation by admin)
router.post('/', adminAuth, billController.createBill);

// Get all bills (admin only)
router.get('/', adminAuth, billController.getAllBills);

// Get bills statistics (admin only) - MUST come before /:id
router.get('/stats/all', adminAuth, billController.getBillsStatistics);

// Update bill status
router.patch('/:id/status', adminAuth, billController.updateBillStatus);

// Generate bill PDF (admin only)
router.get('/:id/pdf', adminAuth, billController.generateBillPDF);

// Update bill details (admin only)
router.put('/:id', adminAuth, billController.updateBill);

// Delete a bill (admin only)
router.delete('/:id', adminAuth, billController.deleteBill);

module.exports = router;
