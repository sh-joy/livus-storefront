'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import Image from "next/image";
import type { ProductItem } from '@/app/actions/products';
import { ProductCard } from '@/figma-components/ProductCard';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { CategoryFilterSubBar } from '@/figma-components/CategoryFilterSubBar';
import svgPaths from "./svg-8f9q8i8m4a";
import imgFrame1597881163 from "./d0bebc10c59b7c075b3c9a8b180df7af46874e97.png";
import imgFrame1597881164 from "./567e4da671b456cb109158110b48b3f597529eca.png";
import imgFrame1597881192 from "./cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png";
import imgImage121 from "./21edf1b8dee7cef23ed2ec91e1a1b0550b6c38c9.png";
import imgImage114 from "./71b3cd582dab7174e13346a8d88abe33548d2aa7.png";



















function CategoryPanel({ href, line1, line2, cta, src, preload = false }: { href: string; line1: string; line2: string; cta: string; src: typeof imgFrame1597881163; preload?: boolean }) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] sm:aspect-square overflow-hidden bg-[#f0f0f0] no-underline"
    >
      <Image
        alt=""
        aria-hidden="true"
        src={src}
        fill
        sizes="(max-width: 639px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        preload={preload}
        priority={preload}
      />
      <div className="absolute inset-0 flex flex-col justify-between p-[clamp(16px,2.4vw,32px)]">
        <h2 className="t-display m-0" style={{ fontSize: "clamp(56px, 7vw, 112px)", lineHeight: 0.85 }}>
          {line1}
          <br />
          {line2}
        </h2>
        <span className="lv-btn lv-btn--light self-end !min-h-[44px] !px-5 group-hover:!bg-[#0d0d0d] group-hover:!text-white group-hover:!border-[#0d0d0d]">
          {cta}
        </span>
      </div>
    </Link>
  );
}

function CategoryPanels() {
  return (
    <section aria-label="Shop by category" className="w-full px-[var(--lv-gutter)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <CategoryPanel href="/for-him" line1="For" line2="Him" cta="Shop for him" src={imgFrame1597881163} preload={true} />
        <CategoryPanel href="/for-her" line1="For" line2="Her" cta="Shop for her" src={imgFrame1597881164} preload={false} />
      </div>
    </section>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[600px]">
      <p className="[word-break:break-word] flex-[1_0_0] font-sans leading-[24px] min-w-px not-italic relative text-[20px] text-black tracking-normal">Our most-loved pieces right now. New styles land with every drop.</p>
    </div>
  );
}

