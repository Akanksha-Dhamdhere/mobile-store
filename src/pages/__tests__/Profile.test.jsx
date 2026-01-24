import React from 'react';
import { render, screen } from '@testing-library/react';
import Profile from '../Profile';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'test-user' } })
}));

jest.mock('../../components/AuthModal', () => () => null);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

describe('Profile page smoke', () => {
  test('renders bills tab without crashing', () => {
    render(<Profile />);
    expect(screen.getByText(/My Bills/i)).toBeInTheDocument();
  });
});
