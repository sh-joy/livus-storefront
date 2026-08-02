'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ProductItem } from '@/app/actions/products';

import imgFrame1597881192 from "@/imports/ForHim-2/cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png";
import imgImage114 from "@/imports/ForHim-2/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

export function ProductCard({ product }: { product: any }) {
  const primaryImage =
    product.imageUrl ||
    product.thumbnailUrl ||
    (typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src);

  // All product gallery images
  const images = useMemo(() => {
    const list: string[] = [];
    if (primaryImage) list.push(primaryImage);

    // 1. Extract galleryImages from product data
    if (product.galleryImages && Array.isArray(product.galleryImages)) {
      product.galleryImages.forEach((img: string) => {
        if (img && typeof img === 'string' && !list.includes(img)) {
          list.push(img);
        }
      });
    }

    // 2. Extract from colorVariants if provided
    if (product.colorVariants && Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((v: any) => {
        if (v.thumbnailUrl && !list.includes(v.thumbnailUrl)) list.push(v.thumbnailUrl);
        if (v.galleryImages && Array.isArray(v.galleryImages)) {
          v.galleryImages.forEach((img: string) => {
            if (img && typeof img === 'string' && !list.includes(img)) list.push(img);
          });
        }
      });
    }

    // 3. Fallback pool ONLY if product has less than 2 photos in DB
    if (list.length < 2) {
      const altPool = [
        typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src,
        typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src,
        '/images/for_him.jpg',
        '/images/for_her.jpg',
      ].filter(Boolean) as string[];

      const strSum = (product.id || product.name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const secondaryIndex = strSum % altPool.length;
      const secondaryImage = altPool[secondaryIndex];

      if (secondaryImage && !list.includes(secondaryImage)) {
        list.push(secondaryImage);
      }
    }
    return list;
  }, [primaryImage, product.galleryImages, product.colorVariants, product.id, product.name]);

  const [isHovered, setIsHovered] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);

  // Handle Mouse Enter: Trigger right-to-left mask transition to image #2 (or next)
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (images.length > 1) {
      setPrevIdx(currentIdx);
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }
  };

  // Handle Mouse Leave: Smoothly transition back to primary image #1
  const handleMouseLeave = () => {
    setIsHovered(false);
    setPrevIdx(currentIdx);
    setCurrentIdx(0);
  };

  // 5-Second Carousel cycle when hovered continuously
  useEffect(() => {
    if (!isHovered || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIdx((prevCurrent) => {
        setPrevIdx(prevCurrent);
        return (prevCurrent + 1) % images.length;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, images.length]);

  const hasDiscount = !!(product.compareAtPriceBdt && product.compareAtPriceBdt > product.priceBdt);
  const isRealProduct = !product.id.startsWith('default-');

  const currentImageSrc = images[currentIdx] || primaryImage;
  const prevImageSrc = images[prevIdx] || primaryImage;

  const cardContent = (
    <div
      data-product-card="true"
      className="flex flex-col gap-[16px] cursor-pointer group w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Centered Image Container (3:4 aspect ratio, NO zoom) */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#f0f0f0]">
        {/* Underneath Previous Image (Z-0) */}
        {prevImageSrc && prevImageSrc !== currentImageSrc && (
          <img
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
            src={prevImageSrc}
          />
        )}

        {/* Incoming Revealed Image with Slower Symmetrical Ease-In-Out Right-to-Left Mask Wipe (Z-10) */}
        <motion.img
          key={currentImageSrc}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-10"
          src={currentImageSrc}
          initial={{ clipPath: isHovered ? "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" : "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
          animate={{ clipPath: "polygon(0% 0, 100% 0, 100% 100%, 0% 100%)" }}
          transition={{ duration: 1.05, ease: "easeInOut" }}
        />

        {/* DISCOUNT BADGE STRICTLY 15PX FONT SIZE & REGULAR 400 WEIGHT */}
        {hasDiscount && (
          <div className="absolute left-4 top-4 bg-black px-2.5 py-1 flex items-center justify-center z-20">
            <p
              className="text-white text-[15px] font-sans font-normal uppercase tracking-[0.5px]"
              style={{ fontSize: "15px", fontWeight: 400 }}
            >
              {product.compareAtPriceBdt && product.compareAtPriceBdt > product.priceBdt
                ? `${Math.round(((product.compareAtPriceBdt - product.priceBdt) / product.compareAtPriceBdt) * 100)}% OFF`
                : "10% OFF"}
            </p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 px-2">
        <p className="text-[17px] font-normal text-black tracking-[-0.4px] group-hover:text-neutral-700 transition-colors">
          {product.name}
        </p>
        <div className="flex gap-2 items-center">
          <p className="text-[20px] font-medium text-black">
            ৳{product.priceBdt} BDT
          </p>
          {hasDiscount && (
            <p className="text-[18px] line-through text-gray-500 font-normal">
              ৳{product.compareAtPriceBdt} BDT
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const slugFromName = product.name
    ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : null;

  const productSlug =
    product.slug && product.slug !== 'striped-cotton-shirt'
      ? product.slug
      : (slugFromName || product.id || 'product');

  return <Link href={`/product/${productSlug}`}>{cardContent}</Link>;
}
