import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your LIVUS account to track orders and check out faster.",
  alternates: { canonical: '/signin' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
