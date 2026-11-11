import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Search",
  description: "Search the LIVUS collection of athletic streetwear, jerseys and accessories.",
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
