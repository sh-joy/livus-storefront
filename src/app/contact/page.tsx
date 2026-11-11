import type { Metadata } from 'next';
import { Mail, Phone, Clock, MessageSquare, MapPin } from 'lucide-react';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { ContactForm } from '@/components/storefront/ContactForm';
import { getSiteProfile } from '@/lib/site-profile';
import { getSiteContentAction } from '@/app/actions/site-content';
import { type FaqItem, DEFAULT_FAQS } from '@/content/site-content-defaults';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LIVUS customer support for help with orders, sizing, delivery and returns in Bangladesh.",
  alternates: { canonical: '/contact' },
};

export const revalidate = 60;

export default async function ContactPage() {
  const profile = await getSiteProfile();
  const introText = await getSiteContentAction('contact_intro');
  const rawFaqs = await getSiteContentAction('contact_faqs');

  let faqs: FaqItem[] = DEFAULT_FAQS;
  try {
    if (rawFaqs) {
      const parsed = JSON.parse(rawFaqs);
      if (Array.isArray(parsed) && parsed.length > 0) faqs = parsed;
    }
  } catch {}

  const email = profile.contact.email || 'support@livus.com.bd';
  const phones = profile.contact.phones || [];
  const whatsapp = profile.contact.whatsapp || '';
  const hours = profile.contact.hours || 'Sat–Thu, 10 AM – 8 PM';
  const address = profile.contact.address || '';
  const mapUrl = profile.contact.mapUrl || '';

  // Clean WhatsApp for wa.me link
  const waClean = whatsapp.replace(/\D/g, '');
  const waLink = waClean ? `https://wa.me/${waClean.startsWith('88') ? waClean : '88' + waClean}` : '';

  const contacts = [
    { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
    ...phones.map((p) => ({
      icon: Phone,
      label: 'Phone',
      value: p,
      href: `tel:${p.replace(/\s+/g, '')}`,
    })),
    ...(waLink ? [{ icon: MessageSquare, label: 'WhatsApp', value: `WhatsApp: ${whatsapp}`, href: waLink }] : []),
    { icon: Clock, label: 'Hours', value: hours, href: '' },
    ...(address
      ? [
          {
            icon: MapPin,
            label: 'Address',
            value: address,
            href: mapUrl || '',
          },
        ]
      : []),
  ];

  // Structured Data FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] flex flex-col">
      <SiteNav />
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <main className="flex-1 w-full">
        {/* Get in touch: details left, form right */}
        <section className="px-[var(--lv-gutter)] pt-[clamp(20px,3vw,44px)] pb-[clamp(40px,5vw,72px)]">
          <div className="mx-auto w-full max-w-[1200px] grid gap-12 lg:grid-cols-2 lg:gap-[clamp(48px,6vw,96px)]">
            <div className="flex flex-col">
              <h1 className="t-h2 m-0">Get in touch</h1>
              <p className="t-lead mt-5 mb-0 max-w-[520px]">
                {introText ||
                  "Have a question about an order, sizing or delivery, or want to share feedback? Send us a message or reach us through any of the channels below. We're happy to help."}
              </p>
              <div className="mt-10 lg:mt-auto lg:pt-16">
                <p className="t-eyebrow m-0 pb-3 border-b border-[var(--lv-line)]">Bangladesh</p>
                <ul className="list-none m-0 p-0 mt-4 flex flex-col gap-3.5">
                  {contacts.map(({ icon: Icon, value, href }, idx) => (
                    <li key={idx} className="flex items-start gap-3 t-body">
                      <Icon className="size-[18px] shrink-0 stroke-[1.5] mt-1 text-[#4a4a4a]" aria-hidden />
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="underline underline-offset-4 text-[#0d0d0d] hover:text-neutral-600"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="text-[#0d0d0d]">{value}</span>
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
                <details key={i} className="group border-b border-[var(--lv-line)]" open={i === 0}>
                  <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span
                      className="text-[18px] sm:text-[20px] leading-snug text-[#0d0d0d]"
                      style={{ fontFamily: "'Overused Grotesk', sans-serif", fontWeight: 500 }}
                    >
                      {f.q}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-[22px] leading-none text-[#5c5c5c] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="t-body m-0 pb-6 pr-10 text-[#4a4a4a] leading-relaxed">{f.a}</p>
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
