const React = require('react');
module.exports = {
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ to, children }) => React.createElement('a', { href: to }, children),
  BrowserRouter: ({ children }) => children,
  MemoryRouter: ({ children }) => children,
};