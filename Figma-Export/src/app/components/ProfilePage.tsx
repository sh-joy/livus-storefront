import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router";
import { InputField } from "./InputField";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import productImg from "../../imports/Cart/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

const base: CSSProperties = {
  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
  fontSize: "17px", lineHeight: "24px",
  color: "var(--ink)", letterSpacing: "0.17px", fontWeight: 400,
};

const sectionLabel: CSSProperties = {
  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
  fontSize: "12px", lineHeight: "24px", fontWeight: 400,
  color: "var(--ink-muted)", letterSpacing: "0.9px", textTransform: "uppercase",
};

function RightArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 13.9931 13.9931" fill="none">
      <path d="M1.99901 6.99655H11.9941M7.99606 10.9946L11.9941 6.99655L7.99606 2.99852"
        stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 13.9931 13.9931" fill="none">
      <path d="M6.99656 1.99854L6.99656 11.9936M2.99853 7.99558L6.99656 11.9936L10.9946 7.99558"
        stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

const orders = [
  {
    id: "Order #83927465",
    date: "July 15, 2026 at 14:22",
    status: "Processing" as const,
    total: "৳1,154 BDT",
    items: [
      { name: "OWAYO - CROSS FADE", meta: "Black & White · XL · Qty 1", price: "৳899 BDT" },
      { name: "OWAYO - CROSS FADE", meta: "Black & White · XL · Qty 1", price: "৳899 BDT" },
    ],
    subtotal: "৳1,154 BDT", vat: "৳154 BDT", delivery: "৳150 BDT",
  },
  {
    id: "Order #83927465",
    date: "July 15, 2026 at 14:22",
    status: "Delivered" as const,
    total: "৳1,154 BDT",
    items: [
      { name: "OWAYO - CROSS FADE", meta: "Black & White · XL · Qty 1", price: "৳899 BDT" },
      { name: "OWAYO - CROSS FADE", meta: "Black & White · XL · Qty 1", price: "৳899 BDT" },
    ],
    subtotal: "৳1,154 BDT", vat: "৳154 BDT", delivery: "৳150 BDT",
  },
];

const statusStyle: Record<"Processing" | "Delivered", CSSProperties> = {
  Processing: {
    background: "#f0f0f0", color: "#606060",
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
  const navigate = useNavigate();

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

      <div style={{ paddingTop: "80px", flex: 1 }}>
        <div style={{
          maxWidth: "960px", margin: "0 auto",
          padding: "48px 36px 80px",
          display: "flex", flexDirection: "column", gap: "64px",
        }}>

          {/* Heading row */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <p style={{
              fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
              fontSize: "48px", fontWeight: 600, lineHeight: "56px",
              color: "var(--ink)",
            }}>Profile</p>
            <p
              style={{ ...base, color: "var(--ink-muted)", textDecoration: "underline", cursor: "pointer" }}
              onClick={() => navigate("/signin")}
            >
              Sign out
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)", flexShrink: 0 }} />

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
                  {/* outer border via pseudo approach */}
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
                          <img alt={item.name} src={productImg}
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

                    {/* Pricing summary — right-aligned */}
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
