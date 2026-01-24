import { render, screen } from '@testing-library/react';
import Navbar from './components/Navbar';

test('renders brand link', () => {
  render(<Navbar />);
  expect(screen.getByText(/MobileStore/i)).toBeInTheDocument();
});
