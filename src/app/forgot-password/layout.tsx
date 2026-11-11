import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset the password for your LIVUS account.",
  alternates: { canonical: '/forgot-password' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
