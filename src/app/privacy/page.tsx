import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LIVUS collects, uses and protects your personal data when you shop with us.",
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy">
      <p>At LIVUS Atelier, we respect your personal privacy. When you browse our collections, place an order, or subscribe to our newsletter, we collect necessary data including your name, delivery address, phone number, and transaction references.</p>
      <h2>Information Security</h2>
      <p>All sensitive information is processed over encrypted SSL connections. We never share, sell, or rent your personal contact information to third-party marketing companies.</p>
      <h2>Payment Verification</h2>
      <p>For bKash and Nagad manual transactions, Transaction IDs and sender phone numbers are used exclusively by our financial verification desk to reconcile orders.</p>
    </InfoPage>
  );
}
