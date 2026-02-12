
import axios from 'axios';
import { devError } from './logger';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api`;

// Remove from cart (single product or accessory)
// model should be 'Product' or 'Accessory'
export const removeFromCart = async (productId, userToken, model) => {
  if (!model) throw new Error('Model type (Product or Accessory) is required for cart actions');
  // Backend expects { product, model }
  const res = await axios.post(`${API_BASE}/cart/remove`, { product: productId, model }, {
    withCredentials: true,
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
  });
  return res.data;
};

// Cancel order (user)
export const cancelOrder = async (orderId) => {
  // PATCH to /orders/:id/cancel (to be implemented in backend)
  const res = await axios.patch(`${API_BASE}/orders/${orderId}/cancel`, {}, { withCredentials: true });
  return res.data;
};

// Delete order (user)
export const deleteOrder = async (orderId) => {
  // DELETE to /orders/:id/delete (to be implemented in backend)
  const res = await axios.delete(`${API_BASE}/orders/${orderId}/delete`, { withCredentials: true });
  return res.data;
};


// Admin: update order status/delivery date
export const updateOrderStatus = async (orderId, { status, deliveryDate }) => {
  const res = await axios.put(`${API_BASE}/admin/orders/${orderId}`, { status, deliveryDate }, { withCredentials: true });
  return res.data;
};



// Fetch latest best sellers
export const fetchLatestBestSellers = async () => {
  const res = await axios.get(`${API_BASE}/products/bestsellers/latest`);
  return res.data;
};

// Fetch latest offers
export const fetchLatestOffers = async () => {
  const res = await axios.get(`${API_BASE}/products/offers/latest`);
  return res.data;
};

export const fetchProducts = async () => {
  const res = await axios.get(`${API_BASE}/products`);
  // Handle both response structures: { data: [...] } and { success, message, data: [...] }
  const data = res.data?.data || res.data;
  return Array.isArray(data) ? data : [];
};

export const fetchAccessories = async () => {
  const res = await axios.get(`${API_BASE}/accessories`);
  // Handle both response structures: { data: [...] } and { success, message, data: [...] }
  const data = res.data?.data || res.data;
  return Array.isArray(data) ? data : [];
};

export const addProduct = async (product) => {
  const res = await axios.post(`${API_BASE}/products`, product);
  return res.data;
};

export const updateProduct = async (id, product) => {
  const res = await axios.put(`${API_BASE}/products/${id}`, product);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await axios.delete(`${API_BASE}/products/${id}`);
  return res.data;
};

export const addAccessory = async (accessory) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const res = await axios.post(`${API_BASE}/accessories`, accessory, {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const updateAccessory = async (id, accessory) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const res = await axios.put(`${API_BASE}/accessories/${id}`, accessory, {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const deleteAccessory = async (id) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const res = await axios.delete(`${API_BASE}/accessories/${id}`, {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};
// User Authentication & Profile
export const signup = async (userData) => {
  const res = await axios.post(`${API_BASE}/auth/signup`, userData);
  return res.data;
};

export const login = async (credentials) => {
  const res = await axios.post(`${API_BASE}/auth/login`, credentials, { withCredentials: true });
  return res.data;
};

export const logout = async () => {
  const res = await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
  return res.data;
};

export const fetchUserProfile = async (userId) => {
  const res = await axios.get(`${API_BASE}/users/${userId}`, { withCredentials: true });
  return res.data;
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const res = await axios.put(`${API_BASE}/users/${userId}`, profileData, { withCredentials: true });
    return res.data;
  } catch (error) {
      devError('updateUserProfile error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message,
      url: `${API_BASE}/users/${userId}`,
      data: profileData
    });
    throw error;
  }
};

// Cart

// Fetch cart for current user (requires userId)
export const fetchCart = async (userId) => {
  const res = await axios.get(`${API_BASE}/cart/${userId}`, { withCredentials: true });
  return res.data;
};


// Add to cart (single product or accessory)
// model should be 'Product' or 'Accessory'
export const updateCart = async (productId, userToken, model) => {
  if (!model) throw new Error('Model type (Product or Accessory) is required for cart actions');
  const res = await axios.post(`${API_BASE}/cart/add`, { productId, model }, {
    withCredentials: true,
    headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
  });
  return res.data;
};

// Wishlist

// Fetch wishlist for current user (requires userId)
export const fetchWishlist = async (userId) => {
  const res = await axios.get(`${API_BASE}/wishlist/${userId}`, { withCredentials: true });
  return res.data;
};


// Add/remove from wishlist (single product)
// model should be 'Product' or 'Accessory'
export const updateWishlist = async (productId, action, userToken, model) => {
  if (!model) throw new Error('Model type (Product or Accessory) is required for wishlist actions');
  if (action === "add") {
    const res = await axios.post(`${API_BASE}/wishlist/add`, { productId, model }, {
      withCredentials: true,
      headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    });
    return res.data;
  } else if (action === "remove") {
    // Always send { productId, model } for wishlist remove
    const res = await axios.post(`${API_BASE}/wishlist/remove`, { productId, model }, {
      withCredentials: true,
      headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    });
    return res.data;
  }
};

// Orders
export const fetchOrders = async () => {
  const res = await axios.get(`${API_BASE}/orders`, { withCredentials: true });
  // Map backend order fields to frontend expected fields
  const orders = (res.data.data || res.data || []).map((o) => {
    const id = o._id || o.id;
    return {
      id,
      _id: o._id, // always keep _id for admin
      date: o.createdAt || o.date,
      deliveryDate: o.deliveryDate || null,
      status: o.status || 'Processing',
      address: o.address || '',
      paymentInfo: o.paymentInfo || {},
      user: o.user,
      // Map items to products for frontend
      products: (o.items || []).map((item) => ({
        name: item.product?.name || item.name || '',
        price: item.product?.price || item.price || 0,
        image: item.product?.image || '',
        quantity: item.quantity || 1,
        id: item.product?._id || item.product?.id || item.product || item.id || '',
        category: item.product?.category || '',
        brand: item.product?.brand || '',
      })),
      // For admin, keep items as well
      items: o.items,
      total: o.total || 0,
      _raw: o,
    };
  });
  return orders;
};

// Never send user field from frontend, backend will use authenticated user
export const placeOrder = async (orderData, token) => {
  const cleanOrder = { ...orderData };
  if (cleanOrder.user) delete cleanOrder.user;
  const res = await axios.post(
    `${API_BASE}/orders`,
    cleanOrder,
    {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return res.data;
};

// Account Switching (fetch all user accounts for switching, if supported)
export const fetchUserAccounts = async () => {
  const res = await axios.get(`${API_BASE}/users`, { withCredentials: true });
  return res.data;
};
