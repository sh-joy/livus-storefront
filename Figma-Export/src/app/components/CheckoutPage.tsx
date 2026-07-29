import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router";
import { InputField } from "./InputField";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import productImg from "../../imports/Cart/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";
import svgPaths from "../../imports/DesignWithBigShoulders/svg-cu3dkwxpmh";

function CardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d={svgPaths.p1e533000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 10H22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p970f200} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p2e28bc00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d={svgPaths.p17418b80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3de716e0} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 16L8 22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p3ceac080} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1405de00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="black" />
      <path d={svgPaths.pb6f3600} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();

  const [fullName, setFullName]     = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [address, setAddress]       = useState("");
  const [apt, setApt]               = useState("");
  const [region, setRegion]         = useState("");
  const [city, setCity]             = useState("");
  const [postal, setPostal]         = useState("");
  const [delivery, setDelivery]     = useState("");
  const [payment, setPayment]       = useState<"online" | "cash">("online");

  const base: CSSProperties = {
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "17px", lineHeight: "24px",
    color: "var(--ink)", letterSpacing: "0.17px", fontWeight: 400,
  };

  const sectionLabel: CSSProperties = {
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "15px", lineHeight: "24px", fontWeight: 500,
    color: "var(--ink-muted)", letterSpacing: "0.9px",
    textTransform: "uppercase",
  };

  const cartItems = [
    { name: "OWAYO - CROSS FADE", color: "Black & White", size: "XL", qty: 1, price: "৳899 BDT" },
    { name: "NIXON - TIME TELLER",  color: "Rose Gold",    size: "M",  qty: 2, price: "৳790 BDT" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
      <SiteNav />

      <div style={{ paddingTop: "58px", flex: 1 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 36px",
          gap: "80px",
          alignItems: "start",
        }}>

          {/* ── LEFT: Form ── */}
          <div style={{ padding: "48px 0 60px", display: "flex", flexDirection: "column", gap: "40px" }}>

            {/* Checkout heading */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{
                fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
                fontSize: "48px", fontWeight: 600,
                color: "var(--ink)", letterSpacing: "-1.44px", lineHeight: "56px",
              }}>Checkout</p>
              <p style={{ ...base, color: "var(--ink-muted)" }}>
                Already have an account?{" "}
                <span
                  style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}
                  onClick={() => navigate("/signin")}
                >
                  Sign in
                </span>
              </p>
            </div>

            {/* Personal information */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <p style={sectionLabel}>Personal information</p>
              <InputField label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
              <InputField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
              <InputField label="Phone number" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
            </div>

            {/* Delivery address */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <p style={sectionLabel}>Delivery address</p>
              <InputField label="Street address" value={address} onChange={setAddress} autoComplete="street-address" />
              <InputField label="Apt / Suite / Floor (optional)" value={apt} onChange={setApt} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* State / Region dropdown */}
                <div style={{ position: "relative", borderBottom: "1px solid var(--border-mid)" }}>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    style={{
                      display: "block", width: "100%", padding: "12px 28px 12px 0",
                      fontSize: "17px", lineHeight: "24px",
                      color: region ? "var(--ink)" : "#565454",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      letterSpacing: "0.17px",
                      appearance: "none", background: "transparent", border: "none", outline: "none",
                    }}
                  >
                    <option value="" disabled>State / Region</option>
                    <option>Dhaka Division</option>
                    <option>Chittagong Division</option>
                    <option>Sylhet Division</option>
                    <option>Rajshahi Division</option>
                    <option>Khulna Division</option>
                    <option>Barishal Division</option>
                    <option>Rangpur Division</option>
                    <option>Mymensingh Division</option>
                  </select>
                  <svg style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="#565454" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* City dropdown */}
                <div style={{ position: "relative", borderBottom: "1px solid var(--border-mid)" }}>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{
                      display: "block", width: "100%", padding: "12px 28px 12px 0",
                      fontSize: "17px", lineHeight: "24px",
                      color: city ? "var(--ink)" : "#565454",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      letterSpacing: "0.17px",
                      appearance: "none", background: "transparent", border: "none", outline: "none",
                    }}
                  >
                    <option value="" disabled>City</option>
                    <option>Dhaka</option>
                    <option>Chittagong</option>
                    <option>Sylhet</option>
                    <option>Rajshahi</option>
                    <option>Khulna</option>
                  </select>
                  <svg style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="#565454" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <InputField label="ZIP / Post code" value={postal} onChange={setPostal} autoComplete="postal-code" />
              <InputField label="Delivery instructions" value={delivery} onChange={setDelivery} />
            </div>

            {/* Payment method */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <p style={sectionLabel}>Payment method</p>
              <div style={{ display: "flex", gap: "10px" }}>

                {/* Online Payment */}
                <button
                  onClick={() => setPayment("online")}
                  style={{
                    flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", gap: "8px",
                    border: `1px solid ${payment === "online" ? "var(--ink)" : "#cccccc"}`,
                    background: "transparent", cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CardIcon />
                    <span style={{ ...base }}>Online Payment</span>
                  </span>
                  {payment === "online" && <CheckCircle />}
                </button>

                {/* Cash on delivery */}
                <button
                  onClick={() => setPayment("cash")}
                  style={{
                    flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", gap: "8px",
                    border: `1px solid ${payment === "cash" ? "var(--ink)" : "#cccccc"}`,
                    background: "transparent", cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TruckIcon />
                    <span style={{ ...base, color: payment === "cash" ? "var(--ink)" : "var(--ink-muted)" }}>Cash on delivery</span>
                  </span>
                  {payment === "cash" && <CheckCircle />}
                </button>

              </div>
            </div>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div style={{ padding: "48px 0 0 0", display: "flex", flexDirection: "column", gap: "28px" }}>

            <p style={{
              fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
              fontSize: "28px", fontWeight: 700,
              color: "var(--ink)", letterSpacing: "-0.5px", lineHeight: "42px",
            }}>Order Summary</p>

            {/* Cart items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {cartItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ width: "90px", height: "110px", background: "#f0f0f0", overflow: "hidden", flexShrink: 0 }}>
                    <img alt={item.name} src={productImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ ...base, fontWeight: 500 }}>{item.name}</p>
                    <p style={{ ...base, color: "var(--ink-muted)" }}>Color: {item.color}</p>
                    <p style={{ ...base, color: "var(--ink-muted)" }}>Size: {item.size}</p>
                    <p style={{ ...base, color: "var(--ink-muted)" }}>Qty: {item.qty}</p>
                  </div>
                  <p style={{ ...base, fontWeight: 500, flexShrink: 0 }}>{item.price}</p>
                </div>
              ))}
            </div>

            {/* Thin separator */}
            <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)" }} />

            {/* Price rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Subtotal",       value: "৳ 1790.00" },
                { label: "VAT",            value: "৳ 90.00" },
                { label: "Delivery Charge", value: "৳ 150.00" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ ...base, letterSpacing: "-0.34px" }}>{label}</p>
                  <p style={{ ...base, letterSpacing: "-0.34px" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Total + CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ ...base, fontWeight: 500, letterSpacing: "-0.34px" }}>Total</p>
                <p style={{ ...base, fontWeight: 500, letterSpacing: "-0.34px" }}>৳ 2130.00</p>
              </div>

              <button
                onClick={() => navigate("/order-confirmed")}
                style={{
                  background: "#050505", color: "#ffffff", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "12px 20px", width: "100%",
                  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                  fontSize: "17px", lineHeight: "24px", fontWeight: 400,
                  transition: "opacity 0.2s ease",
                }}
              >
                Proceed to payment
              </button>
            </div>
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
