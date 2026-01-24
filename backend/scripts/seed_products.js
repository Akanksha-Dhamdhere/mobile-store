require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Safety Helmet',
    price: 2999,
    image: 'https://via.placeholder.com/300x300?text=Safety+Helmet',
    category: 'Helmets',
    brand: 'SafeGuard',
    color: 'Red',
    inStock: true,
    stock: 50,
    isOffer: false,
    isBestSeller: true,
    badge: 'Popular',
    description: 'Professional safety helmet for construction and industrial work.',
    freeDelivery: true,
    deliveryPrice: 0,
    size: 'One Size'
  },
  {
    name: 'Safety Gloves',
    price: 499,
    image: 'https://via.placeholder.com/300x300?text=Safety+Gloves',
    category: 'Gloves',
    brand: 'WorkPro',
    color: 'Black',
    inStock: true,
    stock: 100,
    isOffer: true,
    isBestSeller: true,
    offerPrice: 399,
    discountPercent: 20,
    badge: 'On Sale',
    description: 'Durable work gloves with anti-slip grip.',
    freeDelivery: true,
    deliveryPrice: 0,
    size: 'M'
  },
  {
    name: 'Safety Vest',
    price: 1499,
    image: 'https://via.placeholder.com/300x300?text=Safety+Vest',
    category: 'Vests',
    brand: 'SecureWear',
    color: 'Yellow',
    inStock: true,
    stock: 75,
    isOffer: false,
    isBestSeller: false,
    badge: 'New',
    description: 'High-visibility safety vest with reflective strips.',
    freeDelivery: true,
    deliveryPrice: 0,
    size: 'L'
  },
  {
    name: 'Safety Boots',
    price: 3999,
    image: 'https://via.placeholder.com/300x300?text=Safety+Boots',
    category: 'Footwear',
    brand: 'StrongStep',
    color: 'Brown',
    inStock: true,
    stock: 40,
    isOffer: true,
    isBestSeller: true,
    offerPrice: 3299,
    discountPercent: 18,
    badge: 'Best Seller',
    description: 'Steel-toed safety boots with ankle support.',
    freeDelivery: false,
    deliveryPrice: 200,
    size: '10'
  },
  {
    name: 'Ear Plugs',
    price: 299,
    image: 'https://via.placeholder.com/300x300?text=Ear+Plugs',
    category: 'Hearing Protection',
    brand: 'SafeSound',
    color: 'Orange',
    inStock: true,
    stock: 200,
    isOffer: false,
    isBestSeller: false,
    badge: 'Affordable',
    description: 'Foam ear plugs for noise reduction up to 30dB.',
    freeDelivery: true,
    deliveryPrice: 0
  },
  {
    name: 'Safety Goggles',
    price: 899,
    image: 'https://via.placeholder.com/300x300?text=Safety+Goggles',
    category: 'Eye Protection',
    brand: 'VisionGuard',
    color: 'Clear',
    inStock: true,
    stock: 60,
    isOffer: true,
    isBestSeller: true,
    offerPrice: 699,
    discountPercent: 22,
    badge: 'Top Rated',
    description: 'Clear polycarbonate safety goggles with anti-fog coating.',
    freeDelivery: true,
    deliveryPrice: 0
  },
  {
    name: 'Hard Hat',
    price: 1299,
    image: 'https://via.placeholder.com/300x300?text=Hard+Hat',
    category: 'Helmets',
    brand: 'ProTech',
    color: 'White',
    inStock: true,
    stock: 45,
    isOffer: false,
    isBestSeller: true,
    badge: 'Best Seller',
    description: 'Impact-resistant hard hat for construction sites.',
    freeDelivery: true,
    deliveryPrice: 0
  },
  {
    name: 'Hand Sanitizer',
    price: 199,
    image: 'https://via.placeholder.com/300x300?text=Hand+Sanitizer',
    category: 'Hygiene',
    brand: 'CleanShield',
    color: 'Clear',
    inStock: true,
    stock: 500,
    isOffer: false,
    isBestSeller: false,
    badge: 'Essential',
    description: '70% Alcohol-based hand sanitizer (500ml).',
    freeDelivery: true,
    deliveryPrice: 0
  },
  {
    name: 'Reflective Tape',
    price: 349,
    image: 'https://via.placeholder.com/300x300?text=Reflective+Tape',
    category: 'Accessories',
    brand: 'VisibleSafe',
    color: 'Silver',
    inStock: true,
    stock: 150,
    isOffer: true,
    isBestSeller: false,
    offerPrice: 249,
    discountPercent: 29,
    badge: 'Trending',
    description: '2-inch wide reflective safety tape for visibility.',
    freeDelivery: true,
    deliveryPrice: 0
  },
  {
    name: 'Work Apron',
    price: 799,
    image: 'https://via.placeholder.com/300x300?text=Work+Apron',
    category: 'Clothing',
    brand: 'DutyWear',
    color: 'Black',
    inStock: true,
    stock: 80,
    isOffer: false,
    isBestSeller: false,
    badge: 'Durable',
    description: 'Heavy-duty canvas work apron with multiple pockets.',
    freeDelivery: true,
    deliveryPrice: 0,
    size: 'One Size'
  }
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      // Clear existing products
      await Product.deleteMany({});
      console.log('Cleared existing products');

      // Add sample products
      const products = await Product.insertMany(sampleProducts);
      console.log(`✅ Successfully added ${products.length} products to the database!`);
      
      products.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - $${p.price}`);
      });

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
