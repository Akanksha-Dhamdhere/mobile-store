# 📝 Component Implementation Examples

This file shows how to update your existing components to use the new modern CSS styles.

---

## 1. AdminDashboard Component

```jsx
// src/pages/AdminDashboard.jsx
import '../AdminDashboard.css'; // ← Add this import

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, Admin! Here's your performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Total Sales</div>
          <div className="stat-value">$45,230</div>
          <div className="stat-change">+12.5%</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📦</div>
          <div className="stat-label">Orders Today</div>
          <div className="stat-value">324</div>
          <div className="stat-change">+8.2%</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">42</div>
          <div className="stat-change negative">-5%</div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">👥</div>
          <div className="stat-label">New Customers</div>
          <div className="stat-value">156</div>
          <div className="stat-change">+3.5%</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Sales Analytics</h3>
          {/* Your chart component here */}
        </div>
        <div className="chart-card">
          <h3>Product Distribution</h3>
          {/* Your chart component here */}
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="low-stock-section">
        <div className="low-stock-header">
          <h3>⚠️ Low Stock Alert</h3>
        </div>
        {lowStockItems.map(item => (
          <div key={item.id} className="low-stock-item">
            <span className="low-stock-name">{item.name}</span>
            <span className="low-stock-stock">{item.stock} left</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 2. AdminLayout Component

```jsx
// src/components/AdminLayout.jsx
import '../AdminLayout.css'; // ← Add this import
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">ShopHub</h1>
          <p className="sidebar-subtitle">Admin Panel</p>
        </div>
        
        <nav className="nav-menu">
          <li className="nav-item">
            <a href="/admin" className="nav-link active">
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
              <span className="nav-badge">5</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/admin/products" className="nav-link">
              <span className="nav-icon">📦</span>
              <span className="nav-text">Products</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/admin/orders" className="nav-link">
              <span className="nav-icon">📋</span>
              <span className="nav-text">Orders</span>
              <span className="nav-badge">12</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/admin/customers" className="nav-link">
              <span className="nav-icon">👥</span>
              <span className="nav-text">Customers</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="/admin/analytics" className="nav-link">
              <span className="nav-icon">📈</span>
              <span className="nav-text">Analytics</span>
            </a>
          </li>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search..." />
            </div>
          </div>

          <div className="header-right">
            <button className="header-icon-btn">
              <span>🔔</span>
              <span className="notification-badge">3</span>
            </button>
            
            <div className="admin-profile">
              <div className="profile-avatar">A</div>
              <div className="profile-info">
                <p className="profile-name">Admin User</p>
                <p className="profile-role">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---

## 3. Home Page Component

```jsx
// src/pages/Home.jsx
import '../Home.css'; // ← Add this import
import Hero from '../components/Hero';
import Offers from '../components/Offers';
import BestSellers from '../components/BestSellers';
import WhyChoose from '../components/WhyChoose';
import Steps from '../components/Steps';
import ReviewSwiper from '../components/ReviewSwiper';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <div className="home-page">
      <Hero />
      <Offers />
      <BestSellers />
      <WhyChoose />
      <Steps />
      <ReviewSwiper />
      <Contact />
    </div>
  );
}
```

---

## 4. Navbar Component

```jsx
// src/components/Navbar.jsx
import '../Navbar.css'; // ← Add this import
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">ShopHub</a>

        {/* Desktop Menu */}
        <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <li className="navbar-item">
            <a href="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </a>
          </li>
          <li className="navbar-item">
            <a href="/products" className={`navbar-link ${location.pathname === '/products' ? 'active' : ''}`}>
              Products
            </a>
          </li>
          <li className="navbar-item dropdown">
            <a href="#" className="navbar-link">Categories</a>
            <ul className="dropdown-menu">
              <li><a href="/categories/electronics" className="dropdown-item">Electronics</a></li>
              <li><a href="/categories/fashion" className="dropdown-item">Fashion</a></li>
              <li><a href="/categories/home" className="dropdown-item">Home & Garden</a></li>
            </ul>
          </li>
        </ul>

        {/* Search Bar */}
        <div className="navbar-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search products..." />
        </div>

        {/* Icons & Actions */}
        <div className="navbar-actions">
          <button className="icon-button">
            ❤️
            <span className="icon-badge">3</span>
          </button>
          
          <button className="icon-button" onClick={() => navigate('/cart')}>
            🛒
            <span className="icon-badge">5</span>
          </button>

          <div className="user-profile">
            <div className="user-avatar">U</div>
            <span className="user-name">User</span>
          </div>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
}
```

---

## 5. ProductCard Component

