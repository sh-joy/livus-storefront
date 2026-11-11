export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '${APP_URL}';

import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.BREVO_API_KEY || '';
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@livus.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'LIVUS Official';

  // 1. Try Brevo v3 REST API First
  if (apiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
          textContent: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✉️ Live email sent to ${to} via Brevo API:`, data.messageId);
        return { success: true, messageId: data.messageId };
      } else {
        console.warn(`Brevo API Response (${res.status}):`, data.message || data);
      }
    } catch (apiErr: any) {
      console.warn('Brevo API fetch error:', apiErr?.message || apiErr);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const smtpUser = process.env.BREVO_SMTP_USER || '';
  const smtpKey = process.env.BREVO_SMTP_KEY || '';

  if (smtpUser && smtpKey && !smtpUser.includes('YOUR_BREVO')) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpKey },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ''),
        html,
      });
      console.log(`✉️ Live email sent to ${to} via SMTP: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`❌ SMTP transport failed for ${to}:`, err?.message || err);
    }
  }

  return { success: false, error: 'Brevo email delivery pending IP authorization on Brevo dashboard.' };
}

export async function sendVerificationEmail({
  to,
  userName,
  code,
  verificationUrl,
}: {
  to: string;
  userName?: string;
  code?: string;
  verificationUrl: string;
}) {
  const codeDisplay = code ? `
    <div style="margin: 24px 0; padding: 20px; background-color: #0d0d0d; border: 1px solid #333333; text-align: center;">
      <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #ffffff;">${code}</span>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 40px 20px; }
          .card { max-width: 560px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333333; padding: 40px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; margin-bottom: 24px; text-transform: uppercase; }
          .title { font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #ffffff; }
          .text { font-size: 16px; line-height: 1.6; color: #cccccc; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #ffffff; color: #000000; font-weight: 600; text-decoration: none; padding: 14px 32px; font-size: 16px; letter-spacing: 1px; }
          .footer { font-size: 12px; color: #666666; margin-top: 40px; border-top: 1px solid #2a2a2a; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">LIVUS</div>
          <div class="title">Verification Code</div>
          <p class="text">
            Hello ${userName || 'Valued Customer'},<br/><br/>
            Your 6-digit verification code is below:
          </p>
          ${codeDisplay}
          <p class="text">
            Or click the button below to complete password reset directly in your sign-in page:
          </p>
          <a href="${verificationUrl}" class="btn">Complete Verification</a>
          <p class="text" style="margin-top: 24px; font-size: 13px; color: #888888;">
            If you did not request this email, you can safely ignore it.
          </p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} LIVUS Inc. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Your LIVUS Verification Code: ${code || ''}`,
    html,
  });
}

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  items,
  subtotalBdt,
  deliveryChargeBdt,
  discountBdt,
  vatBdt,
  totalBdt,
  shippingAddress,
  paymentMethod,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ productName: string; variantName?: string; size?: string; quantity: number; priceBdt: number }>;
  subtotalBdt: number;
  deliveryChargeBdt: number;
  discountBdt: number;
  vatBdt: number;
  totalBdt: number;
  shippingAddress: string;
  paymentMethod: string;
}) {
  const itemsHtml = items.map((i) => `
    <tr style="border-bottom: 1px solid #2a2a2a;">
      <td style="padding: 12px 0; text-align: left; color: #ffffff;">
        <strong style="font-size: 14px;">${i.productName}</strong><br/>
        <span style="font-size: 12px; color: #888888;">${[i.variantName, i.size ? `Size: ${i.size}` : ''].filter(Boolean).join(' · ')}</span>
      </td>
      <td style="padding: 12px 0; text-align: center; color: #cccccc; font-size: 14px;">${i.quantity}</td>
      <td style="padding: 12px 0; text-align: right; color: #ffffff; font-size: 14px;">৳${(i.priceBdt * i.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 40px 20px; }
          .card { max-width: 600px; margin: 0 auto; background-color: #161616; border: 1px solid #2e2e2e; padding: 36px; }
          .logo { font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ffffff; text-transform: uppercase; margin-bottom: 24px; text-align: center; }
          .title { font-size: 22px; font-weight: 600; color: #ffffff; margin-bottom: 8px; text-align: center; }
          .subtitle { font-size: 14px; color: #888888; text-align: center; margin-bottom: 28px; }
          .order-box { background-color: #1f1f1f; border: 1px solid #333333; padding: 16px 20px; margin-bottom: 24px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #aaaaaa; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 18px; font-weight: bold; color: #ffffff; border-top: 1px solid #333333; margin-top: 8px; }
          .footer { font-size: 12px; color: #666666; margin-top: 36px; border-top: 1px solid #2a2a2a; padding-top: 20px; text-align: center; }
          .btn { display: inline-block; background-color: #ffffff; color: #000000; font-weight: 600; text-decoration: none; padding: 12px 28px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">LIVUS</div>
          <div class="title">Order Confirmed!</div>
          <p class="subtitle">Thank you for your order, ${customerName}. We are preparing it for delivery.</p>

          <div class="order-box">
            <div style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Order Number</div>
            <div style="font-size: 20px; font-weight: bold; color: #ffffff; font-family: monospace;">${escapeHtml(orderNumber)}</div>
            <div style="margin-top: 12px; font-size: 13px; color: #cccccc;">
              <strong>Delivery Address:</strong> ${escapeHtml(shippingAddress)}<br/>
              <strong>Payment Method:</strong> ${paymentMethod}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr style="border-bottom: 1px solid #333333; color: #888888; font-size: 12px; text-transform: uppercase;">
                <th style="padding-bottom: 8px; text-align: left;">Item</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 1px solid #333333; padding-top: 12px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; color: #aaaaaa;">
              <tr><td style="padding: 4px 0;">Subtotal</td><td style="text-align: right; color: #ffffff;">৳${subtotalBdt.toLocaleString()}</td></tr>
              ${discountBdt > 0 ? `<tr><td style="padding: 4px 0; color: #4ade80;">Discount</td><td style="text-align: right; color: #4ade80;">-৳${discountBdt.toLocaleString()}</td></tr>` : ''}
              <tr><td style="padding: 4px 0;">VAT</td><td style="text-align: right; color: #ffffff;">৳${vatBdt.toLocaleString()}</td></tr>
              <tr><td style="padding: 4px 0;">Delivery Charge</td><td style="text-align: right; color: #ffffff;">${deliveryChargeBdt === 0 ? '<span style="color: #4ade80;">FREE</span>' : `৳${deliveryChargeBdt.toLocaleString()}`}</td></tr>
              <tr style="border-top: 1px solid #333333; font-size: 16px; font-weight: bold; color: #ffffff;">
                <td style="padding-top: 10px;">Total</td>
                <td style="text-align: right; padding-top: 10px;">৳${totalBdt.toLocaleString()} BDT</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${APP_URL}/profile" class="btn">View & Track Order</a>
          </div>

          <div class="footer">
            Questions about your order? Email us at support@livus.com.bd<br/>
            &copy; ${new Date().getFullYear()} LIVUS Atelier. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Order Confirmation: ${escapeHtml(orderNumber)} - LIVUS`,
    html,
  });
}