function Frame33({ activeTag, onSelectTag }: { activeTag: string; onSelectTag: (tag: string) => void }) {
  const tags = ["All Designs", "Minimal", "Gaming", "Floral", "Divine"];

  return (
    <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
      {tags.map((t) => {
        const isSelected = activeTag === t || (activeTag === "all" && t === "All Designs");
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelectTag(t === "All Designs" ? "all" : t)}
            className="content-stretch flex items-center justify-center px-[2px] py-[5px] relative shrink-0 cursor-pointer bg-transparent border-none"
          >
            {isSelected && (
              <div aria-hidden className="absolute border-[#1a1a1a] border-b border-solid inset-0 pointer-events-none" />
            )}
            <p className={`[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[17px] tracking-[0.17px] whitespace-nowrap cursor-pointer ${
              isSelected ? "text-[#1a1a1a] font-medium" : "text-[#606060] hover:text-[#1a1a1a]"
            }`}>
              {t}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Frame">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Frame">
          <path d={svgPaths.p52e7900} id="Vector" stroke="var(--stroke-0, #404040)" strokeWidth="1.2" />
          <path d="M14.1667 16.6667V3.33333" id="Vector_2" stroke="var(--stroke-0, #404040)" strokeWidth="1.2" />
          <path d={svgPaths.p31af7ac0} id="Vector_3" stroke="var(--stroke-0, #404040)" strokeWidth="1.2" />
          <path d="M5.83333 3.33333V16.6667" id="Vector_4" stroke="var(--stroke-0, #404040)" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

function Frame189Status8({ sortOrder, onToggleSort }: { sortOrder: "high-to-low" | "low-to-high"; onToggleSort: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggleSort}
      className="content-stretch flex items-center justify-center px-[6px] py-[5px] relative shrink-0 cursor-pointer bg-transparent border-none opacity-60 hover:opacity-100 transition-opacity"
      data-name="Frame 189/Status3"
    >
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#404040] text-[17px] tracking-[0.17px] whitespace-nowrap font-medium cursor-pointer">
        Price: {sortOrder === "high-to-low" ? "High to Low ↓" : "Low to High ↑"}
      </p>
    </button>
  );
}

function Frame12({
  activeTag,
  onSelectTag,
  sortOrder,
  onToggleSort,
}: {
  activeTag: string;
  onSelectTag: (tag: string) => void;
  sortOrder: "high-to-low" | "low-to-high";
  onToggleSort: () => void;
}) {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <Frame33 activeTag={activeTag} onSelectTag={onSelectTag} />
      <Frame189Status8 sortOrder={sortOrder} onToggleSort={onToggleSort} />
    </div>
  );
}

function Frame20({
  activeTag,
  onSelectTag,
  sortOrder,
  onToggleSort,
}: {
  activeTag: string;
  onSelectTag: (tag: string) => void;
  sortOrder: "high-to-low" | "low-to-high";
  onToggleSort: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[50px] items-start relative shrink-0 w-full">
      <Frame16 />
      <Frame12
        activeTag={activeTag}
        onSelectTag={onSelectTag}
        sortOrder={sortOrder}
        onToggleSort={onToggleSort}
      />
    </div>
  );
}

function Frame7({ text }: { text?: string }) {
  return (
    <div className="relative shrink-0 w-full px-[var(--lv-gutter)] pb-[clamp(16px,2vw,24px)]">
      <div className="flex flex-col gap-2 max-w-[640px]">
        <h2 className="t-h2 m-0">Explore the collection</h2>
        <p className="t-lead m-0 text-[#4a4a4a]">
          {text || "Our most-loved jerseys, shirts and everyday athletic wear right now. New styles land with every drop."}
        </p>
      </div>
    </div>
  );
}

function Frame189Status9() {
  return (
    <div className="bg-[#050505] content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative shrink-0" data-name="Frame 189/Status3">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">10% OFF</p>
    </div>
  );
}

function Frame52() {
  return (
    <div className="aspect-[3/4] relative shrink-0 w-full">
      <Image alt="" aria-hidden="true" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgFrame1597881192} sizes="(max-width: 1023px) 50vw, 33vw" />
      <div className="content-stretch flex items-start p-[16px] relative size-full">
        <Frame189Status9 />
      </div>
    </div>
  );
}

function Frame53() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]" style={{ fontVariationSettings: '"wdth" 100, "wght" 500' }}>
        ৳899 BDT
      </p>
      <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid font-['Overused Grotesk:Regular','Noto_Sans_Bengali:Regular',sans-serif] line-through relative shrink-0 text-[#666666] text-[18px] font-normal font-medium" style={{ fontVariationSettings: '"wdth" 100, "wght" 400' }}>
        ৳1199 BDT
      </p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-normal">OWAYO - CROSS FADE</p>
      <Frame53 />
    </div>
  );
}

function Frame34() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <Frame52 />
      <Frame22 />
    </div>
  );
}

function Frame25() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 text-[#1c1c1c] w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-normal">OWAYO - CROSS FADE</p>
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

function Frame35() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <div className="aspect-[3/4] relative shrink-0 w-full" data-name="image 121">
        <Image alt="" aria-hidden="true" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage121} sizes="(max-width: 1023px) 50vw, 33vw" />
        <div className="content-stretch flex items-start p-[16px] relative size-full">
          <Frame189Status9 />
        </div>
      </div>
      <Frame25 />
    </div>
  );
}

function Frame189Status10() {
  return (
    <div className="bg-[#050505] content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative shrink-0" data-name="Frame 189/Status3">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">10% OFF</p>
    </div>
  );
}

function Frame54() {
  return (
    <div className="aspect-[3/4] relative shrink-0 w-full">
      <Image alt="" aria-hidden="true" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgFrame1597881192} sizes="(max-width: 1023px) 50vw, 33vw" />
      <div className="content-stretch flex items-start p-[16px] relative size-full">
        <Frame189Status10 />
      </div>
    </div>
  );
}

function Frame55() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]" style={{ fontVariationSettings: '"wdth" 100, "wght" 500' }}>
        ৳899 BDT
      </p>
      <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid font-['Overused Grotesk:Regular','Noto_Sans_Bengali:Regular',sans-serif] line-through relative shrink-0 text-[#666666] text-[18px] font-normal font-medium" style={{ fontVariationSettings: '"wdth" 100, "wght" 400' }}>
        ৳1199 BDT
      </p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-normal">OWAYO - CROSS FADE</p>
      <Frame55 />
    </div>
  );
}

function Frame36() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <Frame54 />
      <Frame26 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="aspect-[4/4] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative">
      <div className="aspect-[748.66796875/869.708984375] h-full relative shrink-0" data-name="image 114">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image alt="" aria-hidden="true" className="absolute h-full left-[-8.01%] max-w-none top-0 w-[116.17%]" src={imgImage114} sizes="(max-width: 1023px) 50vw, 33vw" />
        </div>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="aspect-[3/4] bg-[#f0f0f0] content-stretch flex items-center justify-center overflow-clip relative shrink-0 w-full">
      <Frame21 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 text-[#1c1c1c] w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-normal">OWAYO - CROSS FADE</p>
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

function Frame27() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <Frame13 />
      <Frame28 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="aspect-[4/4] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative">
      <div className="aspect-[748.66796875/869.708984375] h-full relative shrink-0" data-name="image 114">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image alt="" aria-hidden="true" className="absolute h-full left-[-8.01%] max-w-none top-0 w-[116.17%]" src={imgImage114} sizes="(max-width: 1023px) 50vw, 33vw" />
        </div>
      </div>
    </div>
  );
}

