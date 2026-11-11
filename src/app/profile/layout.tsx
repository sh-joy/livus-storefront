import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Account",
  description: "View your LIVUS orders, addresses and account details.",
  alternates: { canonical: '/profile' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
