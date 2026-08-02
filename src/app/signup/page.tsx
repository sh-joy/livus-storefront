'use client';

import { Suspense } from 'react';
import { SignUpPage } from '@/figma-components/SignUpPage';

export default function Page() {
  return (
    <main className="w-full min-h-screen bg-white">
      <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d] text-white p-12">Loading...</div>}>
        <SignUpPage />
      </Suspense>
    </main>
  );
}
