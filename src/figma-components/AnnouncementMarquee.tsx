'use client';

export function AnnouncementMarquee() {
  const items = [
    "FREE P&P ON ORDERS OVER £80 + FREE RETURNS",
    "SUMMER SALE 30%-50% OFF",
    "FREE P&P ON ORDERS OVER £80 + FREE RETURNS",
    "SUMMER SALE 30%-50% OFF",
  ];

  return (
    <div className="bg-black relative shrink-0 w-full overflow-hidden py-[8px] z-[9999]" style={{ width: "100%" }}>
      <div className="flex w-max animate-livus-marquee whitespace-nowrap">
        {/* Track 1 */}
        <div className="flex items-center gap-[120px] pr-[120px] shrink-0">
          {items.map((item, index) => (
            <p key={`track1-${index}`} className="font-sans text-[16px] text-white tracking-[0.8px] uppercase shrink-0 m-0">
              {item}
            </p>
          ))}
        </div>
        {/* Track 2 (Exact duplicate for seamless infinite -50% loop) */}
        <div className="flex items-center gap-[120px] pr-[120px] shrink-0">
          {items.map((item, index) => (
            <p key={`track2-${index}`} className="font-sans text-[16px] text-white tracking-[0.8px] uppercase shrink-0 m-0">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