```jsx
// src/components/ProductCard.jsx
import '../ProductCard.css'; // ← Add this import
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="product-card">
      {/* Image Section */}
      <div className="product-image-container">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
        />
        {product.discount && (
          <span className="product-badge discount">{product.discount}% OFF</span>
        )}
        {product.isNew && (
          <span className="product-badge stock">NEW</span>
        )}
        <button 
          className={`wishlist-button ${isWishlisted ? 'active' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>

        {/* Rating */}
        <div className="star-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i}
                className={`star ${i < Math.floor(product.rating) ? '' : 'empty'}`}
              >
                ⭐
              </span>
            ))}
          </div>
          <span className="rating-text">({product.reviews} reviews)</span>
        </div>

        {/* Price */}
        <div className="product-price">
          <span className="current-price">
            ${product.currentPrice}
          </span>
          {product.originalPrice && (
            <span className="original-price">
              ${product.originalPrice}
            </span>
          )}
          {product.discount && (
            <span className="discount-percentage">-{product.discount}%</span>
          )}
        </div>

        {/* Stock Status */}
        <p className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>

        {/* Actions */}
        <div className="product-actions">
          <button 
            className={`btn-add-cart ${product.stock === 0 ? 'disabled' : ''}`}
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
          >
            🛒 Add to Cart
          </button>
          <button 
            className="btn-view-details"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Cart Component

```jsx
// src/pages/Cart.jsx
import '../Cart.css'; // ← Add this import
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Cart({ cartItems = [] }) {
  const [promoCode, setPromoCode] = useState('');
  const navigate = useNavigate();

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const tax = calculateTotal() * 0.1;
  const shipping = calculateTotal() > 100 ? 0 : 15;
  const finalTotal = calculateTotal() + tax + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Add some amazing products to get started!</p>
          <button 
            className="btn-continue-shopping"
            onClick={() => navigate('/products')}
          >
            → Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <p>You have {cartItems.length} items in your cart</p>
      </div>

      <div className="cart-content">
        {/* Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h2>Your Items</h2>
          </div>

          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img src={item.image} alt={item.name} />
              </div>

              <div className="cart-item-content">
                <h3 className="cart-item-title">{item.name}</h3>
                <div className="cart-item-meta">
                  <span><strong>Price:</strong> ${item.price}</span>
                  <span><strong>SKU:</strong> {item.sku}</span>
                </div>

                {/* Quantity Adjuster */}
                <div className="cart-item-quantity">
                  <button className="qty-btn">-</button>
                  <input type="number" value={item.quantity} className="quantity-input" />
                  <button className="qty-btn">+</button>
                </div>

                {/* Actions */}
                <div className="cart-item-actions">
                  <button className="btn-remove">Remove</button>
                  <button className="btn-save">Save for Later</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="cart-summary">
          <h3 className="summary-title">Order Summary</h3>

          <div className="summary-item">
            <span>Subtotal</span>
            <strong>${calculateTotal().toFixed(2)}</strong>
          </div>

          <div className="summary-item">
            <span>Tax (10%)</span>
            <strong>${tax.toFixed(2)}</strong>
          </div>

          <div className="summary-item">
            <span>Shipping</span>
            <strong>${shipping === 0 ? 'FREE' : `$${shipping}`}</strong>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Total</span>
            <span className="summary-total-price">${finalTotal.toFixed(2)}</span>
          </div>

          {/* Promo Code */}
          <div className="promo-code">
            <input 
              type="text" 
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button>Apply Code</button>
          </div>

          <button className="checkout-button">
            Proceed to Checkout
          </button>

          {/* Features */}
          <div className="cart-features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Secure Checkout</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🚚</span>
              <span>Free Shipping Over $100</span>
            </div>
            <div className="feature">
              <span className="feature-icon">↩️</span>
              <span>30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Profile Component

```jsx
// src/pages/Profile.jsx
import '../Profile.css'; // ← Add this import
import { useState } from 'react';

