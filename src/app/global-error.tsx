'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6 font-sans">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-mono mb-2">Error Encountered</p>
        <h2 className="text-3xl font-display uppercase tracking-tight mb-4">Something Went Wrong</h2>
        <p className="text-sm text-neutral-600 max-w-md text-center mb-8">
          We encountered an unexpected issue while loading this page. Please try again or return to our homepage.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="bg-black text-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-neutral-300 text-neutral-900 px-6 py-3 text-xs uppercase tracking-wider hover:bg-neutral-50 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </body>
    </html>
  );
}
