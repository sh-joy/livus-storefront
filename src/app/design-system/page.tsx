'use client';

import { Suspense } from 'react';
import DesignVariantsPage from '../variants/page';

export default function Page() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-white" />}>
      <DesignVariantsPage />
    </Suspense>
  );
}