export default function Profile({ user = {} }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            U
            <div className="upload-overlay">
              <span className="upload-icon">📷</span>
            </div>
          </div>
          
          <div className="profile-info">
            <h1>{user.name || 'User Name'}</h1>
            <p>{user.email || 'user@example.com'}</p>
            <p className="member-since">Member since {user.joinDate || 'Jan 2024'}</p>

            <div className="profile-stats">
              <div className="stat">
                <p className="stat-number">24</p>
                <p className="stat-label">Orders</p>
              </div>
              <div className="stat">
                <p className="stat-number">$2,450</p>
                <p className="stat-label">Total Spent</p>
              </div>
              <div className="stat">
                <p className="stat-number">12</p>
                <p className="stat-label">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="profile-content">
        {/* Sidebar Menu */}
        <aside className="profile-sidebar">
          <ul className="sidebar-menu">
            <li>
              <a 
                href="#profile"
                className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="sidebar-icon">👤</span>
                <span>Profile Settings</span>
              </a>
            </li>
            <li>
              <a 
                href="#addresses"
                className={`sidebar-link ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => setActiveTab('addresses')}
              >
                <span className="sidebar-icon">🏠</span>
                <span>Addresses</span>
              </a>
            </li>
            <li>
              <a 
                href="#orders"
                className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <span className="sidebar-icon">📦</span>
                <span>Orders</span>
              </a>
            </li>
            <li>
              <a 
                href="#wishlist"
                className={`sidebar-link ${activeTab === 'wishlist' ? 'active' : ''}`}
                onClick={() => setActiveTab('wishlist')}
              >
                <span className="sidebar-icon">❤️</span>
                <span>Wishlist</span>
              </a>
            </li>
          </ul>
        </aside>

        {/* Profile Section */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2 className="section-title">Profile Settings</h2>
            
            <form>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" defaultValue={user.name} />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" defaultValue={user.email} />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" defaultValue={user.phone} />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea defaultValue={user.bio}></textarea>
              </div>

              <div className="profile-actions">
                <button className="btn-save">Save Changes</button>
                <button className="btn-cancel" type="button">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses Section */}
        {activeTab === 'addresses' && (
          <div className="profile-section">
            <h2 className="section-title">Manage Addresses</h2>
            
            <div className="address-grid">
              <div className="address-card default">
                <h3 className="address-title">Home</h3>
                <p className="address-text">123 Main Street</p>
                <p className="address-text">New York, NY 10001</p>
                <p className="address-text">USA</p>
                <div className="address-actions">
                  <button className="btn-edit">Edit</button>
                  <button className="btn-delete">Delete</button>
                </div>
              </div>

              <button className="btn-add">+ Add New Address</button>
            </div>
          </div>
        )}

        {/* Orders Section */}
        {activeTab === 'orders' && (
          <div className="profile-section">
            <h2 className="section-title">Order History</h2>
            
            <div className="order-grid">
              <div className="order-card">
                <div className="order-info">
                  <h3>Order #12345</h3>
                  <div className="order-meta">
                    <span>Date: Jan 15, 2024</span>
                    <span>Total: $245.99</span>
                  </div>
                </div>
                <span className="order-status delivered">Delivered</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 8. Products Page Component

```jsx
// src/pages/Products.jsx
import '../Products.css'; // ← Add this import
import { useState } from 'react';
import ProductCard from '../components/ProductCard';

export default function Products({ products = [] }) {
  const [filters, setFilters] = useState({
    category: [],
    priceRange: [0, 1000],
    inStock: true
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewType, setViewType] = useState('grid');

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Header */}
        <div className="products-header">
          <h1>Our Products</h1>
          <p>Discover our amazing collection of quality products</p>
        </div>

        {/* Main Layout */}
        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            {/* Category Filter */}
            <div className="filter-group">
              <h3 className="filter-group-title">Category</h3>
              <div className="filter-options">
                <label className="filter-option">
                  <input type="checkbox" onChange={(e) => {}} />
                  <span className="filter-label">Electronics</span>
                  <span className="filter-count">245</span>
                </label>
                <label className="filter-option">
                  <input type="checkbox" onChange={(e) => {}} />
                  <span className="filter-label">Fashion</span>
                  <span className="filter-count">182</span>
                </label>
                <label className="filter-option">
                  <input type="checkbox" onChange={(e) => {}} />
                  <span className="filter-label">Home & Garden</span>
                  <span className="filter-count">156</span>
                </label>
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-group price-slider-group">
              <h3 className="filter-group-title">Price Range</h3>
              <div className="price-inputs">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="price-input"
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="price-input"
                />
              </div>
            </div>

            {/* In Stock Filter */}
            <div className="filter-group">
              <h3 className="filter-group-title">Availability</h3>
              <label className="filter-option">
                <input type="checkbox" defaultChecked />
                <span className="filter-label">In Stock</span>
                <span className="filter-count">423</span>
              </label>
              <label className="filter-option">
                <input type="checkbox" />
                <span className="filter-label">Out of Stock</span>
                <span className="filter-count">87</span>
              </label>
            </div>

            <button className="reset-filters">Reset Filters</button>
          </aside>

          {/* Main Content */}
          <div className="products-main">
            {/* Top Bar */}
            <div className="products-topbar">
              <span className="products-count">
                Showing {products.length} products
              </span>

              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              <div className="view-options">
                <button 
                  className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewType('grid')}
                >
                  ⊞
                </button>
                <button 
                  className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
                  onClick={() => setViewType('list')}
                >
                  ☰
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              {products.length > 0 ? (
                products.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                  />
                ))
              ) : (
                <div className="no-products">
                  <div className="no-products-icon">📭</div>
                  <h2>No Products Found</h2>
                  <p>Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button className="pagination-btn">←</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Key Points

1. **Always import the CSS file** at the top of the component
2. **Use exact class names** from the CSS files
3. **Follow the HTML structure** shown in the CSS files
4. **Test responsive design** on different screen sizes
5. **Use semantic HTML** with proper headings and structure

All examples follow the CSS structure and will automatically style correctly once imported!
