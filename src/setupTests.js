// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide a default mock for AuthContext used throughout the app tests
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: null, logout: jest.fn(), login: jest.fn(), isAdmin: false })
}));

// Provide a simple mock for the language context used by Footer
jest.mock('./context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: jest.fn() })
}));

// Mock reviews context used by Home -> ReviewSwiper
jest.mock('./context/ReviewContext', () => ({
  useReviews: () => ({ reviews: [] })
}));
