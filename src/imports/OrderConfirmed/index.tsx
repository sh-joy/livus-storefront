'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SiteNav } from '@/figma-components/SiteNav';
import { getConfirmedOrderDetailsAction } from "@/app/actions/orders";
import { trackPurchase } from "@/lib/analytics";
import { formatBdt } from "@/lib/utils";

interface VerifiedOrderDetails {
  authorized: boolean;
  orderNumber?: string;
  customerName?: string;
  location?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentTrxId?: string;
  paymentSenderPhone?: string;
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

  useEffect(() => {
    if (orderData?.authorized && orderData.orderNumber && typeof orderData.totalAmount === 'number') {
      trackPurchase({
        orderId: orderData.orderNumber,
        total: orderData.totalAmount,
        items: [
          {
            id: orderData.orderNumber,
            name: `Order ${orderData.orderNumber}`,
            price: orderData.totalAmount,
            quantity: orderData.itemsCount || 1,
          },
        ],
      });
    }
  }, [orderData]);

  // The order number comes back in the confirmation link; only show it if it looks like one of ours.
  const displayOrderNumber = orderData?.orderNumber || (/^LIV-\d{4,10}$/i.test(rawOrderParam) ? rawOrderParam.toUpperCase() : "");

  const isWallet = Boolean(
    orderData?.paymentTrxId ||
    orderData?.paymentMethod?.toLowerCase().includes('bkash') ||
    orderData?.paymentMethod?.toLowerCase().includes('nagad')
  );

  const rows: Array<[string, string]> = orderData?.authorized
    ? ([
        orderData.location ? ["Delivery to", orderData.location] : null,
        orderData.paymentMethod ? ["Payment method", orderData.paymentMethod] : null,
        isWallet ? ["Payment status", "Payment received for verification"] : null,
        isWallet && orderData.paymentTrxId ? ["Transaction ID (TrxID)", orderData.paymentTrxId] : null,
        isWallet && orderData.paymentSenderPhone ? ["Sender number", orderData.paymentSenderPhone] : null,
        typeof orderData.totalAmount === "number" ? ["Total", formatBdt(orderData.totalAmount)] : null,
      ].filter(Boolean) as Array<[string, string]>)
    : [];

  return (
    <div className="bg-white flex flex-col min-h-[100dvh] w-full" data-name="Order Confirmed">
      <SiteNav />

      <main className="w-full flex-1 flex flex-col items-center justify-center px-[var(--lv-gutter)] py-[clamp(32px,5vw,72px)] text-center">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          <h1 className="t-h2 m-0">Thank you for your order</h1>
          <p className="t-lead mt-5 mb-0">
            Your order has been placed. Our team will confirm it by phone and dispatch it within 2–3 working days.
          </p>

          {displayOrderNumber && (
            <div className="w-full mt-9 border border-[var(--lv-line)]">
              <div className="px-6 py-6 flex flex-col items-center gap-1">
                <span className="t-eyebrow text-[var(--lv-ink-muted)]">Order number</span>
                <span className="t-h3 m-0 tracking-[0.04em]">{displayOrderNumber}</span>
                <span className="t-small text-[var(--lv-ink-muted)]">Keep this number to track your order or contact support.</span>
              </div>
              {loading ? (
                <p className="t-small m-0 px-6 py-4 border-t border-[var(--lv-line)] text-[var(--lv-ink-muted)]">Loading order details…</p>
              ) : (
                rows.length > 0 && (
                  <>
                    <dl className="m-0 border-t border-[var(--lv-line)] text-left">
                      {rows.map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-4 px-6 py-3 border-b last:border-b-0 border-[var(--lv-line)]">
                          <dt className="t-body text-[var(--lv-ink-muted)]">{k}</dt>
                          <dd className="t-body m-0 text-right text-[#0d0d0d]">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {isWallet && (
                      <div className="p-4 bg-neutral-50 border-t border-[var(--lv-line)] text-center">
                        <p className="t-small m-0 text-[var(--lv-ink-muted)]">
                          We&apos;ll confirm once we&apos;ve checked it (usually within a few hours).
                        </p>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-9">
            <Link href={displayOrderNumber ? `/profile?order=${encodeURIComponent(displayOrderNumber)}` : "/profile"} className="lv-btn lv-btn--solid">
              Track my order
            </Link>
            <Link href="/all-products" className="lv-btn lv-btn--outline">
              Continue shopping
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter compact />
    </div>
  );
}
