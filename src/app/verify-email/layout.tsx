import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify the email address for your LIVUS account.",
  alternates: { canonical: '/verify-email' },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
