import React, { useEffect, useState } from "react";
import { devError } from "../utils/logger";
import { fetchAccessories, fetchCart, updateCart, fetchWishlist, updateWishlist } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import FilterSidebar from "../components/FilterSidebar";
import FilterTags from "../components/FilterTags";
import AuthModal from "../components/AuthModal";
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar, FaShare, FaTimes, FaSearchPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Extract unique categories and brands from productsData for sidebar
const getUnique = (arr, key) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(item => item[key]).filter(Boolean))];
};

export default function Accessories() {
  const navigate = useNavigate();
  const [accessories, setAccessories] = useState([]);
  const [filteredAccessories, setFilteredAccessories] = useState([]);
  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    color: [],
    offer: [],
    bestSeller: [],
    price: { min: 0, max: 5000 },
    rating: null,
    inStock: false,
  });
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortOption, setSortOption] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);


  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await fetchAccessories();
        setAccessories(Array.isArray(data) ? data : []);
      } catch (err) {
        devError("Error fetching accessories:", err);
        setAccessories([]);
      }
      if (user) {
        try {
          const [cartData, wishlistData] = await Promise.all([
            fetchCart(user._id),
            fetchWishlist(user._id),
          ]);
          setCart((cartData && cartData.data) || []);
          setWishlist((wishlistData && wishlistData.data) || []);
        } catch {
          setCart([]);
          setWishlist([]);
        }
      }
    };
    fetchAll();
    const handler = () => fetchAll();
    window.addEventListener('reviewSubmitted', handler);
    window.addEventListener('cartWishlistUpdated', handler);
    return () => {
      window.removeEventListener('reviewSubmitted', handler);
      window.removeEventListener('cartWishlistUpdated', handler);
    };
  }, [user]);

  useEffect(() => {
    const safeAccessories = Array.isArray(accessories) ? accessories : [];
    let result = [...safeAccessories];
    if (filters.category.length)
      result = result.filter(a => filters.category.includes(a.category));
    if (filters.brand.length)
      result = result.filter(a => filters.brand.includes(a.brand));
    if (filters.color && filters.color.length)
      result = result.filter(a => a.color && filters.color.includes(a.color));
    if (filters.offer && filters.offer.length)
      result = result.filter(a => a.isOffer === true || a.isOffer === 'Yes');
    if (filters.bestSeller && filters.bestSeller.length)
      result = result.filter(a => a.isBestSeller === true || a.isBestSeller === 'Yes');
    if (filters.rating)
      result = result.filter(a => {
        const rating = (a.avgRating !== undefined && a.avgRating !== null)
          ? Number(a.avgRating)
          : (a.rating !== undefined && a.rating !== null)
            ? Number(a.rating)
            : 0;
        return rating >= filters.rating;
      });
    if (filters.price)
      result = result.filter(a => a.price >= filters.price.min && a.price <= filters.price.max);
    if (filters.inStock)
      result = result.filter(a => a.inStock !== false);
    if (sortOption === "priceLowToHigh") result.sort((a, b) => a.price - b.price);
    else if (sortOption === "priceHighToLow") result.sort((a, b) => b.price - a.price);
    else if (sortOption === "rating") result.sort((a, b) => {
      const ratingA = (a.avgRating !== undefined && a.avgRating !== null)
        ? Number(a.avgRating)
        : (a.rating !== undefined && a.rating !== null)
          ? Number(a.rating)
          : 0;
      const ratingB = (b.avgRating !== undefined && b.avgRating !== null)
        ? Number(b.avgRating)
        : (b.rating !== undefined && b.rating !== null)
          ? Number(b.rating)
          : 0;
      return ratingB - ratingA;
    });
    setFilteredAccessories(result);
  }, [filters, sortOption, accessories]);

  const handleClearAll = () => {
    setFilters({
      category: [],
      brand: [],
      color: [],
      offer: [],
      bestSeller: [],
      price: { min: 0, max: 5000 },
      rating: null,
      inStock: false,
    });
    setPriceRange([0, 5000]);
  };

  const getImageSrc = (imgPath) => {
    if (!imgPath || typeof imgPath !== 'string') return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imgPath.startsWith('http')) return imgPath;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    return `${backendUrl}${imgPath}`;
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const model = 'Accessory';
    if (!cart.some((c) => {
      const cid = c._id || c.id || (c.product && (c.product._id || c.product.id));
      const cmodel = c._cartModel || c.model || (c.category ? 'Product' : 'Accessory');
      return String(cid) === String(item._id || item.id) && cmodel === model;
    })) {
      await updateCart(item._id || item.id, user.token, model);
    }
    const cartData = await fetchCart(user._id);
    setCart((cartData && cartData.data) || []);
    window.dispatchEvent(new Event('cartWishlistUpdated'));
  };

  const handleAddToWishlist = async (item) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const model = 'Accessory';
    if (!wishlist.some((w) => w._id === (item._id || item.id))) {
      await updateWishlist(item._id || item.id, "add", user.token, model);
      const wishlistData = await fetchWishlist(user._id);
      setWishlist((wishlistData && wishlistData.data) || []);
      window.dispatchEvent(new Event('cartWishlistUpdated'));
    }
  };

  const handleRemoveFromWishlist = async (itemId) => {
    if (!user) return;
    const model = 'Accessory';
    await updateWishlist(itemId, "remove", user.token, model);
    const wishlistData = await fetchWishlist(user._id);
    setWishlist((wishlistData && wishlistData.data) || []);
    window.dispatchEvent(new Event('cartWishlistUpdated'));
  };

  const shareProduct = (product) => {
    const text = `Check out ${product.name} - ₹${product.price}!`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, text, url });
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const handleRemoveFilter = (key, value) => {
    const updatedFilters = { ...filters };
    if (key === "price") {
      updatedFilters.price = { min: 0, max: 5000 };
      setPriceRange([0, 5000]);
    } else if (Array.isArray(updatedFilters[key])) {
      updatedFilters[key] = updatedFilters[key].filter(v => v !== value);
    } else {
      updatedFilters[key] = null;
    }
    setFilters(updatedFilters);
  };

