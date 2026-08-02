'use client';

import { useState, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { useCartStore, getCartItemKey } from "@/lib/store/cart-store";
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

import { createOrderAction } from "@/app/actions/orders";
import { placeOrderAction } from "@/app/actions/checkout";

const REGION_CITIES_MAP: Record<string, string[]> = {
  "Dhaka Division": [
    "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur",
    "Manikganj", "Munshiganj", "Narsingdi", "Rajbari", "Shariatpur",
    "Gopalganj", "Madaripur"
  ],
  "Chittagong Division": [
    "Chittagong", "Cox's Bazar", "Cumilla", "Feni", "Noakhali",
    "Brahmanbaria", "Chandpur", "Khagrachhari", "Rangamati", "Bandarban"
  ],
  "Sylhet Division": [
    "Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"
  ],
  "Rajshahi Division": [
    "Rajshahi", "Bogra", "Pabna", "Naogaon", "Natore",
    "Nawabganj", "Joypurhat", "Sirajganj"
  ],
  "Khulna Division": [
    "Khulna", "Jeshore", "Kushtia", "Satkhira", "Bagerhat",
    "Chuadanga", "Jhenaidah", "Magura", "Meherpur", "Narail"
  ],
  "Barishal Division": [
    "Barishal", "Bhola", "Barguna", "Jhalokati", "Patuakhali", "Pirojpur"
  ],
  "Rangpur Division": [
    "Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat",
    "Nilphamari", "Panchagarh", "Thakurgaon"
  ],
  "Mymensingh Division": [
    "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
  ]
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
  const [payment, setPayment]   = useState<"online" | "cash">("cash"); // Default to Cash on Delivery
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; isPercentage?: boolean; description: string } | null>(null);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItems = useCartStore((state) => state.items);
  const isOnlineSelected = cartItems.length > 0 && payment === "online";
  const isCashSelected = cartItems.length > 0 && payment === "cash";
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotalVal = cartItems.reduce((acc, item) => {
    const rawPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, '')) || 0;
    return acc + rawPrice * item.quantity;
  }, 0);

  const [vatRatePct, setVatRatePct] = useState(10);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("my_store_vat_percent");
      if (stored && !isNaN(parseFloat(stored))) {
        setVatRatePct(parseFloat(stored));
      }
    }
  }, []);

  const vatVal = cartItems.length > 0 ? Math.round((subtotalVal * vatRatePct) / 100) : 0;
  const deliveryVal = cartItems.length > 0 ? 150 : 0;

  let discountVal = 0;
  if (appliedDiscount) {
    if (appliedDiscount.isPercentage) {
      discountVal = (subtotalVal * appliedDiscount.amount) / 100;
    } else {
      discountVal = appliedDiscount.amount;
    }
  }

  const totalVal = Math.max(0, subtotalVal - discountVal + vatVal + deliveryVal);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError("Please enter a valid gift or promo code");
      return;
    }

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success && data.promo) {
        setAppliedDiscount({
          code: data.promo.code,
          amount: data.promo.value,
          isPercentage: data.promo.type === "percentage",
          description: data.promo.description,
        });
        setPromoError("");
      } else {
        setPromoError(data.message || "Invalid gift or promo code.");
      }
    } catch {
      setPromoError("Invalid gift or promo code.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoCode("");
    setPromoError("");
  };

  const handleProceedToPayment = async () => {
    const newErrors: Record<string, string> = {};

    const cleanName = fullName.trim();
    if (!cleanName) {
      newErrors.fullName = "Full name is required";
    } else if (!/^[a-zA-Z\s'. -]{3,}$/.test(cleanName)) {
      newErrors.fullName = "Please enter a valid name (letters only, e.g. Alex Johnson)";
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (!bdPhoneRegex.test(cleanPhone)) {
      newErrors.phone = "Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678)";
    }

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      newErrors.email = "Please enter a valid email address (e.g. name@example.com)";
    }

    if (!region) {
      newErrors.region = "State / Region (District) is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (cartItems.length === 0) {
      setErrors({ form: "Your cart is empty. Please add products before placing an order." });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const orderItemsInput = cartItems.map((item) => {
        const rawPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, '')) || 899;
        return {
          productId: item.product.id || 'prod-1',
          productName: item.product.name || 'Apparel Item',
          variantName: item.product.color || 'Primary',
          size: item.product.size || 'M',
          thumbnailUrl: item.product.imageUrl || '/images/products/oakwood-yellow-thumb.png',
          quantity: item.quantity,
          priceBdt: rawPrice,
        };
      });

      const orderPayload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        streetAddress: address.trim(),
        aptSuite: apt.trim() || undefined,
        stateRegion: region.trim(),
        city: city.trim(),
        zipCode: postal.trim() || undefined,
        deliveryInstructions: delivery.trim() || undefined,
        paymentMethod: payment,
        cartItems: orderItemsInput,
      };

      const res = await placeOrderAction(orderPayload);

      if (res.success) {
        useCartStore.getState().clearCart();
        const ordNum = res.orderNumber || res.orderId || 'LIV-1042';
        const locStr = [city.trim(), region.trim()].filter(Boolean).join(', ') || 'Dhaka, Bangladesh';
        router.push(`/order-confirmed?orderNumber=${encodeURIComponent(ordNum)}&total=${res.totalAmount || totalVal}&location=${encodeURIComponent(locStr)}`);
      } else {
        setErrors({ form: res.message || 'Failed to place order. Please try again.' });
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
                style={{ color: "var(--ink)", textDecoration: "underline", cursor: "pointer", fontSize: "15px" }}
                onClick={() => router.push("/signin")}
              >
                SIGN IN
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
                    onChange={(v) => { setEmail(v); if (errors.email) setErrors(prev => ({ ...prev, email: "" })); }}
                    autoComplete="email"
                    error={errors.email}
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
                    {/* State / Region (District) dropdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative", paddingTop: "16px" }}>
                      {region && (
                        <label
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            fontSize: "12px",
                            lineHeight: "16px",
                            fontWeight: 500,
                            color: errors.region ? "#d4183d" : "#0d0d0d",
                            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                            letterSpacing: "0.17px",
                          }}
                        >
                          State / Region (District) *
                        </label>
                      )}
                      <div style={{ position: "relative", borderBottom: `1px solid ${errors.region ? "#d4183d" : "rgba(0, 0, 0, 0.2)"}` }}>
                        <select
                          value={region}
                          onChange={(e) => {
                            const newRegion = e.target.value;
                            setRegion(newRegion);
                            const validCities = REGION_CITIES_MAP[newRegion] || [];
                            if (city && !validCities.includes(city)) {
                              setCity("");
                            }
                            if (errors.region) setErrors(prev => ({ ...prev, region: "" }));
                          }}
                          style={{
                            display: "block", width: "100%", padding: "8px 28px 6px 0",
                            fontSize: "16px", lineHeight: "22px",
                            color: region ? "var(--ink)" : "#808080",
                            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                            letterSpacing: "0.17px",
                            appearance: "none", background: "transparent", border: "none", outline: "none",
                          }}
                        >
                          <option value="" disabled>State / Region (District) *</option>
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
                        <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "12px", color: "#d4183d" }}>
                          {errors.region}
                        </p>
                      )}
                    </div>

                    {/* City dropdown (Dynamically filtered by selected region) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative", paddingTop: "16px" }}>
                      {city && (
                        <label
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            fontSize: "12px",
                            lineHeight: "16px",
                            fontWeight: 500,
                            color: errors.city ? "#d4183d" : "#0d0d0d",
                            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                            letterSpacing: "0.17px",
                          }}
                        >
                          City *
                        </label>
                      )}
                      <div style={{ position: "relative", borderBottom: `1px solid ${errors.city ? "#d4183d" : "rgba(0, 0, 0, 0.2)"}` }}>
                        <select
                          value={city}
                          onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors(prev => ({ ...prev, city: "" })); }}
                          disabled={!region}
                          style={{
                            display: "block", width: "100%", padding: "8px 28px 6px 0",
                            fontSize: "16px", lineHeight: "22px",
                            color: city ? "var(--ink)" : "#808080",
                            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                            letterSpacing: "0.17px",
                            appearance: "none", background: "transparent", border: "none", outline: "none",
                            cursor: region ? "pointer" : "not-allowed",
                          }}
                        >
                          <option value="" disabled>{region ? "Select City *" : "Select State / Region first *"}</option>
                          {(REGION_CITIES_MAP[region] || []).map((cityName) => (
                            <option key={cityName} value={cityName}>{cityName}</option>
                          ))}
                        </select>
                        <svg style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M6 9L12 15L18 9" stroke="#808080" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {errors.city && (
                        <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "12px", color: "#d4183d" }}>
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
                <div style={{ display: "flex", gap: "16px", width: "100%", opacity: cartItems.length === 0 ? 0.5 : 1, pointerEvents: cartItems.length === 0 ? "none" : "auto" }}>

                  {/* Online Payment */}
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={() => setPayment("online")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      border: isOnlineSelected ? "1px solid #000000" : "1px solid #e2e8f0",
                      background: "#ffffff",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <CardIcon />
                      <span style={{ ...base, fontSize: "16px", fontWeight: isOnlineSelected ? 500 : 400 }}>Online Payment</span>
                    </span>
                    {isOnlineSelected && <CheckCircle />}
                  </button>

                  {/* Cash on delivery */}
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={() => setPayment("cash")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      border: isCashSelected ? "1px solid #000000" : "1px solid #e2e8f0",
                      background: "#ffffff",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <TruckIcon />
                      <span style={{ ...base, fontSize: "16px", fontWeight: isCashSelected ? 500 : 400, color: isCashSelected ? "var(--ink)" : "var(--ink-muted)" }}>Cash on delivery</span>
                    </span>
                    {isCashSelected && <CheckCircle />}
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
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "4px",
                    padding: "48px 24px",
                    border: "1px dashed #d0d0d0",
                    width: "100%",
                    background: "#fafafa",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                      fontSize: "24px",
                      fontWeight: 500,
                      lineHeight: "32px",
                      color: "#1c1c1c",
                      margin: 0,
                    }}>
                      Your cart is empty
                    </p>
                    <Link
                      href="/"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: "#050505",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        padding: "7px 16px",
                        fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                        fontSize: "15px",
                        fontWeight: 500,
                        letterSpacing: "0.75px",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        marginTop: "4px",
                      }}
                    >
                      CONTINUE SHOPPING
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item, index) => {
                    const itemKey = getCartItemKey(item.product);
                    return (
                      <div key={itemKey} className="w-full flex flex-col gap-[20px]">
                        {index > 0 && <div className="w-full h-px bg-[#E2E2E2] shrink-0" />}
                        <div className="flex gap-[16px] items-start w-full shrink-0">
                          <div className="bg-[#f0f0f0] flex h-[140px] w-[105px] aspect-[3/4] items-center justify-center overflow-hidden shrink-0">
                            <img
                              alt={item.product.name}
                              className="w-full h-full object-cover aspect-[3/4]"
                              src={item.product.imageUrl || (typeof productImg === 'string' ? productImg : productImg?.src) || "/images/for_him.jpg"}
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-[3px] self-stretch min-w-0">
                            <div className="flex items-start justify-between w-full leading-[24px] text-[#1c1c1c]">
                              <div className="font-sans flex flex-col items-start shrink-0">
                                <p className="text-[17px] font-medium tracking-[-0.34px]">{item.product.name}</p>
                                {item.product.color && <p className="text-[17px] tracking-[-0.085px]">Color: {item.product.color}</p>}
                                {item.product.size && <p className="text-[17px] tracking-[-0.085px]">Size: {item.product.size}</p>}
                              </div>
                              <p className="font-sans text-[17px] font-medium shrink-0">{item.product.price}</p>
                            </div>
                            <div className="flex items-center justify-between w-full shrink-0 pt-[8px]">
                              <div className="flex gap-[16px] items-center">
                                <button
                                  type="button"
                                  disabled={item.quantity <= 1}
                                  onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                  className={`size-[20px] flex items-center justify-center transition-opacity ${
                                    item.quantity <= 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-75"
                                  }`}
                                  aria-label="Decrease quantity"
                                >
                                  <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                                    <path d="M2.92893 10H17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                <p className="font-sans leading-[20px] text-[17px] tracking-[-0.34px] text-[#1c1c1c]">
                                  {item.quantity}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                  className="size-[20px] flex items-center justify-center cursor-pointer hover:opacity-75"
                                >
                                  <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                                    <path d="M10 2.92893V17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                                    <path d="M2.92893 10H17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              </div>
                              <p
                                onClick={() => removeItem(itemKey)}
                                className="font-sans leading-[24px] text-[17px] tracking-[-0.085px] underline text-[#1c1c1c] cursor-pointer"
                              >
                                Remove
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Gift Card / Promo Code Input Section */}
              <div style={{ width: "100%", paddingTop: "16px", paddingBottom: "16px", borderTop: "1px dashed #d0d0d0", borderBottom: "1px dashed #d0d0d0", margin: "4px 0", opacity: cartItems.length === 0 ? 0.4 : 1, pointerEvents: cartItems.length === 0 ? "none" : "auto" }}>
                <div style={{ display: "flex", width: "100%", height: "48px", background: "#f4f4f4" }}>
                  <input
                    type="text"
                    placeholder="Gift or Promo Code"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (promoError) setPromoError("");
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo(); }}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      padding: "0 16px",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      fontSize: "16px",
                      color: "#1c1c1c",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    style={{
                      width: "100px",
                      background: "#e0e0e0",
                      color: "#555555",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      fontSize: "17px",
                      fontWeight: 500,
                      letterSpacing: "0.85px",
                      textTransform: "uppercase",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#050505"; e.currentTarget.style.color = "#ffffff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#e0e0e0"; e.currentTarget.style.color = "#555555"; }}
                  >
                    APPLY
                  </button>
                </div>
                {promoError && (
                  <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "13px", color: "#d4183d", marginTop: "6px" }}>
                    {promoError}
                  </p>
                )}
                {appliedDiscount && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                    <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "14px", color: "#10b981", fontWeight: 500 }}>
                      Code '{appliedDiscount.code}' applied ({appliedDiscount.description})
                    </p>
                    <span
                      onClick={handleRemovePromo}
                      style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "14px", color: "#808080", textDecoration: "underline", cursor: "pointer", marginLeft: "auto" }}
                    >
                      Remove
                    </span>
                  </div>
                )}
              </div>

              {/* Price rows + Total + CTA */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", opacity: cartItems.length === 0 ? 0.4 : 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ ...base, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>Subtotal</p>
                    <p style={{ ...base, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {subtotalVal.toFixed(0)} BDT</p>
                  </div>
                  {appliedDiscount && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ ...base, letterSpacing: "-0.34px", color: "#d4183d" }}>Discount ({appliedDiscount.code})</p>
                      <p style={{ ...base, letterSpacing: "-0.34px", color: "#d4183d", fontWeight: 500 }}>-৳ {discountVal.toFixed(0)} BDT</p>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ ...base, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>VAT</p>
                    <p style={{ ...base, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {vatVal.toFixed(0)} BDT</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ ...base, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>Delivery Charge</p>
                    <p style={{ ...base, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {deliveryVal.toFixed(0)} BDT</p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ ...base, fontWeight: 500, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>Total</p>
                  <p style={{ ...base, fontWeight: 500, letterSpacing: "-0.34px", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {totalVal.toFixed(0)} BDT</p>
                </div>

                {errors.form && (
                  <p style={{ fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)", fontSize: "14px", color: "#d4183d", fontWeight: 500, textAlign: "center" }}>
                    {errors.form}
                  </p>
                )}

                <button
                  type="button"
                  disabled={cartItems.length === 0 || isSubmitting}
                  onClick={handleProceedToPayment}
                  style={{
                    background: cartItems.length === 0 || isSubmitting ? "#e0e0e0" : "#050505",
                    color: cartItems.length === 0 || isSubmitting ? "#999999" : "#ffffff",
                    border: "none",
                    cursor: cartItems.length === 0 || isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 20px",
                    width: "100%",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "17px",
                    lineHeight: "24px",
                    fontWeight: 400,
                    transition: "all 0.2s ease",
                  }}
                >
                  {isSubmitting
                    ? "PLACING YOUR ORDER..."
                    : payment === "cash"
                    ? "CONFIRM ORDER"
                    : "PROCEED TO PAYMENT"}
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
