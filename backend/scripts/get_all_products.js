require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const products = await Product.find();
      console.log('Total products:', products.length);
      
      if (products.length === 0) {
        console.log('\n❌ No products found in the database!');
        console.log('You need to add products first.');
      } else {
        console.log('\nProducts:');
        products.forEach((p, index) => {
          console.log(`${index + 1}. ${p.name} - $${p.price}`);
        });
      }
      
      process.exit(0);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
