'use server';

import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmail, escapeHtml, getSupportEmail } from '@/lib/email';
import { CONTACT_TOPICS } from '@/lib/contact-topics';


const ContactSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(200),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(v), 'Please enter a valid Bangladeshi mobile number.'),
  orderNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : ''))
    .refine((v) => v === '' || /^LIV-\d{4,10}$/.test(v), 'Order ID looks like LIV-123456.'),
  topic: z.enum(CONTACT_TOPICS, { message: 'Please choose a topic.' }),
  message: z.string().trim().min(10, 'Please write a little more (at least 10 characters).').max(2000),
  // Honeypot: real people never fill this hidden field.
  website: z.string().max(0).optional(),
});

export async function sendContactMessageAction(input: z.input<typeof ContactSchema>) {
  const rate = await checkRateLimit('contact_message', 5, 10 * 60 * 1000);
  if (!rate.success) return { success: false, message: 'Too many messages. Please try again in a few minutes.' };

  const parsed = ContactSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || 'Please check the form.' };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { website: _honeypot, ...data } = parsed.data;

  let saved = false;
  try {
    await db.insert(contactMessages).values({ ...data, orderNumber: data.orderNumber || null });
    saved = true;
  } catch (err) {
    console.error('Failed to save contact message (has drizzle/manual/0006 been run?):', err);
  }

  // Also email the support inbox when email sending is configured.
  let emailed = false;
  try {
    const to = await getSupportEmail();
    const rows: Array<[string, string]> = [
      ['Name', data.fullName],
      ['Email', data.email],
      ['Phone', data.phone],
      ['Order ID', data.orderNumber || '—'],
      ['Topic', data.topic],
    ];
    const res = await sendEmail({
      to,
      subject: `New message: ${data.topic} — ${data.fullName}`,
      html: `<h2>New message from the LIVUS contact page</h2><table>${rows
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`)
        .join('')}</table><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
    });
    emailed = Boolean((res as { success?: boolean } | undefined)?.success ?? res);
  } catch (err) {
    console.error('Failed to email contact message:', err);
  }

  if (!saved && !emailed) {
    return { success: false, message: 'Sorry, we could not send your message right now. Please call or email us instead.' };
  }
  revalidatePath('/admin/messages');
  return { success: true };
}

export type ContactMessageRow = typeof contactMessages.$inferSelect;

export async function getAdminContactMessagesAction(): Promise<{ rows: ContactMessageRow[]; tableReady: boolean }> {
  await requireAdmin();
  try {
    const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(500);
    return { rows, tableReady: true };
  } catch {
    return { rows: [], tableReady: false };
  }
}

export async function setContactMessageStatusAction(id: string, status: 'New' | 'Replied' | 'Closed') {
  await requireAdmin();
  if (!['New', 'Replied', 'Closed'].includes(status)) return { success: false };
  try {
    await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
    revalidatePath('/admin/messages');
    return { success: true };
  } catch {
    return { success: false };
  }
}
