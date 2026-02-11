import React, { useState, useEffect } from 'react';
import { devError } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import axios from 'axios';
import { generateBillPDF, generateBillsExcel, generateMonthlyBillsSummary } from '../utils/billReportUtils';
import './BillsHistory.css';

const BillsHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setBills([]);
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    setShowAuthModal(false);
    fetchUserBills();
  }, [user]);

  const fetchUserBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bills/my-bills', {
        withCredentials: true
      });
      if (response.data.success) {
        setBills(response.data.data);
        setError(null);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Not authenticated — prompt login
        setShowAuthModal(true);
        setBills([]);
        setError('Login required');
        return;
      }
      setError(err.response?.data?.message || 'Error fetching bills');
      devError('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const safeNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;

  const getItemName = (item) => item.productName || item.name || 'Product';
  const getUnitPrice = (item) => item.unitPrice !== undefined ? item.unitPrice : (item.price !== undefined ? item.price : 0);
  const getTotalPrice = (item) => item.totalPrice !== undefined ? item.totalPrice : (getUnitPrice(item) * (item.quantity || 0));

  const handlePrintBill = (bill) => {
    const printWindow = window.open('', '', 'height=800,width=900');
    const printTime = new Date().toLocaleString();
    // Use site logo if available (public folder)
    const shopName = 'Mobile Shop';
    const shopAddress = 'pandharpur'; // Optional: fill if you have a shop address
    const shopContact = '+918421849728';

    const billHTML = `
      <html>
      <head>
        <title>Invoice - ${bill.billNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
          .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px; }
          .logo img { height: 60px; }
          .shop-info { text-align: right; }
          .shop-info h2 { margin: 0; font-size: 20px; }
          .meta { margin-top: 8px; font-size: 12px; color: #666; }

          .section { display: flex; justify-content: space-between; margin-top: 20px; }
          .bill-to, .invoice-details { width: 48%; }
          .bill-to h4, .invoice-details h4 { margin: 0 0 8px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px; }
          th { background: #fafafa; font-weight: 600; }
          td.num { text-align: right; }

          .totals { margin-top: 20px; width: 100%; display: flex; justify-content: flex-end; }
          .totals .totals-table { width: 320px; border-collapse: collapse; }
          .totals .totals-table td { padding: 8px; }
          .totals .totals-table tr.total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #ddd; }

          .footer { margin-top: 30px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#777; }
          .signature { text-align:center; width:200px; }

          @media print {
            body { margin: 0; }
            .invoice { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="invoice-header">
            <div class="logo">
              <img src="/1755792816915.jpg" alt="logo" />
            </div>
            <div class="shop-info">
              <h2>${shopName}</h2>
              ${shopAddress ? `<div class="meta">${shopAddress}</div>` : ''}
              ${shopContact ? `<div class="meta">${shopContact}</div>` : ''}
              <div class="meta">Mobile Shop: <strong>${bill.billNumber}</strong></div>
              <div class="meta">Date: <strong>${bill.billDate ? new Date(bill.billDate).toLocaleDateString() : new Date().toLocaleDateString()}</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="bill-to">
              <h4>Bill To</h4>
              <div><strong>${bill.userName || bill.userEmail || 'Customer'}</strong></div>
              <div>${bill.userEmail || ''}</div>
              <div>${bill.userAddress || ''}</div>
            </div>

            <div class="invoice-details">
              <h4>Customer bill Details</h4>
              <div>Status: <strong>${bill.status || 'N/A'}</strong></div>
              <div>Payment: <strong>${bill.paymentMethod || 'N/A'}</strong></div>
              <div>Printed: <strong>${printTime}</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:48px">#</th>
                <th>Description</th>
                <th style="width:80px" class="num">Qty</th>
                <th style="width:120px" class="num">Unit</th>
                <th style="width:120px" class="num">Total</th>
              </tr>
            </thead>
            <tbody>
              ${Array.isArray(bill.items) && bill.items.length > 0 ? bill.items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${getItemName(item)}</td>
                  <td class="num">${item.quantity || 0}</td>
                  <td class="num">₹${safeNum(getUnitPrice(item)).toFixed(2)}</td>
                  <td class="num">₹${safeNum(getTotalPrice(item)).toFixed(2)}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="5">No items</td></tr>
              `}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Subtotal</td>
                <td class="num">₹${safeNum(bill.subtotal).toFixed(2)}</td>
              </tr>
              ${safeNum(bill.tax) > 0 ? `<tr><td>Tax</td><td class="num">₹${safeNum(bill.tax).toFixed(2)}</td></tr>` : ''}
              ${safeNum(bill.shippingCost) > 0 ? `<tr><td>Shipping</td><td class="num">₹${safeNum(bill.shippingCost).toFixed(2)}</td></tr>` : ''}
              ${safeNum(bill.discount) > 0 ? `<tr><td>Discount</td><td class="num">-₹${safeNum(bill.discount).toFixed(2)}</td></tr>` : ''}
              <tr class="total-row"><td>Total</td><td class="num">₹${safeNum(bill.total).toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="footer">
            <div>
              <div>Thank you for your business!</div>
              <div>If you have any questions, contact us at dhamdhereakanksha162@gmail.com</div>
            </div>
            <div class="signature">
              _______________________<br />Authorized Signature
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    if (printWindow) {
      if (printWindow.document) {
        printWindow.document.write(billHTML);
        printWindow.document.close();
      }
      if (typeof printWindow.focus === 'function') {
        printWindow.focus();
      }
      if (typeof printWindow.print === 'function') {
        printWindow.print();
      }
    }
  };

  const isNotCancelled = (bill) => {
    const s = (bill.status || '').toLowerCase();
    return s !== 'cancelled' && s !== 'canceled';
  };

  const filteredBills = filterStatus 
    ? bills.filter(bill => isNotCancelled(bill) && (bill.status || '').toLowerCase() === filterStatus.toLowerCase())
    : bills.filter(isNotCancelled);

  if (showAuthModal) {
    return (
      <AuthModal
        onClose={() => {
          setShowAuthModal(false);
          navigate(-1);
        }}
        setUser={() => {
          setShowAuthModal(false);
        }}
      />
    );
  }

  if (loading) return <div className="bills-loading">Loading your bills...</div>;
  if (error) return <div className="bills-error">Error: {error}</div>;

  return (
    <div className="bills-history-container">
      <div className="bills-header">
        <h1>My Bills & Invoices</h1>
        <p>View and download your bills and invoices</p>
      </div>

      {selectedBill ? (
        <div className="bill-detail-view">
          <button className="btn-back" onClick={() => setSelectedBill(null)}>← Back to List</button>
          
          <div className="bill-detail-card">
            <div className="detail-header">
              <h2>{selectedBill.billNumber || '—'}</h2>
              <span className={`status-badge ${(selectedBill.status || '').toLowerCase()}`}>
                {selectedBill.status || 'N/A'}
              </span>
            </div>

            <div className="detail-grid">
              <div className="detail-section">
                <h3>Bill Information</h3>
                <p><strong>Date:</strong> {selectedBill.billDate ? new Date(selectedBill.billDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Payment Method:</strong> {selectedBill.paymentMethod || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Recipient</h3>
                <p><strong>{selectedBill.userName || selectedBill.userEmail || 'Customer'}</strong></p>
                <p>{selectedBill.userEmail || 'N/A'}</p>
                <p>{selectedBill.userAddress || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-items">
              <h3>Items</h3>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, index) => {
                    const name = item.productName || item.name || 'Product';
                    const qty = item.quantity || 0;
                    const unit = Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : (Number.isFinite(Number(item.price)) ? Number(item.price) : 0);
                    const total = Number.isFinite(Number(item.totalPrice)) ? Number(item.totalPrice) : (unit * qty);
                    return (
                      <tr key={index}>
                        <td>{name}</td>
                        <td>{qty}</td>
                        <td>₹{unit.toFixed(2)}</td>
                        <td>₹{total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="detail-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{(Number.isFinite(Number(selectedBill.subtotal)) ? Number(selectedBill.subtotal) : 0).toFixed(2)}</span>
              </div>
              {Number(selectedBill.tax || 0) > 0 && (
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>₹{(Number.isFinite(Number(selectedBill.tax)) ? Number(selectedBill.tax) : 0).toFixed(2)}</span>
                </div>
              )}
              {Number(selectedBill.shippingCost || 0) > 0 && (
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>₹{(Number.isFinite(Number(selectedBill.shippingCost)) ? Number(selectedBill.shippingCost) : 0).toFixed(2)}</span>
                </div>
              )}
              {Number(selectedBill.discount || 0) > 0 && (
                <div className="summary-row">
                  <span>Discount:</span>
                  <span>-₹{(Number.isFinite(Number(selectedBill.discount)) ? Number(selectedBill.discount) : 0).toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>₹{(Number.isFinite(Number(selectedBill.total)) ? Number(selectedBill.total) : 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn-print" onClick={() => handlePrintBill(selectedBill)}>
                🖨️ Print Bill
              </button>
              <button className="btn-pdf" onClick={() => generateBillPDF(selectedBill)} style={{ backgroundColor: '#d32f2f', marginLeft: '10px' }}>
                📄 Download PDF
              </button>
              <button className="btn-close" onClick={() => setSelectedBill(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bills-filter">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button 
                onClick={() => generateBillsExcel(filteredBills)}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={filteredBills.length === 0}
              >
                📊 Export to Excel
              </button>
              <button 
                onClick={() => generateMonthlyBillsSummary(filteredBills)}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={filteredBills.length === 0}
              >
                📈 Monthly Summary
              </button>
            </div>
          </div>

          {filteredBills.length > 0 ? (
            <div className="bills-grid">
              {filteredBills.map(bill => (
                <div key={bill._id} className="bill-card">
                  <div className="card-header">
                    <h3>{bill.billNumber}</h3>
                    <span className={`badge ${(bill.status || '').toLowerCase()}`}>
                      {bill.status || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <p><strong>Date:</strong> {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Amount:</strong> <span className="amount">₹{(Number.isFinite(Number(bill.total)) ? Number(bill.total) : 0).toFixed(2)}</span></p>
                    <p><strong>Items:</strong> {Array.isArray(bill.items) ? bill.items.length : 0}</p>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="btn-view"
                      onClick={() => setSelectedBill(bill)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn-print"
                      onClick={() => handlePrintBill(bill)}
                    >
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-bills">
              <p>No bills found</p>
              {filterStatus && <p>Try changing your filter</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BillsHistory;
