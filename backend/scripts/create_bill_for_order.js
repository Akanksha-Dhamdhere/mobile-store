require('dotenv').config();
const mongoose = require('mongoose');
const { createBillForOrder } = require('../utils/bill');
const Order = require('../models/Order');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const orderIdArg = process.argv[2];
  let order;
  if (orderIdArg) {
    order = await Order.findById(orderIdArg);
    if (!order) {
      console.error('Order not found for id', orderIdArg);
      process.exit(1);
    }
  } else {
    order = await Order.findOne({ bill: { $exists: false } }).sort({ createdAt: -1 });
    if (!order) {
      console.error('No suitable order found (without bill)');
      process.exit(1);
    }
  }

  console.log('Using order:', order._id, 'user:', order.user);
  try {
    const bill = await createBillForOrder(order._id, order.user, order);
    console.log('Created bill:', bill._id);
  } catch (err) {
    console.error('Failed to create bill:', err && err.stack ? err.stack : err);
    process.exit(1);
  } finally {
    mongoose.disconnect();
  }
}

main();
