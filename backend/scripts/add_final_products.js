require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const additionalProducts = [
  {
    name: 'Magnetic Tool Holder',
    price: 899,
    image: 'https://via.placeholder.com/300x300?text=Magnetic+Holder',
    category: 'Storage',
    brand: 'MagnetPro',
    color: 'Silver',
    inStock: true,
    stock: 95,
    isOffer: true,
    isBestSeller: false,
    offerPrice: 699,
    discountPercent: 22,
    badge: 'Useful',
    description: 'Heavy-duty magnetic tool holder for metal surfaces.',
    freeDelivery: true,
    deliveryPrice: 0
  },
  {
    name: 'Digital Safety Thermometer',
    price: 599,
    image: 'https://via.placeholder.com/300x300?text=Thermometer',
    category: 'Safety Equipment',
    brand: 'TempCheck',
    color: 'White',
    inStock: true,
    stock: 120,
    isOffer: false,
    isBestSeller: false,
    badge: 'Health',
    description: 'Non-contact digital thermometer for temperature screening.',
    freeDelivery: true,
    deliveryPrice: 0
  }
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      // Insert additional products
      const products = await Product.insertMany(additionalProducts);
      console.log(`✅ Successfully added ${products.length} more products!`);
      
      products.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - $${p.price}`);
      });

      // Get total product count
      const totalProducts = await Product.countDocuments();
      console.log(`\n📊 Total products in database: ${totalProducts}`);

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
