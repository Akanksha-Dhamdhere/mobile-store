/**
 * API Utility Module
 * Provides standardized API calls with error handling and interceptors
 * Centralizes all HTTP requests for easier maintenance and debugging
 */

import { getApiBase } from './config';
import { devError } from './logger';

/**
 * Make an API request with standardized error handling
 * @param {string} endpoint - API endpoint (e.g., '/products')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} - Response data
 * @throws {Error} - Network or API errors
 */
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 30000,
    withCredentials = true,
  } = options;

  const url = `${getApiBase()}${endpoint}`;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : null,
      credentials: withCredentials ? 'include' : 'omit',
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Parse response
    const data = await response.json();

    // Handle both response formats: { data: {...} } and direct data
    return {
      success: true,
      data: data.data || data,
      raw: data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }

    // Re-throw with enhanced information
    error.endpoint = endpoint;
    error.method = method;
    devError(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const apiPost = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'POST', body });
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const apiPut = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'PUT', body });
};

/**
 * PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const apiPatch = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'PATCH', body });
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

/**
 * Get authorization headers
 * @param {string} token - JWT token
 * @returns {Object} - Headers object
 */
export const getAuthHeaders = (token) => {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Handle API errors in a standardized way
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error.code === 'TIMEOUT') {
    return 'Request took too long. Please check your connection.';
  }

  if (error.status === 401) {
    return 'Session expired. Please log in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.status === 404) {
    return 'Resource not found.';
  }

  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }

  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  if (!navigator.onLine) {
    return 'No internet connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

const apiUtils = {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  getAuthHeaders,
  getErrorMessage,
};

export default apiUtils;
