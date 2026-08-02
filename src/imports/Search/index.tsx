import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ProductItem } from '@/app/actions/products';
import { ProductCard } from '@/figma-components/ProductCard';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SiteNav } from '@/figma-components/SiteNav';
import svgPaths from "./svg-vcqbscxjpp";
import imgFrame1597881192 from "./cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png";

function Frame189Status() {
  return (
    <div className="bg-[#050505] content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative shrink-0" data-name="Frame 189/Status3">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">10% OFF</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="aspect-[3/4] relative shrink-0 w-full">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src} />
      <div className="content-stretch flex items-start p-[16px] relative size-full">
        <Frame189Status />
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]" style={{ fontVariationSettings: '"wdth" 100, "wght" 500' }}>
        ৳899 BDT
      </p>
      <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid font-['Barlow Semi Condensed:Regular','Noto_Sans_Bengali:Regular',sans-serif] line-through relative shrink-0 text-[#666666] text-[18px] font-normal font-medium" style={{ fontVariationSettings: '"wdth" 100, "wght" 400' }}>
        ৳1199 BDT
      </p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-[-0.4px]">OWAYO - CROSS FADE</p>
      <Frame24 />
    </div>
  );
}

function Frame13() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <Frame23 />
      <Frame7 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 text-[#1c1c1c] w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-[-0.4px]">OWAYO - CROSS FADE</p>
      <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
        <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]">
          ৳899 BDT
        </p>
        <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-normal">
          ৳1199 BDT
        </p>
      </div>
    </div>
  );
}

function Frame14() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <div className="aspect-[1000/1334] relative shrink-0 w-full" data-name="image 120">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src} />
      </div>
      <Frame8 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 text-[#1c1c1c] w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-[-0.4px]">OWAYO - CROSS FADE</p>
      <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
        <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]">
          ৳899 BDT
        </p>
        <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-normal">
          ৳1199 BDT
        </p>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <div className="aspect-[1000/1334] relative shrink-0 w-full" data-name="image 120">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src} />
      </div>
      <Frame9 />
    </div>
  );
}

function Frame6({ products }: { products?: ProductItem[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full px-[36px] py-12 text-center">
        <p className="font-sans text-[18px] text-neutral-500">No products found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 w-full">
      <div className="product-grid-4col px-[36px] relative w-full">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col font-sans items-start not-italic relative shrink-0 text-[#1c1c1c] text-[14px] tracking-[0.7px] uppercase">
      <p className="leading-[24px] relative shrink-0">Copyright © 2026 LIVUS</p>
      <p className="leading-[0] relative shrink-0">
        <span className="leading-[24px] tracking-[0.8px]">{`Made with ❤️ by `}</span>
        <span className="[text-underline-position:from-font] decoration-from-font decoration-solid font-sans leading-[24px] tracking-[0.8px] underline">joy</span>
      </p>
    </div>
  );
}

function Frame16() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col h-full items-start justify-between relative shrink-0 w-[572px] whitespace-nowrap">
      <p className="font-serif font-semibold leading-[26px] relative shrink-0 text-[30px] text-black tracking-[9px]">LIVUS</p>
      <Frame21 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="flex-[1_0_0] min-w-px relative">
      <div className="[word-break:break-word] content-stretch flex flex-col font-sans gap-[16px] items-start leading-[24px] not-italic px-[8px] relative size-full text-[#333] text-[17px] tracking-[0.17px] whitespace-nowrap">
        <p className="relative shrink-0">Home</p>
        <p className="relative shrink-0">Collections</p>
        <p className="relative shrink-0">Cart</p>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="flex-[1_0_0] min-w-px relative">
      <div className="[word-break:break-word] content-stretch flex flex-col font-sans gap-[16px] items-start leading-[24px] not-italic px-[8px] relative size-full text-[#333] text-[17px] tracking-[0.17px] whitespace-nowrap">
        <p className="relative shrink-0">Facebook</p>
        <p className="relative shrink-0">Instagram</p>
        <p className="relative shrink-0">Contact Us</p>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex items-center py-[9px] relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.25)] border-b border-solid inset-0 pointer-events-none" />
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#333] text-[17px] tracking-[0.17px] whitespace-nowrap">Enter your email address</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#1c1c1c] text-[14px] tracking-[0.7px] whitespace-nowrap">SUBSCRIBE TO OUR NEWSLETTER</p>
      <Frame19 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute flex inset-[4.29%_4.28%_4.3%_4.3%] items-center justify-center" style={{ containerType: "size" }}>
      <div className="-rotate-135 -scale-x-100 flex-none h-[hypot(64.4613cqw,-64.4613cqh)] w-[hypot(35.5387cqw,35.5387cqh)]">
        <div className="relative size-full">
          <div className="absolute inset-[0_-5.76%_-6.36%_-5.78%]">
            <svg className="block size-full" fill="none" height="14.1821" preserveAspectRatio="none" viewBox="0 0 8.19944 14.1821" width="8.19944">
              <g id="Group 1000004211">
                <path d={svgPaths.p12405ac0} id="Vector" stroke="var(--stroke-0, white)" strokeWidth="1.2" />
                <path d="M4.10121 0V13.3333" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinejoin="round" strokeWidth="1.2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Frame">
      <Group />
    </div>
  );
}

