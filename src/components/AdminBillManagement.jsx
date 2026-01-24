import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { safeToFixed } from '../utils/format';
import './AdminBillManagement.css';

const AdminBillManagement = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    orderId: '',
    items: [],
    subtotal: 0,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    paymentMethod: 'Online',
    notes: ''
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // fetch bills
        const billsResp = await axios.get('/api/bills', { withCredentials: true });
        if (billsResp.data?.success) {
          let filteredBills = billsResp.data.data;

          if (filterStatus) {
            filteredBills = filteredBills.filter(bill => (bill.status || '').toLowerCase() === filterStatus.toLowerCase());
          }

          if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            filteredBills = filteredBills.filter(bill =>
              (bill.billNumber || '').toLowerCase().includes(termLower) ||
              (bill.userName || '').toLowerCase().includes(termLower) ||
              (bill.userEmail || '').toLowerCase().includes(termLower)
            );
          }

          setBills(filteredBills);
        }

        // fetch statistics
        const statsResp = await axios.get('/api/bills/stats/all', { withCredentials: true });
        if (statsResp.data?.success) {
          setStatistics(statsResp.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching bills');
        console.error('Error fetching bills/statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [filterStatus, searchTerm]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bills', {
        withCredentials: true
      });
      if (response.data.success) {
        let filteredBills = response.data.data;
        
        if (filterStatus) {
          filteredBills = filteredBills.filter(bill => (bill.status || '').toLowerCase() === filterStatus.toLowerCase());
        }
        
        if (searchTerm) {
          const termLower = searchTerm.toLowerCase();
          filteredBills = filteredBills.filter(bill =>
            (bill.billNumber || '').toLowerCase().includes(termLower) ||
            (bill.userName || '').toLowerCase().includes(termLower) ||
            (bill.userEmail || '').toLowerCase().includes(termLower)
          );
        }
        
        setBills(filteredBills);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching bills');
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/bills/stats/all', {
        withCredentials: true
      });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/bills', formData, {
        withCredentials: true
      });
      if (response.data.success) {
        setShowCreateForm(false);
        setFormData({
          orderId: '',
          items: [],
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          paymentMethod: 'Online',
          notes: ''
        });
        fetchBills();
        fetchStatistics();
        toast.success('Bill created successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating bill');
    }
  };

  const handleUpdateBillStatus = async (billId, newStatus) => {
    try {
      // Optimistically update UI
      setBills(prev => prev.map(b => b._id === billId ? ({ ...b, status: newStatus }) : b));
      if (selectedBill && selectedBill._id === billId) {
        setSelectedBill(prev => prev ? ({ ...prev, status: newStatus }) : prev);
      }

      const response = await axios.patch(`/api/bills/${billId}/status`, 
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        const updated = response.data.data;
        // Ensure local states are in sync with server response
        setBills(prev => prev.map(b => b._id === updated._id ? updated : b));
        if (selectedBill && selectedBill._id === updated._id) {
          setSelectedBill(updated);
        }

        // Refresh statistics and ensure table is consistent
        fetchStatistics();

        toast.success('Bill status updated!');
      }
    } catch (err) {
      // Revert optimistic update on error
      fetchBills();
      toast.error(err.response?.data?.message || 'Error updating bill');
    }
  };

  const handleDeleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await axios.delete(`/api/bills/${billId}`, {
          withCredentials: true
        });
        fetchBills();
        fetchStatistics();
        toast.success('Bill deleted successfully!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error deleting bill');
      }
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
  };


  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredBills = (() => {
    if (!searchTerm) return bills.filter(b => !filterStatus || (b.status || '').toLowerCase() === filterStatus.toLowerCase());
    const termLower = searchTerm.toLowerCase();
    return bills.filter(bill =>
      ((bill.billNumber || '').toLowerCase().includes(termLower) ||
        (bill.userName || '').toLowerCase().includes(termLower) ||
        (bill.userEmail || '').toLowerCase().includes(termLower)) &&
      (!filterStatus || (bill.status || '').toLowerCase() === filterStatus.toLowerCase())
    );
  })();

  if (loading) return <div className="admin-bill-loading">Loading bills...</div>;
  if (error) return <div className="admin-bill-error">Error: {error}</div>;

  return (
    <div className="admin-bill-container">
      <div className="admin-bill-header">
        <h1>Bill Management</h1>
        <button
          className="btn-create-bill"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create Bill'}
        </button>
      </div>

      {statistics && (
        <div className="bill-statistics">
          <div className="stat-card">
            <h3>Total Bills</h3>
            <p className="stat-number">{statistics.totalBills}</p>
          </div>
          <div className="stat-card">
            <h3>Paid Bills</h3>
            <p className="stat-number">{statistics.paidBills}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Bills</h3>
            <p className="stat-number">{statistics.pendingBills}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-number">₹{safeToFixed(statistics.totalRevenue)}</p>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bill-form-container">
          <h2>Create New Bill</h2>
          <form onSubmit={handleCreateBill} className="bill-form">
            <div className="form-group">
              <label>Order ID *</label>
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleFormChange}
                required
                placeholder="Enter Order ID"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Subtotal *</label>
                <input
                  type="number"
                  name="subtotal"
                  value={formData.subtotal}
                  onChange={handleFormChange}
                  required
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Tax</label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleFormChange}
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Shipping Cost</label>
                <input
                  type="number"
                  name="shippingCost"
                  value={formData.shippingCost}
                  onChange={handleFormChange}
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Discount</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleFormChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                >
                  <option>Online</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="4"
                placeholder="Add any notes for this bill"
              ></textarea>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">Create Bill</button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bill-controls">
        <input
          type="text"
          placeholder="Search by bill number, customer name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

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
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {selectedBill ? (
        <div className="bill-detail-container">
          <button className="btn-back" onClick={() => setSelectedBill(null)}>← Back to List</button>
          
          <div className="bill-detail">
            <div className="detail-header">
              <h2>{selectedBill.billNumber || '—'}</h2>
              <span className={`status-badge ${(selectedBill.status || '').toLowerCase()}`}>
                {selectedBill.status || 'N/A'}
              </span>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h3>Bill Information</h3>
                <p><strong>Customer:</strong> {selectedBill.userName || selectedBill.userEmail || 'Customer'}</p>
                <p><strong>Email:</strong> {selectedBill.userEmail || 'N/A'}</p>
                <p><strong>Address:</strong> {selectedBill.userAddress || 'N/A'}</p>
                <p><strong>Date:</strong> {selectedBill.billDate ? new Date(selectedBill.billDate).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Amount Details</h3>
                <p><strong>Subtotal:</strong> ₹{(Number.isFinite(Number(selectedBill.subtotal)) ? Number(selectedBill.subtotal) : 0).toFixed(2)}</p>
                <p><strong>Tax:</strong> ₹{(Number.isFinite(Number(selectedBill.tax)) ? Number(selectedBill.tax) : 0).toFixed(2)}</p>
                <p><strong>Shipping:</strong> ₹{(Number.isFinite(Number(selectedBill.shippingCost)) ? Number(selectedBill.shippingCost) : 0).toFixed(2)}</p>
                <p><strong>Discount:</strong> ₹{(Number.isFinite(Number(selectedBill.discount)) ? Number(selectedBill.discount) : 0).toFixed(2)}</p>
                <p className="total"><strong>Total:</strong> ₹{(Number.isFinite(Number(selectedBill.total)) ? Number(selectedBill.total) : 0).toFixed(2)}</p>
              </div>

              <div className="detail-section">
                <h3>Status Update</h3>
                <div className="status-buttons">
                  {['Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled'].map(status => (
                    <button
                      key={status}
                      className={`status-btn ${selectedBill.status === status ? 'active' : ''}`}
                      onClick={() => handleUpdateBillStatus(selectedBill._id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBill.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p>{selectedBill.notes}</p>
                </div>
              )}
            </div>

            <div className="detail-actions">
              <button className="btn-delete" onClick={() => {
                handleDeleteBill(selectedBill._id);
                setSelectedBill(null);
              }}>
                Delete Bill
              </button>
              <button className="btn-close" onClick={() => setSelectedBill(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bills-table-container">
          <table className="bills-table">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map(bill => (
                  <tr key={bill._id}>
                    <td>{bill.billNumber}</td>
                    <td>{bill.userName}</td>
                    <td>{bill.userEmail}</td>
                    <td>₹{(Number.isFinite(Number(bill.total)) ? Number(bill.total) : 0).toFixed(2)}</td>
                    <td>
                      <span className={`status ${(bill.status || '').toLowerCase()}`}>
                        {bill.status || 'N/A'}
                      </span>
                    </td>
                    <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleViewBill(bill)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">No bills found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBillManagement;
