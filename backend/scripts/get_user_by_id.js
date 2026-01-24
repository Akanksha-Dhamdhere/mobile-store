require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node get_user_by_id.js <id>');
    process.exit(1);
  }
  const user = await User.findById(id);
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  console.log('User:', user._id.toString(), user.email, user.name || user.profile?.name || '');
  mongoose.disconnect();
}

main();
