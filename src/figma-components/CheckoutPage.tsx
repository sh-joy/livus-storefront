'use client';

import { useState, type CSSProperties } from "react";
import { useCartStore } from "@/lib/store/cart-store";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import productImg from "@/imports/Cart/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

function CardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="1.5" stroke="#1a1a1a" strokeWidth="1.2" />
      <path d="M2 10H22" stroke="#1a1a1a" strokeWidth="1.2" />
      <rect x="5" y="14" width="4" height="2" fill="#1a1a1a" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M1 3H15V16H1V3Z" stroke="#1a1a1a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M15 8H19L22 11V16H15V8Z" stroke="#1a1a1a" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="#1a1a1a" strokeWidth="1.2" />
      <circle cx="17.5" cy="18.5" r="2.5" stroke="#1a1a1a" strokeWidth="1.2" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8.25" fill="#0d0d0d" stroke="#0d0d0d" strokeWidth="1.5" />
      <path d="M5.5 9.2L7.8 11.5L12.5 6.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

export function CheckoutPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [address, setAddress]   = useState("");
  const [apt, setApt]           = useState("");
  const [city, setCity]         = useState("");
  const [region, setRegion]     = useState("");
  const [postal, setPostal]     = useState("");
  const [delivery, setDelivery] = useState("");
  const [payment, setPayment]   = useState<"online" | "cash">("online");

  const [errors, setErrors]     = useState<Record<string, string>>({});

  const cartItems = useCartStore((state) => state.items);

  const subtotalVal = cartItems.reduce((acc, item) => {
    const rawPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, '')) || 0;
    return acc + rawPrice * item.quantity;
  }, 0);

  const vatVal = cartItems.length > 0 ? 90 : 0;
  const deliveryVal = cartItems.length > 0 ? 150 : 0;
  const totalVal = subtotalVal + vatVal + deliveryVal;

  const handleProceedToPayment = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    if (!address.trim()) newErrors.address = "Street address is required";
    if (!region) newErrors.region = "State / Region is required";
    if (!city) newErrors.city = "City is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    router.push("/order-confirmed");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
      <SiteNav />

      <div style={{ flex: 1 }}>
        <div style={{
          maxWidth: "1080px",
          margin: "0px auto",
          padding: "80px 0px",
        }}>

          {/* Top Row: Checkout Heading & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "40px" }}>
            <p style={{
              fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
              fontSize: "48px", fontWeight: 600,
              color: "var(--ink)", letterSpacing: "-1.44px", lineHeight: "56px",
            }}>Checkout</p>
            <p style={{ ...base, color: "var(--ink-muted)" }}>
              Already have an account?{" "}
              <span
                style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer" }}
                onClick={() => router.push("/signin")}
              >
                Sign in
              </span>
            </p>
          </div>

          {/* Main 2-Column Grid (Personal Information & Order Summary on exact same horizontal level) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "start",
          }}>

            {/* ── LEFT: Form ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

              {/* Personal information (Reordered: Full name, Phone number, Email address optional) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <p style={sectionLabel}>Personal information</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <InputField
                    label="Full name *"
                    value={fullName}
                    onChange={(v) => { setFullName(v); if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" })); }}
                    autoComplete="name"
                    error={errors.fullName}
                  />
                  <InputField
                    label="Phone number *"
                    type="tel"
                    value={phone}
                    onChange={(v) => { setPhone(v); if (errors.phone) setErrors(prev => ({ ...prev, phone: "" })); }}
                    autoComplete="tel"
                    error={errors.phone}
                  />
                  <InputField
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Delivery address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <p style={sectionLabel}>Delivery address</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <InputField
                    label="Street address *"
                    value={address}
                    onChange={(v) => { setAddress(v); if (errors.address) setErrors(prev => ({ ...prev, address: "" })); }}
                    autoComplete="street-address"
                    error={errors.address}
                  />
                  <InputField
                    label="Apt / Suite / Floor"
                    value={apt}
                    onChange={setApt}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {/* State / Region dropdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ position: "relative", borderBottom: `1px solid ${errors.region ? "#d4183d" : "rgba(0, 0, 0, 0.2)"}` }}>
                        <select
                          value={region}
                          onChange={(e) => { setRegion(e.target.value); if (errors.region) setErrors(prev => ({ ...prev, region: "" })); }}
                          style={{
                            display: "block", width: "100%", padding: "12px 28px 12px 0",
                            fontSize: "17px", lineHeight: "24px",
                            color: region ? "var(--ink)" : "#808080",
                            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                            letterSpacing: "0.17px",
                            appearance: "none", background: "transparent", border: "none", outline: "none",
                          }}
                        >
                          <option value="" disabled>State / Region *</option>
                          <option value="Dhaka Division">Dhaka Division</option>
                          <option value="Chittagong Division">Chittagong Division</option>
                          <option value="Sylhet Division">Sylhet Division</option>
                          <option value="Rajshahi Division">Rajshahi Division</option>
                          <option value="Khulna Division">Khulna Division</option>
                          <option value="Barishal Division">Barishal Division</option>
                          <option value="Rangpur Division">Rangpur Division</option>
                          <option value="Mymensingh Division">Mymensingh Division</option>
                        </select>
                        <svg style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M6 9L12 15L18 9" stroke="#808080" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {errors.region && (
                        <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "13px", color: "#d4183d" }}>
                          {errors.region}
                        </p>
                      )}
                    </div>

                    {/* City dropdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ position: "relative", borderBottom: `1px solid ${errors.city ? "#d4183d" : "rgba(0, 0, 0, 0.2)"}` }}>
                        <select
                          value={city}
                          onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors(prev => ({ ...prev, city: "" })); }}
                          style={{
                            display: "block", width: "100%", padding: "12px 28px 12px 0",
                            fontSize: "17px", lineHeight: "24px",
                            color: city ? "var(--ink)" : "#808080",
                            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                            letterSpacing: "0.17px",
                            appearance: "none", background: "transparent", border: "none", outline: "none",
                          }}
                        >
                          <option value="" disabled>City *</option>
                          <option value="Dhaka">Dhaka</option>
                          <option value="Chittagong">Chittagong</option>
                          <option value="Sylhet">Sylhet</option>
                          <option value="Rajshahi">Rajshahi</option>
                          <option value="Khulna">Khulna</option>
                        </select>
                        <svg style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M6 9L12 15L18 9" stroke="#808080" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {errors.city && (
                        <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "13px", color: "#d4183d" }}>
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>

                  <InputField
                    label="ZIP / Post code"
                    value={postal}
                    onChange={setPostal}
                    autoComplete="postal-code"
                  />
                  <InputField
                    label="Delivery instructions"
                    value={delivery}
                    onChange={setDelivery}
                  />
                </div>
              </div>

              {/* Payment method */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <p style={sectionLabel}>Payment method</p>
                <div className="button-group" style={{ display: "flex", gap: "10px" }}>

                  {/* Online Payment */}
                  <button
                    type="button"
                    onClick={() => setPayment("online")}
                    className={`btn ${payment === "online" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CardIcon />
                      <span style={{ ...base }}>Online Payment</span>
                    </span>
                    {payment === "online" && <CheckCircle />}
                  </button>

                  {/* Cash on delivery */}
                  <button
                    type="button"
                    onClick={() => setPayment("cash")}
                    className={`btn ${payment === "cash" ? "btn-primary" : "btn-secondary"}`}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <p style={{
                fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                fontSize: "24px", fontWeight: 500,
                color: "var(--ink)", letterSpacing: "-0.5px", lineHeight: "36px",
              }}>Order Summary</p>

              {/* Cart items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {cartItems.length === 0 ? (
                  <p style={{ ...base, color: "#808080" }}>Your cart is empty</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={`${item.product.id}-${item.product.color}-${item.product.size}`} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <div style={{ width: "90px", height: "110px", background: "#f0f0f0", overflow: "hidden", flexShrink: 0 }}>
                        <img alt={item.product.name} src={item.product.imageUrl || (typeof productImg === 'string' ? productImg : productImg?.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <p style={{ ...base, fontWeight: 500 }}>{item.product.name}</p>
                        {item.product.color && <p style={{ ...base, color: "var(--ink-muted)" }}>Color: {item.product.color}</p>}
                        {item.product.size && <p style={{ ...base, color: "var(--ink-muted)" }}>Size: {item.product.size}</p>}
                        <p style={{ ...base, color: "var(--ink-muted)" }}>Qty: {item.quantity}</p>
                      </div>
                      <p style={{ ...base, fontWeight: 500, flexShrink: 0 }}>{item.product.price}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Thin separator */}
              <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)", margin: "4px 0" }} />

              {/* Price rows + Total + CTA */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "Subtotal",       value: `৳ ${subtotalVal.toFixed(0)} BDT` },
                    { label: "VAT",            value: `৳ ${vatVal.toFixed(0)} BDT` },
                    { label: "Delivery Charge", value: `৳ ${deliveryVal.toFixed(0)} BDT` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ ...base, letterSpacing: "-0.34px" }}>{label}</p>
                      <p style={{ ...base, letterSpacing: "-0.34px" }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ ...base, fontWeight: 500, letterSpacing: "-0.34px" }}>Total</p>
                  <p style={{ ...base, fontWeight: 500, letterSpacing: "-0.34px" }}>৳ {totalVal.toFixed(0)} BDT</p>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
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
      </div>

      <SiteFooter />
    </div>
  );
}
