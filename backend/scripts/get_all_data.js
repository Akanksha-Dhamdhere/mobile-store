require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

async function getAllData() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log('\n========== ALL CUSTOMERS ==========\n');
    const users = await User.find().select('-password');
    console.log('Total Users:', users.length);
    users.forEach((u, idx) => {
      console.log(`${idx + 1}. Email: ${u.email}, Role: ${u.role}, Name: ${u.profile?.name || 'N/A'}`);
    });
    
    console.log('\n========== ALL ORDERS ==========\n');
    const orders = await Order.find().populate('user', 'email');
    console.log('Total Orders:', orders.length);
    orders.forEach((o, idx) => {
      console.log(`${idx + 1}. Order ID: ${o._id}, User: ${o.user?.email || 'N/A'}, Status: ${o.status}, Total: ₹${o.total}`);
    });
    
    console.log('\n========== ADMIN USERS ==========\n');
    const admins = await User.find({ role: 'admin' }).select('-password');
    admins.forEach((a, idx) => {
      console.log(`${idx + 1}. Email: ${a.email}, HasPassword: ${a.hasPassword}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

getAllData();
