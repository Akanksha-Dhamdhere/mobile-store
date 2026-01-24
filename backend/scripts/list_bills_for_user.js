require('dotenv').config();
const mongoose = require('mongoose');
const Bill = require('../models/Bill');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node list_bills_for_user.js <userId>');
    process.exit(1);
  }
  const bills = await Bill.find({ user: userId }).sort({ createdAt: -1 });
  console.log(`Found ${bills.length} bills for user ${userId}`);
  bills.forEach(b => console.log(b.billNumber, b._id.toString(), b.total));
  mongoose.disconnect();
}

main();
