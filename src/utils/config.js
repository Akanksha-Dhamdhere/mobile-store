/**
 * Centralized configuration for the application
 * Reduces code duplication and makes it easier to manage environment variables
 */

export const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
};

export const getApiBase = () => {
  return `${getBackendUrl()}/api`;
};

export const getImageUrl = (imgPath) => {
  if (!imgPath) return '';
  if (imgPath.startsWith('http')) return imgPath;
  return `${getBackendUrl()}${imgPath}`;
};

// API timeout configuration (in milliseconds)
export const API_TIMEOUT = 30000;

// Default error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You need to be logged in for this action.',
  FORBIDDEN: 'You do not have permission for this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

const config = {
  getBackendUrl,
  getApiBase,
  getImageUrl,
  API_TIMEOUT,
  ERROR_MESSAGES,
};

export default config;
