export interface InvoiceOrderData {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  subtotalBdt: number;
  vatBdt: number;
  deliveryChargeBdt: number;
  totalAmount: number;
  paymentMethod: string;
  status?: string;
  createdAt: string;
  items: Array<{
    name: string;
    variant?: string;
    size?: string;
    quantity: number;
    priceBdt: number;
  }>;
}

export function generateOrderInvoiceHtml(order: InvoiceOrderData): string {
  const storeName = "LIVUS Store";
  const storeAddress = "House 42, Road 11, Block D, Banani";
  const storeLocation = "Dhaka 1213, Bangladesh";
  const storeEmail = "support@livus.com";

  const fullCustomerAddress = `${order.shippingAddress}${order.city ? `, ${order.city}` : ''}${order.district ? `, ${order.district}` : ''}`;
  const subtotal = order.subtotalBdt || order.items.reduce((sum, item) => sum + (item.priceBdt * item.quantity), 0);
  const vat = order.vatBdt || Math.round((subtotal * 10) / 100);
  const delivery = order.deliveryChargeBdt || 150;
  const grandTotal = order.totalAmount || (subtotal + vat + delivery);

  const itemRowsHtml = order.items.map((item) => {
    const lineTotal = item.priceBdt * item.quantity;
    const variantDesc = [item.variant ? `Color: ${item.variant}` : '', item.size ? `Size: ${item.size}` : ''].filter(Boolean).join(' | ');
    const fullItemName = variantDesc ? `${item.name} (${variantDesc})` : item.name;

    return `
      <tr>
        <td align="left" style="border-bottom: 1px solid #eeeeee;">${fullItemName}</td>
        <td align="center" style="border-bottom: 1px solid #eeeeee;">${item.quantity}</td>
        <td align="right" style="border-bottom: 1px solid #eeeeee;">৳${item.priceBdt.toLocaleString()} BDT</td>
        <td align="right" style="border-bottom: 1px solid #eeeeee;">৳${lineTotal.toLocaleString()} BDT</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Invoice</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td, th { font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #333333; }
        @media print {
            body { background-color: #ffffff; }
            table { background-color: #ffffff; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: Helvetica, Arial, sans-serif;">

    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f6f6f6" style="padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="650" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width: 650px; width: 100%; background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0;">
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td valign="top" width="50%">
                                        <strong style="font-size: 11px; text-transform: uppercase;">Bill From:</strong><br><br>
                                        ${storeName}<br>
                                        ${storeAddress}<br>
                                        ${storeLocation}<br>
                                        ${storeEmail}
                                    </td>
                                    <td valign="top" width="50%" align="right">
                                        <strong style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000000;">LIVUS</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="border-bottom: 1px solid #eeeeee; height: 1px; width: 100%;"></div>
                        </td>
                    </tr>

                    <!-- Order Details Section -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td valign="top" width="50%">
                                        <strong style="font-size: 11px; text-transform: uppercase;">Bill To:</strong><br><br>
                                        ${order.customerName}<br>
                                        ${fullCustomerAddress}<br>
                                        ${order.phone}<br>
                                        ${order.email || ''}
                                    </td>
                                    <td valign="top" width="50%" align="right">
                                        <table border="0" cellpadding="5" cellspacing="0" align="right" style="width: 250px;">
                                            <tr>
                                                <td align="left" style="font-size: 11px; font-weight: bold;">ORDER ID</td>
                                                <td align="right">${order.orderNumber}</td>
                                            </tr>
                                            <tr>
                                                <td align="left" style="font-size: 11px; font-weight: bold;">ORDER DATE</td>
                                                <td align="right">${order.createdAt}</td>
                                            </tr>
                                            <tr>
                                                <td align="left" bgcolor="#e5e5e5" style="font-size: 11px; font-weight: bold; padding: 8px;">AMOUNT DUE</td>
                                                <td align="right" bgcolor="#e5e5e5" style="padding: 8px; font-weight: bold;">৳${grandTotal.toLocaleString()} BDT</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Items Table -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table width="100%" border="0" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th align="left" bgcolor="#e5e5e5" style="font-size: 11px; font-weight: bold;">Item</th>
                                        <th align="center" bgcolor="#e5e5e5" style="font-size: 11px; font-weight: bold;">Quantity</th>
                                        <th align="right" bgcolor="#e5e5e5" style="font-size: 11px; font-weight: bold;">Unit Cost</th>
                                        <th align="right" bgcolor="#e5e5e5" style="font-size: 11px; font-weight: bold;">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemRowsHtml}
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- Totals Section -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td valign="top" width="50%">
                                    </td>
                                    <td valign="top" width="50%" align="right">
                                        <table border="0" cellpadding="5" cellspacing="0" align="right" style="width: 250px;">
                                            <tr>
                                                <td align="left" style="font-size: 11px; font-weight: bold;">SUBTOTAL</td>
                                                <td align="right">৳${subtotal.toLocaleString()} BDT</td>
                                            </tr>
                                            <tr>
                                                <td align="left" style="font-size: 11px; font-weight: bold;">VAT (10%)</td>
                                                <td align="right">৳${vat.toLocaleString()} BDT</td>
                                            </tr>
                                            <tr>
                                                <td align="left" style="font-size: 11px; font-weight: bold;">DELIVERY CHARGE</td>
                                                <td align="right">৳${delivery.toLocaleString()} BDT</td>
                                            </tr>
                                            <tr>
                                                <td align="left" bgcolor="#e5e5e5" style="font-size: 11px; font-weight: bold; padding: 8px;">TOTAL</td>
                                                <td align="right" bgcolor="#e5e5e5" style="padding: 8px; font-weight: bold;">৳${grandTotal.toLocaleString()} BDT</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px; text-align: center; color: #999999; font-size: 11px;">
                            Thank you for choosing LIVUS
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>`;
}
