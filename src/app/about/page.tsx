import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export const metadata = {
  title: 'About Us | LIVUS',
  description: 'The story and aesthetic ethos behind LIVUS Atelier.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-display uppercase tracking-tight mb-8">About LIVUS</h1>
        <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
          <p>LIVUS is a contemporary Bangladeshi streetwear atelier focused on architectural silhouettes, heavy cotton fabrications, and minimalist luxury.</p>
          <p>Designed in Dhaka, our pieces bridge functional sports performance with runway aesthetic standards.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}