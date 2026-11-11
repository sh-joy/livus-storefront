import type { Metadata } from 'next';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LIVUS collects, uses and protects your personal data when you shop with us.",
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-display uppercase tracking-tight mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
          <p>At LIVUS Atelier, we respect your personal privacy. When you browse our collections, place an order, or subscribe to our newsletter, we collect necessary data including your name, delivery address, phone number, and transaction references.</p>
          <h2 className="text-lg font-semibold text-neutral-900 uppercase">Information Security</h2>
          <p>All sensitive information is processed over encrypted SSL connections. We never share, sell, or rent your personal contact information to third-party marketing companies.</p>
          <h2 className="text-lg font-semibold text-neutral-900 uppercase">Payment Verification</h2>
          <p>For bKash and Nagad manual transactions, Transaction IDs and sender phone numbers are used exclusively by our financial verification desk to reconcile orders.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}