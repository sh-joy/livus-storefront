import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Thank you for your LIVUS order. Your order has been received.",
  alternates: { canonical: '/order-confirmed' },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
