
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const admin = require('firebase-admin');

// Clerk/Google login by email only (no password required)
router.post('/login/clerk', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    // Only allow if user has no password set (i.e., Clerk/Google user)
    // In development we allow Clerk login to proceed even if a password exists to make local testing easier.
    if (user.hasPassword && process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Password login required' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;
    
    // Basic validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    // If mobile is provided, check if it already exists
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) return res.status(400).json({ message: 'Mobile number already registered' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({ 
      name: name || email.split('@')[0], 
      email, 
      password: hash,
      mobile: mobile || '',
      hasPassword: true,
      role: 'user'
    });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('token', token, { 
      httpOnly: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    res.status(201).json({ 
      message: 'Signup successful', 
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (role === 'admin') {
      if (user.role !== 'admin') return res.status(403).json({ message: 'Only admin can login here.' });
    } else {
      if (user.role !== 'user') return res.status(403).json({ message: 'Only user can login here.' });
    }
    // Check if user has a password before comparing
    if (!user.password) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    // Set cookie with improved cross-origin support
    // In production with HTTPS, use sameSite: 'none' with secure: true
    res.cookie('token', token, { 
      httpOnly: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// Get current authenticated user (used by frontend to hydrate session)
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Google Login
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    let user = await User.findOne({ email: decoded.email });
    if (!user) {
      user = await User.create({
        email: decoded.email,
        name: decoded.name || decoded.email,
      });
    }
    // Set JWT cookie for session, just like normal login
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.cookie('token', jwtToken, { 
      httpOnly: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (err) {
    console.error('Google login backend error:', err);
    res.status(401).json({ message: 'Invalid Google token or server error' });
  }
});

module.exports = router;
