import type { Metadata } from 'next';
import { Mail, Phone, Clock } from 'lucide-react';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { ContactForm } from '@/components/storefront/ContactForm';
import { fetchStoreSettingsAction } from '@/app/actions/checkout';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LIVUS customer support for help with orders, sizing, delivery and returns in Bangladesh.",
  alternates: { canonical: '/contact' },
};

// Re-read support details from Admin → Settings at most once a minute.
export const revalidate = 60;

export default async function ContactPage() {
  const settings = await fetchStoreSettingsAction();
  const email = settings?.supportEmail || 'support@livus.com.bd';
  const phone = settings?.supportPhone || '';
  const deliveryFee = settings?.defaultDeliveryChargeBdt ?? 150;
  const freeOver = settings?.freeShippingThresholdBdt ?? 0;

  const contacts = [
    { icon: Mail, value: email, href: `mailto:${email}` },
    ...(phone ? [{ icon: Phone, value: phone, href: `tel:${phone.replace(/\s+/g, '')}` }] : []),
    { icon: Clock, value: 'Sat–Thu, 10 AM – 8 PM', href: '' },
  ];

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: 'How do I place an order?',
      a: 'Choose your product, pick a colour and size, and add it to your cart. Then go to checkout, fill in your delivery details and confirm. Our team calls you to confirm the order before it is dispatched.',
    },
    {
      q: 'How much does delivery cost?',
      a: `Delivery starts from ৳${deliveryFee} and depends on your district. You always see the exact charge at checkout before you confirm.${
        freeOver > 0 ? ` Orders of ৳${freeOver.toLocaleString()} or more get free delivery.` : ''
      }`,
    },
    {
      q: 'How long does delivery take?',
      a: 'Orders inside Dhaka usually arrive within 2–3 working days, and within 3–5 working days for the rest of Bangladesh.',
    },
    {
      q: 'How can I pay?',
      a: 'You can pay cash on delivery anywhere in Bangladesh. When bKash or Nagad are available they are shown as options at checkout.',
    },
    {
      q: 'How do I exchange or return an item?',
      a: 'We accept exchanges within 7 days of delivery for unworn, unwashed items with the original tags attached. Send us a message with your order ID and we will arrange it.',
    },
    {
      q: 'How do I track my order?',
      a: 'Enter your order number (for example LIV-123456) on the My Account page to see its status. You will find the number on your order confirmation.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] flex flex-col">
      <SiteNav />
      <main className="flex-1 w-full">
        {/* Get in touch: details left, form right */}
        <section className="px-[var(--lv-gutter)] pt-[clamp(28px,4vw,56px)] pb-[clamp(40px,5vw,72px)]">
          <div className="mx-auto w-full max-w-[1200px] grid gap-12 lg:grid-cols-2 lg:gap-[clamp(48px,6vw,96px)]">
            <div className="flex flex-col">
              <h1 className="t-h2 m-0">Get in touch</h1>
              <p className="t-lead mt-5 mb-0 max-w-[520px]">
                Have a question about an order, sizing or delivery, or want to share feedback? Send us a message or reach us
                through any of the channels below. We&apos;re happy to help.
              </p>
              <div className="mt-10 lg:mt-auto lg:pt-16">
                <p className="t-eyebrow m-0 pb-3 border-b border-[var(--lv-line)]">Bangladesh</p>
                <ul className="list-none m-0 p-0 mt-4 flex flex-col gap-3">
                  {contacts.map(({ icon: Icon, value, href }) => (
                    <li key={value} className="flex items-center gap-3 t-body">
                      <Icon className="size-[18px] shrink-0 stroke-[1.5]" aria-hidden />
                      {href ? (
                        <a href={href} className="underline underline-offset-4 text-[#0d0d0d]">{value}</a>
                      ) : (
                        <span>{value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <ContactForm />
          </div>
        </section>

        {/* FAQs */}
        <section aria-labelledby="faq-title" className="px-[var(--lv-gutter)] pb-[clamp(40px,5vw,72px)]">
          <div className="mx-auto w-full max-w-[860px]">
            <h2 id="faq-title" className="t-h2 m-0 text-center">FAQs</h2>
            <div className="mt-[clamp(20px,3vw,32px)] border-t border-[var(--lv-line)]">
              {faqs.map((f, i) => (
                <details key={f.q} className="group border-b border-[var(--lv-line)]" open={i === 0}>
                  <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-[18px] sm:text-[20px] leading-snug text-[#0d0d0d]" style={{ fontFamily: "'Overused Grotesk', sans-serif", fontWeight: 500 }}>
                      {f.q}
                    </span>
                    <span aria-hidden className="shrink-0 text-[22px] leading-none text-[#5c5c5c] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="t-body m-0 pb-6 pr-10 text-[#4a4a4a]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter compact />
    </div>
  );
}
