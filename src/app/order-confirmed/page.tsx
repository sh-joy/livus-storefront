'use client';

import { Suspense } from 'react';
import OrderConfirmed from '@/imports/OrderConfirmed';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default function OrderConfirmedPage() {
  return (
    <NavigationWrapper>
      <Suspense fallback={
        <div className="w-full min-h-screen bg-white flex items-center justify-center">
          <p className="font-sans text-[17px] uppercase tracking-[1px] text-neutral-400">Loading order confirmation...</p>
        </div>
      }>
        <OrderConfirmed />
      </Suspense>
    </NavigationWrapper>
  );
}
