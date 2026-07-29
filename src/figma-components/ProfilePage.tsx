'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { InputField } from "./InputField";
import productImg from "@/imports/ProductDetails/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

function RightArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
      <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
      <path d="M8 2V14M8 14L3 9M8 14L13 9" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const base: CSSProperties = {
  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
  fontSize: "17px", lineHeight: "24px", letterSpacing: "0.17px",
  color: "var(--ink)", fontWeight: 400,
};

const sectionLabel: CSSProperties = {
  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
  fontSize: "15px", lineHeight: "24px", fontWeight: 500,
  color: "var(--ink-muted)", letterSpacing: "0.9px",
  textTransform: "uppercase",
};

type OrderStatus = "Pending" | "Processing" | "Delivered";

interface OrderItem {
  name: string;
  meta: string;
  price: string;
}

interface Order {
  id: string;
  date: string;
  total: string;
  status: OrderStatus;
  subtotal: string;
  vat: string;
  delivery: string;
  items: OrderItem[];
}

const orders: Order[] = [
  {
    id: "#ORD-9428",
    date: "July 24, 2026",
    total: "৳ 2,130.00",
    status: "Pending",
    subtotal: "৳ 1,790.00",
    vat: "৳ 90.00",
    delivery: "৳ 150.00",
    items: [
      { name: "OWAYO - CROSS FADE", meta: "Color: Black & White · Size: XL · Qty: 1", price: "৳ 899 BDT" },
      { name: "NIXON - TIME TELLER", meta: "Color: Rose Gold · Size: M · Qty: 2", price: "৳ 790 BDT" },
    ],
  },
  {
    id: "#ORD-8102",
    date: "June 12, 2026",
    total: "৳ 1,450.00",
    status: "Delivered",
    subtotal: "৳ 1,250.00",
    vat: "৳ 50.00",
    delivery: "৳ 150.00",
    items: [
      { name: "APEX - GEOMETRIC MESH", meta: "Color: White & Gold · Size: L · Qty: 1", price: "৳ 1,250 BDT" },
    ],
  },
];

const statusStyle: Record<OrderStatus, CSSProperties> = {
  Pending: {
    background: "#fff3cd", color: "#856404",
    padding: "4px 10px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "24px", whiteSpace: "nowrap",
  },
  Processing: {
    background: "#cce5ff", color: "#004085",
    padding: "4px 10px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "24px", whiteSpace: "nowrap",
  },
  Delivered: {
    background: "#d8f3dc", color: "#2d6a4f",
    padding: "4px 10px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "24px", whiteSpace: "nowrap",
  },
};

export function ProfilePage() {
  const router = useRouter();

  const [name, setName]       = useState("Alex Johnson");
  const [email, setEmail]     = useState("alex@example.com");
  const [phone, setPhone]     = useState("+880 17XX XXX XXX");
  const [address, setAddress] = useState("123 Jersey Street");
  const [apt, setApt]         = useState("Apt 4B");
  const [city, setCity]       = useState("Dhaka");
  const [region, setRegion]   = useState("Dhaka Division");
  const [zip, setZip]         = useState("1207");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
      <SiteNav />

      <div style={{ flex: 1 }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "1080px",
          margin: "0px auto",
          padding: "80px 0px",
          gap: "60px",
        }}>

          {/* Heading row — Centered Profile / Sign out container */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
            <p style={{
              fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
              fontSize: "48px", fontWeight: 600, lineHeight: "56px",
              color: "var(--ink)",
            }}>Profile</p>
            <p
              style={{ ...base, color: "var(--ink-muted)", textDecoration: "underline", cursor: "pointer" }}
              onClick={() => router.push("/signin")}
            >
              Sign out
            </p>
          </div>

          {/* Personal information */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <p style={sectionLabel}>Personal information</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
              <InputField label="Full name" value={name} onChange={setName} autoComplete="name" />
              <InputField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
              <InputField label="Phone number" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
              <InputField label="Street address" value={address} onChange={setAddress} autoComplete="street-address" />
              <InputField label="Apt / Suite / Floor" value={apt} onChange={setApt} />
              <InputField label="City" value={city} onChange={setCity} autoComplete="address-level2" />
              <InputField label="State / Region" value={region} onChange={setRegion} autoComplete="address-level1" />
              <InputField label="ZIP / Post code" value={zip} onChange={setZip} autoComplete="postal-code" />
            </div>

            <button
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#0d0d0d", color: "#ffffff", border: "none", cursor: "pointer",
                padding: "10px 20px",
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "16px", letterSpacing: "0.8px", textTransform: "uppercase",
                fontWeight: 500, lineHeight: "24px", alignSelf: "flex-start",
              }}
            >
              Save changes
              <RightArrow />
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)", flexShrink: 0 }} />

          {/* Order history */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <p style={sectionLabel}>Order history</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {orders.map((order, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    border: "1px solid rgba(0,0,0,0.1)",
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    display: "flex", flexDirection: "column", gap: "16px",
                    padding: "25px",
                  }}>
                    {/* Order header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <p style={{ ...base, fontSize: "18px", fontWeight: 500, letterSpacing: "-0.36px" }}>{order.id}</p>
                        <p style={{ ...base, fontSize: "17px", color: "#1c1c1c", letterSpacing: "-0.085px" }}>{order.date}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                        <p style={{ ...base, fontSize: "18px", fontWeight: 500, letterSpacing: "-0.36px" }}>Total: {order.total}</p>
                        <span style={statusStyle[order.status]}>{order.status}</span>
                      </div>
                    </div>

                    {/* Items */}
                    {order.items.map((item, j) => (
                      <div key={j} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{
                          width: "70px", height: "70px", background: "#f0f0f0",
                          overflow: "hidden", flexShrink: 0,
                        }}>
                          <img alt={item.name} src={typeof productImg === 'string' ? productImg : productImg?.src}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                          <p style={{ ...base, fontWeight: 500 }}>{item.name}</p>
                          <p style={{ ...base, color: "var(--ink-muted)" }}>{item.meta}</p>
                        </div>
                        <p style={{ ...base, fontWeight: 500, flexShrink: 0 }}>{item.price}</p>
                      </div>
                    ))}

                    {/* Thin separator */}
                    <div style={{ width: "100%", height: "1px", background: "#e2e2e2" }} />

                    {/* Pricing summary */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                      <p style={{ ...base }}>Subtotal: {order.subtotal}</p>
                      <p style={{ ...base }}>VAT: {order.vat}</p>
                      <p style={{ ...base }}>Delivery Charge: {order.delivery}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#0d0d0d", color: "#ffffff", border: "none", cursor: "pointer",
                padding: "10px 20px",
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "16px", letterSpacing: "0.8px", textTransform: "uppercase",
                fontWeight: 500, lineHeight: "24px", alignSelf: "flex-start",
              }}
            >
              Load more
              <DownArrow />
            </button>
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
