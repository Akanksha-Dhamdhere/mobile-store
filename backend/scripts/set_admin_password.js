// Usage: node backend/scripts/set_admin_password.js <email> <newPassword>
// If no args provided, defaults to the requested admin credentials.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEFAULT_EMAIL = 'dhamdhereakanksha162@gmail.com';
const DEFAULT_PASSWORD = 'akanksha@092007';

const email = process.argv[2] || DEFAULT_EMAIL;
const newPassword = process.argv[3] || DEFAULT_PASSWORD;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Please add MONGO_URI to your .env (e.g. mongodb://localhost:27017/dbname)');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const hashed = await bcrypt.hash(newPassword, 10);
    let user = await User.findOne({ email });
    if (!user) {
      // create admin user if it does not exist
      user = new User({ email, role: 'admin', password: hashed, hasPassword: true });
      await user.save();
      console.log('Admin user created:', email);
    } else {
      user.role = 'admin';
      user.password = hashed;
      user.hasPassword = true;
      await user.save();
      console.log('Admin password updated for:', email);
    }
  } catch (err) {
    console.error('Error updating admin password:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
