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
