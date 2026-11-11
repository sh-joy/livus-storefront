'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SiteNav } from '@/figma-components/SiteNav';
import { getConfirmedOrderDetailsAction } from "@/app/actions/orders";

interface VerifiedOrderDetails {
  authorized: boolean;
  orderNumber?: string;
  customerName?: string;
  location?: string;
  paymentMethod?: string;
  totalAmount?: number;
  status?: string;
  itemsCount?: number;
}

export default function OrderConfirmed() {
  const searchParams = useSearchParams();
  const rawOrderParam = searchParams ? searchParams.get("orderNumber") || "" : "";

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<VerifiedOrderDetails | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (!rawOrderParam) {
      setLoading(false);
      setOrderData({ authorized: false });
      return;
    }

    getConfirmedOrderDetailsAction(rawOrderParam).then((res) => {
      if (isCancelled) return;
      setOrderData(res);
      setLoading(false);
    }).catch(() => {
      if (isCancelled) return;
      setOrderData({ authorized: false });
      setLoading(false);
    });

    return () => { isCancelled = true; };
  }, [rawOrderParam]);

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen" data-name="Order Confirmed">
      <SiteNav />

      <div className="w-full flex-1 flex flex-col items-center justify-center py-[100px] px-[24px] text-center max-w-[650px] mx-auto">
        {/* Heading */}
        <h1 className="font-serif font-semibold text-[36px] leading-[44px] text-[#1c1c1c] mb-3">
          Order Placed Successfully!
        </h1>

        <p className="font-sans text-[17px] leading-[26px] text-neutral-600 mb-8 max-w-[560px]">
          Thank you for choosing <span className="font-semibold text-neutral-900">LIVUS</span>. Your order has been registered in our system. Our team will verify your details before dispatching within 2–3 working days.
        </p>

        {loading ? (
          <div className="w-full bg-neutral-50/60 border border-neutral-200 rounded-none p-8 mb-8 text-center font-sans text-neutral-400 text-sm">
            Verifying order details...
          </div>
        ) : orderData?.authorized ? (
          /* Server-verified Order Details Card (SQA M5) */
          <div className="w-full bg-neutral-50/60 border border-neutral-200 rounded-none p-6 mb-8 text-left flex flex-col gap-3 font-sans">
            {/* Order ID */}
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-[#666666] font-normal text-[16px]">Order ID:</span>
              <span className="font-medium text-[16px] text-neutral-900">{orderData.orderNumber}</span>
            </div>

            {/* Location */}
            {orderData.location && (
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-[#666666] font-normal text-[16px]">Location:</span>
                <span className="font-medium text-[16px] text-neutral-900 truncate max-w-[280px] text-right">{orderData.location}</span>
              </div>
            )}

            {/* Payment Method */}
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <span className="text-[#666666] font-normal text-[16px]">Payment Method:</span>
              <span className="font-medium text-[16px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-none border border-emerald-200">
                {orderData.paymentMethod}
              </span>
            </div>

            {/* Total Amount (Server-calculated, never from URL) */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-[#666666] font-normal text-[16px]">Total Amount:</span>
              <span className="font-medium text-[16px] text-neutral-900">৳{orderData.totalAmount?.toLocaleString()} BDT</span>
            </div>
          </div>
        ) : (
          /* Secure Fallback for unauthorized visitors or direct URL visits without session/cookie */
          <div className="w-full bg-neutral-50/60 border border-neutral-200 rounded-none p-6 mb-8 text-center flex flex-col gap-2 font-sans">
            <p className="text-[#1c1c1c] font-medium text-[16px]">
              Order Confirmed
            </p>
            <p className="text-neutral-500 text-[14px] leading-[22px]">
              Thank you! Detailed receipt information is sent directly to your email and phone SMS. If you have an account with us, you can also view all your order details and live tracking anytime in your profile.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/profile"
            className="bg-[#050505] text-white py-[12px] px-[20px] text-[17px] font-normal uppercase tracking-[0.5px] cursor-pointer hover:bg-neutral-800 transition-colors text-center text-decoration-none"
          >
            VIEW MY ORDERS
          </Link>
          <Link
            href="/all-products"
            className="border border-[#050505] text-[#050505] py-[12px] px-[20px] text-[17px] font-normal uppercase tracking-[0.5px] cursor-pointer hover:bg-neutral-100 transition-colors text-center text-decoration-none"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}