'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImportLogsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/products");
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 font-sans text-xs text-neutral-500">
      Redirecting to Products Import Logs...
    </div>
  );
}
