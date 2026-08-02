'use client';

import { Suspense } from 'react';
import Search from '@/imports/Search-1';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default function SearchPage() {
  return (
    <NavigationWrapper>
      <Suspense fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-white">
          <p className="font-sans text-[17px] uppercase tracking-[1px] text-neutral-400">Loading search...</p>
        </div>
      }>
        <Search />
      </Suspense>
    </NavigationWrapper>
  );
}
