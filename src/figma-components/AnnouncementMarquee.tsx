'use client';

import { useState, useEffect } from 'react';
import { getActiveMarqueeAnnouncementsAction } from '@/app/actions/marquee';

export function AnnouncementMarquee() {
  const [items, setItems] = useState<string[]>([
    "FREE SHIPPING ON ORDERS OVER ৳2,500 · NATIONWIDE CASH ON DELIVERY",
    "NEW DROP LIVE NOW · CASH ON DELIVERY & BKASH AVAILABLE",
    "FREE SHIPPING ON ORDERS OVER ৳2,500 · NATIONWIDE CASH ON DELIVERY",
    "NEW DROP LIVE NOW · CASH ON DELIVERY & BKASH AVAILABLE",
  ]);

  useEffect(() => {
    let isMounted = true;
    getActiveMarqueeAnnouncementsAction().then((dbItems) => {
      if (isMounted && dbItems && dbItems.length > 0) {
        // Double up if there's only 1 or 2 items so the marquee loops seamlessly
        const repeated = dbItems.length < 4 ? [...dbItems, ...dbItems] : dbItems;
        setItems(repeated);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-black relative shrink-0 w-full overflow-hidden py-[8px] z-[9999]" style={{ width: "100%" }}>
      <div className="flex w-max animate-livus-marquee whitespace-nowrap">
        {/* Track 1 */}
        <div className="flex items-center gap-[120px] pr-[120px] max-md:gap-[48px] max-md:pr-[48px] shrink-0">
          {items.map((item, index) => (
            <p key={`track1-${index}`} className="font-sans text-[16px] max-md:!text-[13px] text-white tracking-[0.8px] uppercase shrink-0 m-0">
              {item}
            </p>
          ))}
        </div>
        {/* Track 2 (Exact duplicate for seamless infinite -50% loop) */}
        <div className="flex items-center gap-[120px] pr-[120px] max-md:gap-[48px] max-md:pr-[48px] shrink-0">
          {items.map((item, index) => (
            <p key={`track2-${index}`} className="font-sans text-[16px] max-md:!text-[13px] text-white tracking-[0.8px] uppercase shrink-0 m-0">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
