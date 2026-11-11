import type { Metadata } from 'next';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LIVUS customer support for help with orders, sizing, delivery and returns in Bangladesh.",
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-display uppercase tracking-tight mb-8">Customer Concierge</h1>
        <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
          <p>Have a question about an order, sizing, or shipment? Reach out to our team:</p>
          <div className="p-6 bg-neutral-50 border border-neutral-200 space-y-3 font-mono text-xs">
            <p><strong>Email:</strong> support@livus.com.bd</p>
            <p><strong>Phone / WhatsApp:</strong> +880 1711 000000</p>
            <p><strong>Hours:</strong> Saturday to Thursday, 10:00 AM – 8:00 PM</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}