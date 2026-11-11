import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "LIVUS delivery charges, shipping times across Bangladesh, Cash on Delivery details and our exchange and returns policy.",
  alternates: { canonical: '/shipping-returns' },
};

export default function ShippingReturnsPage() {
  return (
    <InfoPage title="Shipping & Returns">
      <h2>Delivery Rates & Speed</h2>
      <ul>
        <li><strong>Dhaka Division:</strong> ৳100 BDT flat delivery (delivered within 24 to 48 hours).</li>
        <li><strong>All Other Divisions:</strong> ৳150 BDT flat delivery (delivered within 48 to 72 hours).</li>
        <li><strong>Free Shipping:</strong> Automatically applied to all orders with an apparel subtotal of ৳2,500 BDT or more.</li>
      </ul>
      <h2>7-Day Exchanges</h2>
      <p>We accept size and item exchanges within 7 days of delivery, provided the garment is unworn, unwashed, and retains all original tags.</p>
    </InfoPage>
  );
}
