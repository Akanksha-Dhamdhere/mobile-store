import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { devError } from '../utils/logger';
import './Bill.css';

const Bill = ({ orderId }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safe currency formatter — returns '0.00' when input is invalid
  const formatCurrency = (val) => {
    const n = Number.parseFloat(val);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add retry logic in case bill hasn't been created yet
        let attempts = 0;
        const maxAttempts = 5;
        let response = null;
        
        while (attempts < maxAttempts) {
          try {
            response = await axios.get(`/api/bills/order/${orderId}`, {
              withCredentials: true
            });
            
            if (response.data?.success) {
              setBill(response.data.data);
              return;
            }
          } catch (err) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        // If we get here, bill wasn't found after retries
        if (!response?.data?.success) {
          setBill(null);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Error fetching bill');
        devError('Error fetching bill:', err);
      } finally {
        setLoading(false);
      }
      
    };

    if (orderId) {
      fetchBill();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      // You can implement actual PDF download here
      const element = document.getElementById('bill-container');
      if (element) {
        window.print();
      }
    } catch (err) {
      devError('Error downloading PDF:', err);
    }
  };

  if (loading) return <div className="bill-loading">Loading bill...</div>;
  if (error) return <div className="bill-error">Error: {error}</div>;
  if (!bill) return <div className="bill-no-data">No bill found for this order</div>;

  return (
    <div className="bill-container" id="bill-container">
      <div className="bill-header">
        <div className="bill-title">
          <h1>INVOICE</h1>
          <p className="bill-number">Bill #: {bill.billNumber}</p>
        </div>
        <div className="bill-date">
          <p><strong>Invoice Date:</strong> {new Date(bill.billDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span className={`bill-status ${(bill.status || '').toLowerCase()}`}>{bill.status || 'Unknown'}</span></p>
        </div>
      </div>

      <div className="bill-content">
        <div className="bill-section">
          <div className="bill-from">
            <h3>Bill From</h3>
            <p><strong>Company Name</strong></p>
            <p>Contact email: support@company.com</p>
          </div>

          <div className="bill-to">
            <h3>Bill To</h3>
            <p><strong>{bill.userName}</strong></p>
            <p>Email: {bill.userEmail}</p>
            {bill.userAddress && <p>Address: {bill.userAddress}</p>}
          </div>
        </div>

        <div className="bill-items-section">
          <h3>Order Details</h3>
          <table className="bill-items-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {bill.items && bill.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>₹{formatCurrency(item.unitPrice)}</td>
                  <td>₹{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))} 
            </tbody>
          </table>
        </div>

        <div className="bill-summary">
          <div className="summary-item">
            <span>Subtotal:</span>
            <span>₹{formatCurrency(bill.subtotal)}</span>
          </div> 
          {bill.tax > 0 && (
            <div className="summary-item">
              <span>Tax ({formatCurrency(bill.taxPercentage)}%):</span>
              <span>₹{formatCurrency(bill.tax)}</span>
            </div>
          )} 
          {bill.shippingCost > 0 && (
            <div className="summary-item">
              <span>Shipping Cost:</span>
              <span>₹{formatCurrency(bill.shippingCost)}</span>
            </div>
          )} 
          {bill.discount > 0 && (
            <div className="summary-item">
              <span>Discount:</span>
              <span>-₹{formatCurrency(bill.discount)}</span>
            </div>
          )} 
          <div className="summary-item total">
            <span>Total Amount:</span>
            <span>₹{formatCurrency(bill.total)}</span>
          </div> 
        </div>

        {bill.notes && (
          <div className="bill-notes">
            <h4>Notes</h4>
            <p>{bill.notes}</p>
          </div>
        )}

        <div className="bill-footer">
          <p>Payment Method: {bill.paymentMethod}</p>
          <p>Thank you for your purchase!</p>
        </div>
      </div>

      <div className="bill-actions no-print">
        <button className="btn btn-primary" onClick={handlePrint}>
          Print Bill
        </button>
        <button className="btn btn-secondary" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default Bill;
