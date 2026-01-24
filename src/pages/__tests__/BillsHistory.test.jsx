import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BillsHistory from '../BillsHistory';
import axios from 'axios';

jest.mock('axios');
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'test-user' } })
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../components/AuthModal', () => () => null);

describe('BillsHistory', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url === '/api/bills/my-bills') {
        return Promise.resolve({ data: { success: true, data: [
          { _id: 'b1', billNumber: 'BILL-1', total: null, items: null, subtotal: null, status: 'Paid', billDate: null, userName: null, userEmail: null },
          { _id: 'b2', billNumber: 'BILL-2', total: 1500, items: [{ productName: 'X', quantity: 1, unitPrice: 1500, totalPrice: 1500 }], subtotal: 1500, tax: 0, shippingCost: 0, discount: 0, status: 'Pending', billDate: Date.now(), userName: 'User', userEmail: 'u@test' }
        ]}});
      }
      return Promise.resolve({ data: { success: false } });
    });
  });

  test('renders bill list and opens detail view without throwing when fields missing', async () => {
    render(<BillsHistory />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/bills/my-bills', expect.any(Object)));

    // Bill cards should show (wait for async render)
    await screen.findByText('BILL-1');
    await screen.findByText('BILL-2');

    // Click View Details on second bill
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[1]);

    // Wait for detail view to render
    await screen.findByText(/Total Amount/i);

    // Should display total (formatted) for second bill
    const amounts = screen.getAllByText(/₹1500.00/);
    expect(amounts.length).toBeGreaterThan(0);

    // Click Print (should not throw)
    const fakeWin = { document: { write: jest.fn(), close: jest.fn() }, print: jest.fn() };
    window.open = jest.fn(() => fakeWin);
    const printBtn = screen.getByText('🖨️ Print Bill');
    fireEvent.click(printBtn);
    expect(window.open).toHaveBeenCalled();
    expect(fakeWin.document.write).toHaveBeenCalled();
  });
});
