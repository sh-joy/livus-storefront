import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of sale, ordering, payment and legal notices for LIVUS customers in Bangladesh.",
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service">
      <p>Welcome to LIVUS. By placing an order through our storefront or contacting our team, you agree to the terms outlined below.</p>
      <h2>Pricing & Payment</h2>
      <p>All prices are listed in Bangladeshi Taka (BDT) inclusive of applicable VAT. Payment methods accepted include Cash on Delivery (COD) and manual bKash/Nagad transfers with valid TrxIDs.</p>
      <h2>Order Acceptance & Stock</h2>
      <p>Orders are subject to item availability. While items in your bag reserve temporary inventory, orders may be cancelled if payment verification fails or fraud is suspected.</p>
    </InfoPage>
  );
}
