import type { Sale, User } from '../types.ts';

export const generateAndPrintInvoice = (sale: Sale, shopDetails: User): void => {
  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${sale.id.substring(0, 8)}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            body {
                font-family: 'Roboto', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
                -webkit-print-color-adjust: exact;
            }
            .invoice-box {
                max-width: 800px;
                margin: auto;
                padding: 30px;
                border: 1px solid #eee;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
                background-color: #fff;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .shop-details {
                text-align: left;
            }
            .shop-details h1 {
                margin: 0;
                font-size: 24px;
                color: #333;
            }
            .shop-details p {
                margin: 2px 0;
                font-size: 14px;
                color: #555;
            }
            .shop-logo {
                max-width: 120px;
                max-height: 120px;
            }
            .invoice-details {
                text-align: right;
            }
            .invoice-details p {
                margin: 2px 0;
                font-size: 14px;
            }
            table {
                width: 100%;
                line-height: inherit;
                text-align: left;
                border-collapse: collapse;
            }
            table th, table td {
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            table th {
                background-color: #f9f9f9;
                font-weight: 500;
            }
            table tr.total td {
                border-top: 2px solid #aaa;
                font-weight: bold;
                font-size: 16px;
            }
            .text-right {
                text-align: right;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="shop-details">
                    ${shopDetails.shopLogo ? `<img src="${shopDetails.shopLogo}" alt="Shop Logo" class="shop-logo">` : ''}
                    <h1>${shopDetails.shopName}</h1>
                    ${shopDetails.shopAddress ? `<p>${shopDetails.shopAddress.replace(/\n/g, '<br>')}</p>` : ''}
                    ${shopDetails.shopPhoneNumber ? `<p>Phone: ${shopDetails.shopPhoneNumber}</p>` : ''}
                    ${shopDetails.gstNumber ? `<p><strong>GSTIN:</strong> ${shopDetails.gstNumber}</p>` : ''}
                </div>
                <div class="invoice-details">
                    <p><strong>Invoice #:</strong> ${sale.id.substring(0, 8)}</p>
                    <p><strong>Date:</strong> ${new Date(sale.date).toLocaleString()}</p>
                    <p><strong>Payment Method:</strong> ${sale.paymentMethod}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">₹${item.price.toFixed(2)}</td>
                            <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <table style="width: 300px;">
                    <tr>
                        <td>Subtotal</td>
                        <td class="text-right">₹${sale.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>SGST</td>
                        <td class="text-right">₹${sale.sgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>CGST</td>
                        <td class="text-right">₹${sale.cgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total">
                        <td>Total</td>
                        <td class="text-right">₹${sale.total.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            <div class="footer">
                <p>Thank you for your business!</p>
            </div>
        </div>
        <script>
            window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 100);
            }
        </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  } else {
    alert('Please allow popups to print the invoice.');
  }
};