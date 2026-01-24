// Script to check admin user status and password
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const email = 'dhamdhereakanksha162@gmail.com';
const password = 'akanksha@092007';

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    console.log('Checking admin user:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User does not exist in database');
      console.log('Run: node backend/scripts/set_admin_password.js to create the admin user');
      process.exit(1);
    }

    console.log('\n✓ User found:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Has Password:', user.hasPassword);
    console.log('  Password Hash:', user.password ? user.password.substring(0, 20) + '...' : 'NOT SET');

    if (user.role !== 'admin') {
      console.log('\n❌ User role is not "admin", it is:', user.role);
      console.log('Run: node backend/scripts/set_admin_password.js to fix this');
      process.exit(1);
    }

    if (!user.password) {
      console.log('\n❌ No password hash stored');
      console.log('Run: node backend/scripts/set_admin_password.js to set password');
      process.exit(1);
    }

    if (!user.hasPassword) {
      console.log('\n⚠️  hasPassword flag is false (user marked as Clerk/Google user)');
    }

    // Test password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('\n✓ Password verification:', passwordMatch ? '✓ MATCHES' : '❌ DOES NOT MATCH');

    if (!passwordMatch) {
      console.log('\nThe stored password hash does not match the provided password.');
      console.log('Run: node backend/scripts/set_admin_password.js "' + email + '" "' + password + '" to update');
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
