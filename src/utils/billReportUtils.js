import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Generate PDF report for a single bill
 * @param {Object} bill - The bill object
 */
export const generateBillPDF = async (bill) => {
  try {
    const element = document.createElement('div');
    element.innerHTML = generateBillHTML(bill);
    element.style.padding = '20px';
    element.style.backgroundColor = 'white';
    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Bill-${bill.billNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.removeChild(element);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generate Excel report for multiple bills
 * @param {Array} bills - Array of bill objects
 */
export const generateBillsExcel = (bills) => {
  try {
    if (!bills || bills.length === 0) {
      alert('No bills to export');
      return;
    }

    // Prepare data for Excel
    const excelData = [];

    bills.forEach((bill, billIdx) => {
      // Add bill header
      excelData.push({
        'Bill Number': bill.billNumber,
        'Customer': bill.userName || bill.userEmail || 'N/A',
        'Date': bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '',
        'Status': bill.status,
        'Payment Method': bill.paymentMethod,
        'Total Amount': `₹${Number(bill.total || 0).toFixed(2)}`,
        'Tax': `₹${Number(bill.tax || 0).toFixed(2)}`,
        'Discount': `₹${Number(bill.discount || 0).toFixed(2)}`
      });

      // Add items for this bill
      if (Array.isArray(bill.items) && bill.items.length > 0) {
        bill.items.forEach((item) => {
          excelData.push({
            'Bill Number': '',
            'Item': item.productName || item.name || 'Product',
            'Quantity': item.quantity || 0,
            'Unit Price': `₹${Number(item.unitPrice || item.price || 0).toFixed(2)}`,
            'Total Price': `₹${Number(item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0))).toFixed(2)}`,
            'Status': '',
            'Payment Method': '',
            'Total Amount': '',
            'Tax': '',
            'Discount': ''
          });
        });
      }

      // Add empty row for separation
      if (billIdx < bills.length - 1) {
        excelData.push({});
      }
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills Report');

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Bill Number
      { wch: 20 }, // Customer/Item
      { wch: 12 }, // Date/Quantity
      { wch: 15 }, // Status/Unit Price
      { wch: 15 }, // Payment Method/Total Price
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Tax
      { wch: 15 }  // Discount
    ];
    worksheet['!cols'] = colWidths;

    // Save the file
    XLSX.writeFile(workbook, `Bills-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    alert('Failed to generate Excel file. Please try again.');
  }
};

/**
 * Generate monthly bills summary Excel
 * @param {Array} bills - Array of bill objects
 */
export const generateMonthlyBillsSummary = (bills) => {
  try {
    if (!bills || bills.length === 0) {
      alert('No bills to export');
      return;
    }

    // Group bills by month
    const monthlyData = {};

    bills.forEach((bill) => {
      const billDate = new Date(bill.billDate || new Date());
      const monthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: billDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          totalBills: 0,
          totalAmount: 0,
          totalTax: 0,
          totalDiscount: 0,
          bills: []
        };
      }

      monthlyData[monthKey].totalBills += 1;
      monthlyData[monthKey].totalAmount += Number(bill.total || 0);
      monthlyData[monthKey].totalTax += Number(bill.tax || 0);
      monthlyData[monthKey].totalDiscount += Number(bill.discount || 0);
      monthlyData[monthKey].bills.push(bill);
    });

    // Create summary sheet
    const summaryData = Object.values(monthlyData).map(month => ({
      'Month': month.month,
      'Total Bills': month.totalBills,
      'Total Amount': `₹${month.totalAmount.toFixed(2)}`,
      'Total Tax': `₹${month.totalTax.toFixed(2)}`,
      'Total Discount': `₹${month.totalDiscount.toFixed(2)}`,
      'Average Bill Value': `₹${(month.totalAmount / month.totalBills).toFixed(2)}`
    }));

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Summary');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 }
    ];

    XLSX.writeFile(workbook, `Bills-Monthly-Summary-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating monthly summary:', error);
    alert('Failed to generate monthly summary. Please try again.');
  }
};

/**
 * Generate HTML for bill printing
 * @param {Object} bill - The bill object
 */
const generateBillHTML = (bill) => {
  const safeNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const getItemName = (item) => item.productName || item.name || 'Product';
  const getUnitPrice = (item) => item.unitPrice !== undefined ? item.unitPrice : (item.price !== undefined ? item.price : 0);
  const getTotalPrice = (item) => item.totalPrice !== undefined ? item.totalPrice : (getUnitPrice(item) * (item.quantity || 0));

  const printTime = new Date().toLocaleString();
  const shopName = 'Mobile Shop';
  const shopAddress = 'Pandharpur';
  const shopContact = '+918421849728';

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px;">
        <div>
          <img src="/images/shop-logo.jpg" alt="logo" style="height: 60px;" />
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px;">${shopName}</h2>
          <div style="margin-top: 8px; font-size: 12px; color: #666;">${shopAddress}</div>
          <div style="font-size: 12px; color: #666;">${shopContact}</div>
          <div style="font-size: 12px; color: #666;">Mobile Store: <strong>${bill.billNumber}</strong></div>
          <div style="font-size: 12px; color: #666;">Date: <strong>${bill.billDate ? new Date(bill.billDate).toLocaleDateString() : new Date().toLocaleDateString()}</strong></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div style="width: 48%;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px;">Bill To</h4>
          <div><strong>${bill.userName || bill.userEmail || 'Customer'}</strong></div>
          <div>${bill.userEmail || ''}</div>
          <div>${bill.userAddress || ''}</div>
        </div>

        <div style="width: 48%;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px;">Customer Details</h4>
          <div>Status: <strong>${bill.status || 'N/A'}</strong></div>
          <div>Payment: <strong>${bill.paymentMethod || 'N/A'}</strong></div>
          <div>Printed: <strong>${printTime}</strong></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #fafafa;">
            <th style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px; font-weight: 600; width:48px;">#</th>
            <th style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px; font-weight: 600;">Description</th>
            <th style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; font-weight: 600; width:80px;">Qty</th>
            <th style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; font-weight: 600; width:120px;">Unit Price</th>
            <th style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; font-weight: 600; width:120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${Array.isArray(bill.items) && bill.items.length > 0 ? bill.items.map((item, idx) => `
            <tr>
              <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px;">${idx + 1}</td>
              <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px;">${getItemName(item)}</td>
              <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px;">${item.quantity || 0}</td>
              <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px;">₹${safeNum(getUnitPrice(item)).toFixed(2)}</td>
              <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px;">₹${safeNum(getTotalPrice(item)).toFixed(2)}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="5" style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px;">No items</td></tr>
          `}
        </tbody>
      </table>

      <div style="margin-top: 20px; width: 100%; display: flex; justify-content: flex-end;">
        <table style="width: 320px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px;">Subtotal</td>
            <td style="padding: 8px; text-align: right;">₹${safeNum(bill.subtotal).toFixed(2)}</td>
          </tr>
          ${safeNum(bill.tax) > 0 ? `<tr><td style="padding: 8px;">Tax</td><td style="padding: 8px; text-align: right;">₹${safeNum(bill.tax).toFixed(2)}</td></tr>` : ''}
          ${safeNum(bill.shippingCost) > 0 ? `<tr><td style="padding: 8px;">Shipping</td><td style="padding: 8px; text-align: right;">₹${safeNum(bill.shippingCost).toFixed(2)}</td></tr>` : ''}
          ${safeNum(bill.discount) > 0 ? `<tr><td style="padding: 8px;">Discount</td><td style="padding: 8px; text-align: right;">-₹${safeNum(bill.discount).toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight: 700; font-size: 16px; border-top: 2px solid #ddd;">
            <td style="padding: 8px;">Total</td>
            <td style="padding: 8px; text-align: right;">₹${safeNum(bill.total).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#777;">
        <div>
          <div>Thank you for your business!</div>
          <div>Contact: dhamdhereakanksha162@gmail.com</div>
        </div>
        <div style="text-align:center; width:200px;">
          _______________________<br />Authorized Signature
        </div>
      </div>
    </div>
  `;
};