function Frame14() {
  return (
    <div className="aspect-[3/4] bg-[#f0f0f0] content-stretch flex items-center justify-center overflow-clip relative shrink-0 w-full">
      <Frame30 />
    </div>
  );
}

function Frame31() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 text-[#1c1c1c] w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-normal">OWAYO - CROSS FADE</p>
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

function Frame29() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <Frame14 />
      <Frame31 />
    </div>
  );
}

function Frame39() {
  return (
    <div className="aspect-[4/4] content-stretch flex flex-[1_0_0] items-center justify-center min-w-px relative">
      <div className="aspect-[748.66796875/869.708984375] h-full relative shrink-0" data-name="image 114">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image alt="" aria-hidden="true" className="absolute h-full left-[-8.01%] max-w-none top-0 w-[116.17%]" src={imgImage114} sizes="(max-width: 1023px) 50vw, 33vw" />
        </div>
      </div>
    </div>
  );
}

function Frame38() {
  return (
    <div className="aspect-[3/4] bg-[#f0f0f0] content-stretch flex items-center justify-center overflow-clip relative shrink-0 w-full">
      <Frame39 />
    </div>
  );
}

function Frame40() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 text-[#1c1c1c] w-[436px] whitespace-nowrap">
      <p className="font-sans not-italic relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-normal">OWAYO - CROSS FADE</p>
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

function Frame37() {
  return (
    <div data-product-card="true" className="content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
      <Frame38 />
      <Frame40 />
    </div>
  );
}

interface HomepageProductItem {
  id: string;
  name: string;
  slug: string;
  priceBdt: number;
  price: string;
  imageUrl?: string;
  compareAtPriceBdt?: number;
  collectionTag?: string;
  categoryName?: string;
  categorySlug?: string;
  sizes?: string[];
  createdAt?: string | Date;
}

function Frame15({ products, onResetFilter }: { products?: HomepageProductItem[]; onResetFilter?: () => void }) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full px-[var(--lv-gutter)] py-12 flex flex-col items-center text-center gap-3">
        <p className="t-h3 m-0">No products match these filters</p>
        {onResetFilter && (
          <button type="button" onClick={onResetFilter} className="lv-btn lv-btn--outline mt-2">
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0 w-full">
      <div className="product-grid-4col px-[36px] relative w-full">
        {products.map((p, idx) => (
          <ProductCard key={p.id ? `${p.id}-${idx}` : `prod-${idx}`} product={p} />
        ))}
      </div>
    </div>
  );
}








function Frame3() {
  return null;
}

function Frame9() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[500px]">
      <p className="[word-break:break-word] font-sans leading-[normal] not-italic relative shrink-0 text-[17px] text-black tracking-[0.85px] uppercase whitespace-nowrap">menu</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="[word-break:break-word] content-stretch flex font-sans gap-[36px] items-center justify-end leading-[normal] not-italic relative shrink-0 text-[17px] text-black tracking-[0.85px] uppercase w-[500px] whitespace-nowrap">
      <p className="relative shrink-0">Search</p>
      <p className="relative shrink-0">Cart</p>
      <p className="relative shrink-0">Sign in</p>
    </div>
  );
}

function Frame46() {
  return <SiteNav />;
}

function Frame49() {
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

function Frame48() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col h-full items-start justify-between relative shrink-0 w-[572px] whitespace-nowrap">
      <p className="font-serif font-semibold leading-[26px] relative shrink-0 text-[30px] text-black tracking-[9px]">LIVUS</p>
      <Frame49 />
    </div>
  );
}

function Frame51() {
  return (
    <div className="flex-[1_0_0] min-w-px relative">
      <div className="[word-break:break-word] content-stretch flex flex-col font-sans gap-[16px] items-start leading-[24px] not-italic px-[8px] relative size-full text-[#333] text-[17px] tracking-[0.17px] whitespace-nowrap">
        <p className="relative shrink-0">Home</p>
        <p className="relative shrink-0">Collections</p>
        <p className="relative shrink-0">Profile</p>
      </div>
    </div>
  );
}