function Frame189Status1() {
  return (
    <div className="bg-[#050505] content-stretch flex gap-[8px] items-center justify-center pb-[8px] pl-[14px] pr-[12px] pt-[7px] relative shrink-0" data-name="Frame 189/Status3">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Subscribe</p>
      <Frame />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-[320px]">
      <Frame20 />
      <Frame189Status1 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-start min-w-px relative">
      <Frame10 />
      <Frame11 />
      <Frame12 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-start justify-between min-w-px relative self-stretch">
      <Frame16 />
      <Frame18 />
    </div>
  );
}

function Frame2() {
  return null;
}

function Frame3() {
  return null;
}

function Frame4() {
  return (
    <div className="[word-break:break-word] content-stretch flex font-sans gap-[36px] items-center justify-end leading-[normal] not-italic relative shrink-0 text-[17px] text-black tracking-[0.85px] uppercase w-[500px] whitespace-nowrap">
      <p className="relative shrink-0">Search</p>
      <p className="relative shrink-0">Cart</p>
      <p className="relative shrink-0">Sign in</p>
    </div>
  );
}

function Frame5() {
  return <SiteNav />;
}

function Frame189Status3() {
  return (
    <div className="bg-[#050505] content-stretch flex items-center justify-center pb-[8px] pt-[7px] px-[20px] relative shrink-0" data-name="Frame 189/Status3">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Search</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Frame">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Frame">
          <path d="M15 5L5 15" id="Vector" stroke="var(--stroke-0, black)" strokeLinejoin="round" strokeWidth="1.2" />
          <path d="M5 5L15 15" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinejoin="round" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
      <Frame189Status3 />
      <Frame1 />
    </div>
  );
}




function Frame189Status2() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <div className="content-stretch flex items-center justify-center py-[30px] relative shrink-0 w-[600px]">
      <div className="content-stretch flex items-center justify-between pb-[12px] relative shrink-0 w-[600px] border-b border-[#e2e2e2]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keyword"
          className="font-sans leading-[28px] text-[#1c1c1c] text-[17px] outline-none border-none bg-transparent flex-1 placeholder:text-[#404040] pr-[16px]"
          style={{
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            fontSize: "17px",
            color: "#1c1c1c",
          }}
        />
        <div className="flex gap-[20px] items-center shrink-0">
          <button
            type="button"
            onClick={() => {}}
            className="bg-[#050505] flex items-center justify-center pb-[8px] pt-[7px] px-[20px] cursor-pointer hover:opacity-90 transition-opacity border-none"
          >
            <p className="font-sans leading-[24px] text-[16px] text-white whitespace-nowrap m-0 cursor-pointer">Search</p>
          </button>
          <button
            type="button"
            onClick={() => { if (typeof window !== "undefined" && window.history.length > 1) { router.back(); } else { router.push("/"); } }}
            className="size-[20px] flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity background-none border-none p-0"
            aria-label="Clear search"
          >
            <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
              <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
              <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Search({ products }: { products?: ProductItem[] }) {
  return (
    <div className="bg-white content-stretch flex flex-col items-center pt-[0px] relative size-full min-h-screen" data-name="Search">
      <SiteNav />
      <div className="w-full flex justify-center py-[24px]">
        <Frame189Status2 />
      </div>
      <Frame6 products={products} />
      <SiteFooter />
    </div>
  );
}