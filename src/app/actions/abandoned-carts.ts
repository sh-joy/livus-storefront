'use server';

import { db } from '@/db';
import { abandonedCheckouts } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import { sendEmail, escapeHtml } from '@/lib/email';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface AbandonedCartRow {
  id: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  itemsSummary: string;
  totalBdt: number;
  date: string;
  isRecovered: boolean;
  recoveryEmailSentAt: string | null;
}

export async function fetchAdminAbandonedCheckoutsAction(): Promise<AbandonedCartRow[]> {
  await requireAdmin();
  if (!db) return [];

  try {
    const rows = await db.query.abandonedCheckouts.findMany({
      orderBy: [desc(abandonedCheckouts.createdAt)],
    });

    return rows.map((r) => {
      let itemsSummary = 'Cart Items';
      try {
        const parsed = JSON.parse(r.itemsJson || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          itemsSummary = parsed
            .map((item: any) => `${item.variantName || 'Apparel'} (${item.size || 'M'}) x ${item.quantity || 1}`)
            .join(', ');
        }
      } catch (e) {
        itemsSummary = 'Apparel items';
      }

      return {
        id: r.id,
        customerName: r.customerName || 'Guest Shopper',
        email: r.email,
        phone: r.phone,
        itemsSummary,
        totalBdt: r.subtotalBdt,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
        isRecovered: r.isRecovered,
        recoveryEmailSentAt: r.recoveryEmailSentAt ? new Date(r.recoveryEmailSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
      };
    });
  } catch (err) {
    console.error('Failed to fetch abandoned checkouts:', err);
    return [];
  }
}

export async function sendAbandonedCartRecoveryEmailAction(cartId: string) {
  await requireAdmin();
  if (!db) return { success: false, message: 'Database not available' };

  try {
    const cart = await db.query.abandonedCheckouts.findFirst({
      where: eq(abandonedCheckouts.id, cartId),
    });

    if (!cart) return { success: false, message: 'Cart not found' };
    if (!cart.email) return { success: false, message: 'No email address on file for this shopper' };

    let itemsHtml = '';
    try {
      const items = JSON.parse(cart.itemsJson || '[]');
      if (Array.isArray(items)) {
        itemsHtml = items
          .map((i: any) => `<li style="padding: 6px 0; color: #ffffff;">${i.variantName || 'Apparel Item'} - Size ${i.size || 'M'} (Qty: ${i.quantity || 1})</li>`)
          .join('');
      }
    } catch {}

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 40px 20px; }
            .card { max-width: 560px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333333; padding: 40px; }
            .logo { font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ffffff; margin-bottom: 24px; text-transform: uppercase; text-align: center; }
            .title { font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #ffffff; text-align: center; }
            .text { font-size: 15px; line-height: 1.6; color: #cccccc; margin-bottom: 20px; }
            .box { background: #111111; border: 1px solid #333333; padding: 16px 20px; margin-bottom: 24px; }
            .promo-badge { display: inline-block; padding: 8px 18px; font-size: 16px; font-family: monospace; font-weight: bold; background: #ffffff; color: #000000; letter-spacing: 2px; }
            .btn { display: block; text-align: center; background-color: #ffffff; color: #000000; font-weight: 600; text-decoration: none; padding: 14px 28px; font-size: 15px; letter-spacing: 1px; text-transform: uppercase; margin-top: 24px; }
            .footer { font-size: 12px; color: #666666; margin-top: 36px; border-top: 1px solid #2a2a2a; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">LIVUS</div>
            <div class="title">Did you leave something behind?</div>
            <p class="text">Hello ${cart.customerName || 'there'},</p>
            <p class="text">We saved the apparel pieces in your checkout cart so you don't miss out on your size.</p>
            
            <div class="box">
              <p style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Items in your cart:</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${itemsHtml || '<li style="color: #ffffff;">Your selected apparel piece</li>'}
              </ul>
            </div>

            <p class="text" style="text-align: center;">Here's an exclusive <strong>10% OFF</strong> promo code for your order:</p>
            <div style="text-align: center; margin-bottom: 24px;">
              <span class="promo-badge">LIVUS10</span>
            </div>

            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://livus.com.bd'}/checkout" class="btn">Complete Your Order Now</a>

            <div class="footer">
              Cash on Delivery & bKash available across all 64 districts of Bangladesh.<br/>
              &copy; ${new Date().getFullYear()} LIVUS Atelier. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    const sendRes = await sendEmail({
      to: cart.email,
      subject: `Complete your LIVUS order + 10% OFF inside`,
      html,
    });

    if (sendRes.success) {
      await db.update(abandonedCheckouts).set({
        recoveryEmailSentAt: new Date(),
      }).where(eq(abandonedCheckouts.id, cartId));

      revalidatePath('/admin/abandoned-carts');
      return { success: true, message: `Recovery email sent to ${cart.email}!` };
    } else {
      return { success: false, message: sendRes.error || 'Failed to dispatch email' };
    }
  } catch (err: any) {
    console.error('Failed to send recovery email:', err);
    return { success: false, message: err?.message || 'Failed to send recovery email' };
  }
}

export async function deleteAdminAbandonedCartAction(cartId: string) {
  await requireAdmin();
  try {
    if (db) {
      await db.delete(abandonedCheckouts).where(eq(abandonedCheckouts.id, cartId));
    }
    revalidatePath('/admin/abandoned-carts');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete abandoned cart:', err);
    return { success: false, message: 'Failed to delete record' };
  }
}