// Only show accessory-related categories and brands
const FIXED_ACCESSORY_CATEGORIES = [
  "Mobile Covers",
  "Headphones",
  "USB",
  "Chargers",
  "Screen Protectors",
  "Power Banks",
  "Bluetooth Speakers",
  "Smart Bands",
  "Car Accessories",
  "Other"
];
const FIXED_ACCESSORY_BRANDS = [
  "Boat",
  "JBL",
  "Realme",
  "Samsung",
  "MI",
  "Portronics",
  "Noise",
  "OnePlus",
  "Sony",
  "Other"
];
const ACCESSORY_CATEGORIES = accessories.length
  ? getUnique(accessories, "category").filter(cat => FIXED_ACCESSORY_CATEGORIES.includes(cat))
  : FIXED_ACCESSORY_CATEGORIES;
const ACCESSORY_BRANDS = accessories.length
  ? getUnique(accessories, "brand").filter(brand => FIXED_ACCESSORY_BRANDS.includes(brand))
  : FIXED_ACCESSORY_BRANDS;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Accessories</h1>

        <FilterTags filters={filters} onRemove={handleRemoveFilter} onClearAll={handleClearAll} />

        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              onClearAll={handleClearAll}
              categories={ACCESSORY_CATEGORIES}
              brands={ACCESSORY_BRANDS}
            />
          </aside>

          <main className="flex-1">
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
              <span className="text-gray-700"><strong>{filteredAccessories.length}</strong> accessories</span>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sort by</option>
                <option value="priceLowToHigh">Price: Low to High</option>
                <option value="priceHighToLow">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.isArray(filteredAccessories) && filteredAccessories.length > 0 ? (
                filteredAccessories.map((accessory) => {
                  if (!accessory) return null; // Skip null/undefined items
                  const inWishlist = wishlist.some(w => w._id === (accessory._id || accessory.id));
                  const rating = accessory.avgRating || 0;

                return (
                  <div
                    key={accessory._id || accessory.id}
                    className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white"
                  >
                    {/* Image Container */}
                    <div className="relative overflow-hidden h-48 bg-gray-200">
                      <img
                        src={getImageSrc(accessory.image)}
                        alt={accessory.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-2 p-2">
                        <button
                          onClick={() => handleAddToCart(accessory)}
                          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded flex items-center justify-center gap-2 font-semibold text-sm transition-colors"
                        >
                          <FaShoppingCart /> Add
                        </button>
                        <button
                          onClick={() => setQuickViewProduct(accessory)}
                          className="bg-purple-600 hover:bg-purple-700 text-white w-full py-2 rounded flex items-center justify-center gap-2 font-semibold text-sm transition-colors"
                        >
                          <FaSearchPlus /> Quick View
                        </button>
                        <button
                          onClick={() => shareProduct(accessory)}
                          className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded flex items-center justify-center gap-2 font-semibold text-sm transition-colors"
                        >
                          <FaShare /> Share
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 right-2 flex justify-between">
                        {accessory.isOffer && (
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                            -{accessory.discountPercent}%
                          </div>
                        )}
                        {accessory.badge && (
                          <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-semibold">
                            {accessory.badge}
                          </div>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => inWishlist ? handleRemoveFromWishlist(accessory._id) : handleAddToWishlist(accessory)}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
                      >
                        {inWishlist ? (
                          <FaHeart className="text-red-500 text-lg" />
                        ) : (
                          <FaRegHeart className="text-gray-500 text-lg" />
                        )}
                      </button>

                      {/* Stock Indicator */}
                      {!accessory.inStock && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs py-1 text-center font-semibold">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-800 truncate">{accessory.name}</p>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 my-1">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} size={10} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">({accessory.ratingCount || 0})</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">₹{accessory.offerPrice || accessory.price}</span>
                        {accessory.isOffer && (
                          <span className="text-xs text-gray-500 line-through">₹{accessory.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No accessories found. Please check back later or try adjusting your filters.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && quickViewProduct.name && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{quickViewProduct.name}</h2>
              <button onClick={() => setQuickViewProduct(null)} className="text-gray-500 hover:text-black">
                <FaTimes size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img
                src={getImageSrc(quickViewProduct.image)}
                alt={quickViewProduct.name}
                className="w-full h-64 object-cover rounded-lg"
              />

              <div>
                <p className="text-gray-700 mb-4">{quickViewProduct.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} size={12} className={i < Math.round(quickViewProduct.avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({quickViewProduct.ratingCount || 0} reviews)</span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">Brand: <strong>{quickViewProduct.brand}</strong></p>
                  <p className="text-sm text-gray-600">Category: <strong>{quickViewProduct.category}</strong></p>
                  {quickViewProduct.color && <p className="text-sm text-gray-600">Color: <strong>{quickViewProduct.color}</strong></p>}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold">₹{quickViewProduct.offerPrice || quickViewProduct.price}</span>
                  {quickViewProduct.isOffer && (
                    <span className="text-sm text-gray-500 line-through">₹{quickViewProduct.price}</span>
                  )}
                </div>

                {quickViewProduct.inStock ? (
                  <p className="text-green-600 font-semibold mb-4">In Stock</p>
                ) : (
                  <p className="text-red-600 font-semibold mb-4">Out of Stock</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => navigate(`/accessory/${quickViewProduct._id}`)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