export async function sendOrderStatusNotificationEmail({
  to,
  customerName,
  orderNumber,
  newStatus,
  customMessage,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  newStatus: string;
  customMessage?: string;
}) {
  const statusColors: Record<string, string> = {
    Processing: '#3b82f6',
    Shipped: '#a855f7',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
  };

  const badgeColor = statusColors[newStatus] || '#ffffff';

  const defaultMessages: Record<string, string> = {
    Processing: 'Your order has been verified and our team is currently preparing your apparel for shipment.',
    Shipped: 'Great news! Your package is on the way with our courier partner. Expect delivery within 24-48 hours.',
    Delivered: 'Your order has been successfully delivered. We hope you enjoy your LIVUS pieces!',
    Cancelled: 'Your order has been cancelled. If any payment was made, our team will process your refund promptly.',
  };

  const messageText = customMessage || defaultMessages[newStatus] || `Your order status has been updated to ${escapeHtml(newStatus)}.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 40px 20px; }
          .card { max-width: 560px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333333; padding: 40px; text-align: center; }
          .logo { font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ffffff; margin-bottom: 24px; text-transform: uppercase; }
          .title { font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #ffffff; }
          .text { font-size: 15px; line-height: 1.6; color: #cccccc; margin-bottom: 24px; }
          .status-badge { display: inline-block; padding: 8px 18px; font-size: 15px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; border: 1px solid ${badgeColor}; color: ${badgeColor}; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #ffffff; color: #000000; font-weight: 600; text-decoration: none; padding: 12px 28px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
          .footer { font-size: 12px; color: #666666; margin-top: 36px; border-top: 1px solid #2a2a2a; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">LIVUS</div>
          <div class="title">Order Status Update</div>
          <p class="text">Hello ${escapeHtml(customerName) || 'Valued Customer'},</p>
          <div class="status-badge">${escapeHtml(newStatus)}</div>
          <p class="text" style="font-size: 16px; color: #ffffff;">Order <strong>${escapeHtml(orderNumber)}</strong></p>
          <p class="text">${escapeHtml(messageText)}</p>
          <a href="${APP_URL}/profile" class="btn">Track Order Details</a>
          <div class="footer">
            &copy; ${new Date().getFullYear()} LIVUS Inc. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Order Update: ${escapeHtml(orderNumber)} is now ${escapeHtml(newStatus)}`,
    html,
  });
}

