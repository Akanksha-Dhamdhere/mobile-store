import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { devError } from '../utils/logger';
import { toast } from 'react-toastify';
import { safeToFixed } from '../utils/format';
// report utilities are available via export functions where needed; remove unused imports
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
  const [viewMode, setViewMode] = useState('all'); // 'all', 'daily', 'weekly', 'monthly'
  const [dailyBills, setDailyBills] = useState([]);
  const [weeklyBills, setWeeklyBills] = useState([]);
  const [monthlyBills, setMonthlyBills] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');

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

  const fetchBills = useCallback(async () => {
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
      devError('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get('/api/bills/stats/all', {
        withCredentials: true
      });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      devError('Error fetching statistics:', err);
    }
  }, []);

  const fetchWeeklyBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod);

      const response = await axios.get(`/api/bills/filter/weekly?${params}`, {
        withCredentials: true
      });
      if (response.data.success) {
        setWeeklyBills(response.data.data);
      }
    } catch (err) {
      devError('Error fetching weekly bills:', err);
      toast.error('Error fetching weekly bills');
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterStatus, filterPaymentMethod]);

  const fetchMonthlyBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod);

      const response = await axios.get(`/api/bills/filter/monthly?${params}`, {
        withCredentials: true
      });
      if (response.data.success) {
        setMonthlyBills(response.data.data);
      }
    } catch (err) {
      devError('Error fetching monthly bills:', err);
      toast.error('Error fetching monthly bills');
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterStatus, filterPaymentMethod]);

  const fetchDailyBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod);

      const response = await axios.get(`/api/bills/filter/daily?${params}`, {
        withCredentials: true
      });
      if (response.data.success) {
        setDailyBills(response.data.data);
      }
    } catch (err) {
      devError('Error fetching daily bills:', err);
      toast.error('Error fetching daily bills');
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterStatus, filterPaymentMethod]);

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDailyBills();
    } else if (viewMode === 'weekly') {
      fetchWeeklyBills();
    } else if (viewMode === 'monthly') {
      fetchMonthlyBills();
    } else {
      fetchBills();
    }
    fetchStatistics();
  }, [viewMode, filterStatus, filterPaymentMethod, filterStartDate, filterEndDate, searchTerm, fetchBills, fetchDailyBills, fetchWeeklyBills, fetchMonthlyBills, fetchStatistics]);

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

  // Export to PDF
  const exportToPDF = async (title, data, elementIdArg) => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const elementId = elementIdArg || (viewMode === 'daily' ? 'daily-bills-report' : viewMode === 'weekly' ? 'weekly-bills-report' : 'monthly-bills-report');
      const element = document.getElementById(elementId);
      if (!element) {
        devError('exportToPDF: report element not found:', elementId);
        toast.error('Report element not found');
        return;
      }

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297; // A4 width in mm (landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pageHeight = 210; // A4 height in mm (landscape)
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      devError('Error generating PDF:', err);
      toast.error('Error generating PDF');
    }
  };

  // Export to Excel
  const exportToExcel = (title, data) => {
    try {
      const XLSX = require('xlsx');
      
      // Transform data for Excel
      const excelData = [];
      
      if (viewMode === 'daily' && data.length > 0) {
        data.forEach((day) => {
          excelData.push({
            'Date': day.dayLabel,
            'Total Bills': day.totalBills,
            'Revenue (₹)': safeToFixed(day.totalRevenue),
            'Tax (₹)': safeToFixed(day.totalTax),
            'Discount (₹)': safeToFixed(day.totalDiscount || 0),
            'Average Value (₹)': safeToFixed(day.averageValue)
          });
          
          // Add bills details
          day.bills?.forEach((bill) => {
            excelData.push({
              'Date': '',
              'Bill Number': bill.billNumber,
              'Customer': bill.userName,
              'Amount (₹)': safeToFixed(bill.total),
              'Status': bill.status,
              'Payment Method': bill.paymentMethod
            });
          });
          
          excelData.push({}); // Empty row for spacing
        });
      } else if (viewMode === 'weekly' && data.length > 0) {
        data.forEach((week) => {
          excelData.push({
            'Week': week.weekLabel,
            'Total Bills': week.totalBills,
            'Revenue (₹)': safeToFixed(week.totalRevenue),
            'Average Value (₹)': safeToFixed(week.averageValue)
          });
          
          week.bills?.forEach((bill) => {
            excelData.push({
              'Week': '',
              'Bill Number': bill.billNumber,
              'Customer': bill.userName,
              'Amount (₹)': safeToFixed(bill.total),
              'Status': bill.status
            });
          });
          
          excelData.push({});
        });
      } else if (viewMode === 'monthly' && data.length > 0) {
        data.forEach((month) => {
          excelData.push({
            'Month': month.monthLabel,
            'Total Bills': month.totalBills,
            'Revenue (₹)': safeToFixed(month.totalRevenue),
            'Tax (₹)': safeToFixed(month.totalTax),
            'Discount (₹)': safeToFixed(month.totalDiscount),
            'Average Value (₹)': safeToFixed(month.averageValue)
          });
          
          month.bills?.forEach((bill) => {
            excelData.push({
              'Month': '',
              'Bill Number': bill.billNumber,
              'Customer': bill.userName,
              'Amount (₹)': safeToFixed(bill.total),
              'Tax (₹)': safeToFixed(bill.tax),
              'Status': bill.status
            });
          });
          
          excelData.push({});
        });
      }

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bills Report');
      
      ws['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
      ];

      XLSX.writeFile(wb, `${title}_${new Date().toLocaleDateString()}.xlsx`);
      toast.success('Excel file downloaded successfully!');
    } catch (err) {
      devError('Error generating Excel:', err);
      toast.error('Error generating Excel file');
    }
  };

  // Handle Print
  const handlePrint = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Report element not found');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Bills Report</title>');
    printWindow.document.write(`<style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #3498db; color: white; }
      .header { margin-bottom: 20px; }
      .stats { display: flex; gap: 20px; margin: 10px 0; }
      .stat { flex: 1; }
      @media print { body { margin: 0; } }
    </style>`);
    printWindow.document.write('</head><body>');
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
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
        <div className="control-row">
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

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="filter-select"
          >
            <option value="">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Online">Online</option>
          </select>
        </div>

        <div className="control-row">
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="filter-date"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="filter-date"
            placeholder="End Date"
          />
        </div>

        <div className="view-mode-buttons">
          <button
            className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All Bills
          </button>
          <button
            className={`view-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            Daily View
          </button>
          <button
            className={`view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly View
          </button>
          <button
            className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly View
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="daily-bills-container">
          <div className="report-header">
            <h2>Daily Bills Report</h2>
            <div className="export-buttons">
              <button 
                className="btn-export btn-print"
                onClick={() => handlePrint('daily-bills-report')}
                title="Print Report"
              >
                🖨️ Print
              </button>
              <button 
                className="btn-export btn-pdf"
                onClick={() => exportToPDF('Daily_Bills_Report', dailyBills, 'daily-bills-report')}
                title="Export as PDF"
              >
                📄 PDF
              </button>
              <button 
                className="btn-export btn-excel"
                onClick={() => exportToExcel('Daily_Bills_Report', dailyBills)}
                title="Export as Excel"
              >
                📊 Excel
              </button>
            </div>
          </div>
          <div id="daily-bills-report">
          {dailyBills.length > 0 ? (
            dailyBills.map((day, idx) => (
              <div key={idx} className="day-section">
                <div className="day-header">
                  <h3>{day.dayLabel}</h3>
                  <div className="day-stats">
                    <span>Bills: {day.totalBills}</span>
                    <span>Revenue: ₹{safeToFixed(day.totalRevenue)}</span>
                    <span>Tax: ₹{safeToFixed(day.totalTax)}</span>
                    <span>Avg: ₹{safeToFixed(day.averageValue)}</span>
                  </div>
                </div>
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.bills.map(bill => (
                      <tr key={bill._id}>
                        <td>{bill.billNumber}</td>
                        <td>{bill.userName}</td>
                        <td>₹{safeToFixed(bill.total)}</td>
                        <td><span className={`status-badge ${(bill.status || '').toLowerCase()}`}>{bill.status}</span></td>
                        <td>{new Date(bill.createdAt).toLocaleString()}</td>
                        <td>
                          <button onClick={() => setSelectedBill(bill)} className="view-btn-small">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="no-data-message">No daily bills found</p>
          )}
          </div>
        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="weekly-bills-container">
          <div className="report-header">
            <h2>Weekly Bills Report</h2>
            <div className="export-buttons">
              <button 
                className="btn-export btn-print"
                onClick={() => handlePrint('weekly-bills-report')}
                title="Print Report"
              >
                🖨️ Print
              </button>
              <button 
                className="btn-export btn-pdf"
                onClick={() => exportToPDF('Weekly_Bills_Report', weeklyBills, 'weekly-bills-report')}
                title="Export as PDF"
              >
                📄 PDF
              </button>
              <button 
                className="btn-export btn-excel"
                onClick={() => exportToExcel('Weekly_Bills_Report', weeklyBills)}
                title="Export as Excel"
              >
                📊 Excel
              </button>
            </div>
          </div>
          <div id="weekly-bills-report">
          {weeklyBills.length > 0 ? (
            weeklyBills.map((week, idx) => (
              <div key={idx} className="week-section">
                <div className="week-header">
                  <h3>{week.weekLabel}</h3>
                  <div className="week-stats">
                    <span>Bills: {week.totalBills}</span>
                    <span>Revenue: ₹{safeToFixed(week.totalRevenue)}</span>
                    <span>Avg: ₹{safeToFixed(week.averageValue)}</span>
                  </div>
                </div>
                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.bills.map(bill => (
                      <tr key={bill._id}>
                        <td>{bill.billNumber}</td>
                        <td>{bill.userName}</td>
                        <td>₹{safeToFixed(bill.total)}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="no-data">No bills found for selected week(s)</p>
          )}
          </div>
        </div>
      )}

      {viewMode === 'monthly' && (
        <div className="monthly-bills-container">
          <div className="report-header">
            <h2>Monthly Bills Report</h2>
            <div className="export-buttons">
              <button 
                className="btn-export btn-print"
                onClick={() => handlePrint('monthly-bills-report')}
                title="Print Report"
              >
                🖨️ Print
              </button>
              <button 
                className="btn-export btn-pdf"
                onClick={() => exportToPDF('Monthly_Bills_Report', monthlyBills, 'monthly-bills-report')}
                title="Export as PDF"
              >
                📄 PDF
              </button>
              <button 
                className="btn-export btn-excel"
                onClick={() => exportToExcel('Monthly_Bills_Report', monthlyBills)}
                title="Export as Excel"
              >
                📊 Excel
              </button>
            </div>
          </div>
          <div id="monthly-bills-report">
          {monthlyBills.length > 0 ? (
            monthlyBills.map((month, idx) => (
              <div key={idx} className="month-section">
                <div className="month-header">
                  <h3>{month.monthLabel}</h3>
                  <div className="month-stats">
                    <span>Bills: {month.totalBills}</span>
                    <span>Revenue: ₹{safeToFixed(month.totalRevenue)}</span>
                    <span>Tax: ₹{safeToFixed(month.totalTax)}</span>
                    <span>Discount: ₹{safeToFixed(month.totalDiscount)}</span>
                  </div>
                </div>

                {month.statusSummary && Object.keys(month.statusSummary).length > 0 && (
                  <div className="status-breakdown">
                    <h4>Status Breakdown:</h4>
                    {Object.entries(month.statusSummary).map(([status, data]) => (
                      <div key={status} className="status-item">
                        <span className={`status-label ${status.toLowerCase()}`}>{status}</span>
                        <span className="status-count">{data.count} bills</span>
                        <span className="status-amount">₹{safeToFixed(data.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <table className="bills-table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Tax</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {month.bills.map(bill => (
                      <tr key={bill._id}>
                        <td>{bill.billNumber}</td>
                        <td>{bill.userName}</td>
                        <td>₹{safeToFixed(bill.total)}</td>
                        <td>₹{safeToFixed(bill.tax)}</td>
                        <td>
                          <span className={`status ${(bill.status || '').toLowerCase()}`}>
                            {bill.status || 'N/A'}
                          </span>
                        </td>
                        <td>{bill.paymentMethod}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p className="no-data">No bills found for selected month(s)</p>
          )}
          </div>
        </div>
      )}

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
        <>
          {viewMode === 'all' && (
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
        </>
      )}
    </div>
  );
};

export default AdminBillManagement;
