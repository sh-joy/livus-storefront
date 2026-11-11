import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a LIVUS account to save your details, track orders and check out faster.",
  alternates: { canonical: '/signup' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
