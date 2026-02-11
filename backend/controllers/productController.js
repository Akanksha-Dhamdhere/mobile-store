const Product = require('../models/Product');

const parseBool = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'on';
  }
  return Boolean(v);
};

exports.getAllProducts = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query = {
        $or: [
          { name: regex },
          { brand: regex },
          { category: regex },
          { description: regex }
        ]
      };
    }
    const products = await Product.find(query);
    const productsWithRatings = products.map(product => {
      const reviews = product.reviews || [];
      const ratings = product.ratings || [];
      const allRatings = reviews.length > 0 ? reviews : ratings;
      const ratingCount = allRatings.length;
      const avgRating = ratingCount ? (allRatings.reduce((sum, r) => sum + r.value, 0) / ratingCount) : null;
      return {
        ...product.toObject(),
        avgRating: avgRating !== null ? Number(avgRating.toFixed(2)) : null,
        ratingCount,
      };
    });
    res.json({ success: true, message: 'Products fetched', data: productsWithRatings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getLatestOffers = async (req, res) => {
  try {
    const products = await Product.find({ isOffer: true }).sort({ updatedAt: -1 }).limit(10);
    res.json({ success: true, message: 'Latest offers fetched', data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getLatestBestSellers = async (req, res) => {
  try {
    const products = await Product.find({ isBestSeller: true }).sort({ updatedAt: -1 }).limit(10);
    res.json({ success: true, message: 'Latest best sellers fetched', data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found', data: null });
    }
    
    const reviews = product.reviews || [];
    const ratings = product.ratings || [];
    const allRatings = reviews.length > 0 ? reviews : ratings;
    const ratingCount = allRatings.length;
    const avgRating = ratingCount ? (allRatings.reduce((sum, r) => sum + r.value, 0) / ratingCount).toFixed(2) : null;
    
    const productData = {
      ...product.toObject(),
      avgRating,
      ratingCount,
      reviews,
      images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : [])
    };
    
    res.json({
      success: true,
      message: 'Product fetched successfully',
      data: productData
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null, error: err.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const isOffer = parseBool(req.body.isOffer);
    const isBestSeller = parseBool(req.body.isBestSeller);
    const freeDelivery = parseBool(req.body.freeDelivery);
    const inStock = parseBool(req.body.inStock);

    const newProduct = new Product({
      ...req.body,
      price: Number(req.body.price),
      offerPrice: isOffer ? Number(req.body.offerPrice) : undefined,
      discountPercent: isOffer ? Number(req.body.discountPercent) : undefined,
      freeDelivery: freeDelivery,
      deliveryPrice: freeDelivery ? 0 : Number(req.body.deliveryPrice || 0),
      inStock: inStock,
      stock: (() => { const s = Number(req.body.stock); return Number.isNaN(s) ? 0 : s; })(),
      isOffer: isOffer,
      isBestSeller: isBestSeller
    });
    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product created', data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const isOffer = parseBool(req.body.isOffer);
    const isBestSeller = parseBool(req.body.isBestSeller);
    const freeDelivery = parseBool(req.body.freeDelivery);
    const inStock = parseBool(req.body.inStock);

    const updateData = {
      ...req.body,
      price: Number(req.body.price),
      offerPrice: isOffer ? Number(req.body.offerPrice) : undefined,
      discountPercent: isOffer ? Number(req.body.discountPercent) : undefined,
      freeDelivery: freeDelivery,
      deliveryPrice: freeDelivery ? 0 : Number(req.body.deliveryPrice || 0),
      inStock: inStock,
      stock: (() => { const s = Number(req.body.stock); return Number.isNaN(s) ? 0 : s; })(),
      isOffer: isOffer,
      isBestSeller: isBestSeller
    };
    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, message: 'Product updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rateProduct = async (req, res) => {
  try {
    const { user, value, review } = req.body;
    if (!user || typeof value !== 'number') return res.status(400).json({ success: false, message: 'User and value required' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.ratings = product.ratings || [];
    product.reviews = product.reviews || [];
    const existing = product.reviews.find(r => r.user === user);
    if (existing) return res.status(400).json({ success: false, message: 'User already reviewed' });
    product.reviews.push({ user, value, review });
    product.ratings.push({ user, value });
    await product.save();
    res.json({ success: true, message: 'Review added', data: product.reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
