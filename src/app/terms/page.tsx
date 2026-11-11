import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export const metadata = {
  title: 'Terms & Conditions | LIVUS',
  description: 'Terms of sale, purchase agreements, and legal notices for LIVUS customers.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-display uppercase tracking-tight mb-8">Terms of Service</h1>
        <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
          <p>Welcome to LIVUS. By placing an order through our storefront or contacting our team, you agree to the terms outlined below.</p>
          <h2 className="text-lg font-semibold text-neutral-900 uppercase">Pricing & Payment</h2>
          <p>All prices are listed in Bangladeshi Taka (BDT) inclusive of applicable VAT. Payment methods accepted include Cash on Delivery (COD) and manual bKash/Nagad transfers with valid TrxIDs.</p>
          <h2 className="text-lg font-semibold text-neutral-900 uppercase">Order Acceptance & Stock</h2>
          <p>Orders are subject to item availability. While items in your bag reserve temporary inventory, orders may be cancelled if payment verification fails or fraud is suspected.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}