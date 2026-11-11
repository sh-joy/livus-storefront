import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your LIVUS order. Pay with Cash on Delivery, bKash or Nagad.",
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
