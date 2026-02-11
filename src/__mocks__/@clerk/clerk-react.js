module.exports = {
  useClerk: () => ({ user: null }),
  ClerkProvider: ({ children }) => children,
  useUser: () => ({ user: null }),
};