function Frame56() {
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

function Frame59() {
  return (
    <div className="content-stretch flex items-center py-[9px] relative shrink-0 w-full">
      <div aria-hidden className="absolute border-[rgba(0,0,0,0.25)] border-b border-solid inset-0 pointer-events-none" />
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#333] text-[17px] tracking-[0.17px] whitespace-nowrap">Enter your email address</p>
    </div>
  );
}

function Frame58() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#1c1c1c] text-[14px] tracking-[0.7px] whitespace-nowrap">SUBSCRIBE TO OUR NEWSLETTER</p>
      <Frame59 />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute flex inset-[4.29%_4.28%_4.3%_4.3%] items-center justify-center" style={{ containerType: "size" }}>
      <div className="-rotate-135 -scale-x-100 flex-none h-[hypot(64.4613cqw,-64.4613cqh)] w-[hypot(35.5387cqw,35.5387cqh)]">
        <div className="relative size-full">
          <div className="absolute inset-[0_-5.77%_-6.36%_-5.78%]">
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

function Frame2() {
  return (
    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Frame">
      <Group1 />
    </div>
  );
}

function Frame189Status12() {
  return (
    <div className="bg-[#050505] content-stretch flex gap-[8px] items-center justify-center pb-[8px] pl-[14px] pr-[12px] pt-[7px] relative shrink-0" data-name="Frame 189/Status3">
      <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Subscribe</p>
      <Frame2 />
    </div>
  );
}

function Frame57() {
  return (
    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-[320px]">
      <Frame58 />
      <Frame189Status12 />
    </div>
  );
}

function Frame50() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-start min-w-px relative">
      <Frame51 />
      <Frame56 />
      <Frame57 />
    </div>
  );
}

function Frame47() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-start justify-between min-w-px relative self-stretch">
      <Frame48 />
      <Frame50 />
    </div>
  );
}

export default function Homepage({
  products,
  collectionText,
}: {
  products?: HomepageProductItem[];
  collectionText?: string;
}) {
  // Popularity Scoring & New Drops Logic
  const popularProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const scored = products.map((p, idx) => {
      let score = 100 - idx;
      if (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt) score += 30;
      if (p.collectionTag === "Minimal" || p.collectionTag === "Divine") score += 20;
      return { product: p, score };
    });

    // 4 rows = 12 items on 3 cols, 16 items on 4 cols (>1440px)
    return scored.slice(0, 16).map((item) => item.product);
  }, [products]);

  const [sortOption, setSortOption] = useState("relevance");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const shownProducts = useMemo(() => {
    const cat = selectedCategory.toLowerCase();
    const list = popularProducts.filter((p) => {
      if (selectedGender !== "all" && (p.categorySlug || "").toLowerCase() !== selectedGender) return false;
      if (cat !== "all") {
        const hit = [p.categorySlug, p.categoryName, p.collectionTag].some((v) => (v || "").toLowerCase() === cat);
        if (!hit) return false;
      }
      if (selectedSize !== "all" && p.sizes && p.sizes.length > 0 && !p.sizes.map((x) => x.toUpperCase()).includes(selectedSize.toUpperCase())) {
        return false;
      }
      return true;
    });
    const time = (p: HomepageProductItem) => (p.createdAt ? new Date(p.createdAt).getTime() : 0);
    const off = (p: HomepageProductItem) => (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt ? (p.compareAtPriceBdt - p.priceBdt) / p.compareAtPriceBdt : 0);
    if (sortOption === "low-to-high") return [...list].sort((a, b) => a.priceBdt - b.priceBdt);
    if (sortOption === "high-to-low") return [...list].sort((a, b) => b.priceBdt - a.priceBdt);
    if (sortOption === "newest") return [...list].sort((a, b) => time(b) - time(a));
    if (sortOption === "best-selling") return [...list].sort((a, b) => off(b) - off(a));
    return list; // relevance / popular: already ranked
  }, [popularProducts, sortOption, selectedGender, selectedSize, selectedCategory]);

  const resetFilters = () => {
    setSortOption("relevance");
    setSelectedGender("all");
    setSelectedSize("all");
    setSelectedCategory("all");
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Homepage">
      <SiteNav />
      <h1 className="sr-only">LIVUS — jerseys and streetwear for him and her</h1>
      <div className="h-2 md:h-3" aria-hidden />
      <CategoryPanels />
      <div className="h-[clamp(80px,10.3vw,148px)]" aria-hidden />
      <Frame7 text={collectionText} />
      <CategoryFilterSubBar
        totalCount={shownProducts.length}
        hideProductCount={true}
        sortOption={sortOption}
        onSortChange={setSortOption}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
      />
      <div className="h-6 md:h-8" aria-hidden />
      <Frame15 products={shownProducts} onResetFilter={resetFilters} />
      
      {/* "Explore All" Button */}
      <div className="w-full flex items-center justify-center pt-8 pb-16">
        <Link href="/all-products" className="lv-btn lv-btn--solid">
          Explore all
        </Link>
      </div>

      <SiteFooter />
    </div>
  );
}