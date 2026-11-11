import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export const metadata = {
  title: 'Shipping & Returns Policy | LIVUS',
  description: 'Nationwide delivery rates, shipping timeframes, and exchange policies across Bangladesh.',
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-display uppercase tracking-tight mb-8">Shipping & Returns</h1>
        <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
          <h2 className="text-lg font-semibold text-neutral-900 uppercase">Delivery Rates & Speed</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dhaka Division:</strong> ৳100 BDT flat delivery (delivered within 24 to 48 hours).</li>
            <li><strong>All Other Divisions:</strong> ৳150 BDT flat delivery (delivered within 48 to 72 hours).</li>
            <li><strong>Free Shipping:</strong> Automatically applied to all orders with an apparel subtotal of ৳2,500 BDT or more.</li>
          </ul>
          <h2 className="text-lg font-semibold text-neutral-900 uppercase">7-Day Exchanges</h2>
          <p>We accept size and item exchanges within 7 days of delivery, provided the garment is unworn, unwashed, and retains all original tags.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}