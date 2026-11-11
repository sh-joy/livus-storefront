'use client';

import { useState, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { SmartImage } from "@/components/storefront/SmartImage";
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
  fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
  fontSize: "17px", lineHeight: "24px", letterSpacing: "0.17px",
  color: "var(--ink)", fontWeight: 400,
};

const sectionLabel: CSSProperties = {
  fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
  fontSize: "14px", lineHeight: "20px", fontWeight: 500,
  color: "var(--ink)", letterSpacing: "0.12em",
  textTransform: "uppercase",
};

import { useSession } from "@/lib/auth-client";
import { getCustomerProfileAction } from "@/app/actions/orders";
import {
  placeOrderAction,
  getCheckoutQuoteAction,
  saveAbandonedCheckoutAction,
  fetchStoreSettingsAction,
} from "@/app/actions/checkout";

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
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [address, setAddress]   = useState("");
  const [apt, setApt]           = useState("");
  const [city, setCity]         = useState("");
  const [region, setRegion]     = useState("");
  const [postal, setPostal]     = useState("");
  const [delivery, setDelivery] = useState("");
  const [payment, setPayment]   = useState<"cash" | "bkash" | "nagad" | "online">("cash"); // Default to Cash on Delivery
  const [trxId, setTrxId]       = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; isPercentage?: boolean; description: string } | null>(null);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  // The cart is restored from this browser after the first render; wait for it before deciding "empty".
  const [cartReady, setCartReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartReady(true);
  }, []);
  const [storeSettingsData, setStoreSettingsData] = useState<{
    bKashMerchantNumber?: string;
    nagadMerchantNumber?: string;
    freeShippingThresholdBdt?: number;
  } | null>(null);

  const bkashNumber = storeSettingsData?.bKashMerchantNumber || (storeSettingsData as any)?.bkashMerchantNumber || '';
  const nagadNumber = storeSettingsData?.nagadMerchantNumber || '';

  const isBkashConfigured = Boolean(
    bkashNumber && /^01[3-9]\d{8}$/.test(bkashNumber.trim())
  );
  const isNagadConfigured = Boolean(
    nagadNumber && /^01[3-9]\d{8}$/.test(nagadNumber.trim())
  );

  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Load store settings for merchant numbers and free shipping rules
  useEffect(() => {
    fetchStoreSettingsAction().then((s) => {
      if (s) setStoreSettingsData(s);
    });
  }, []);

  // Autofill address and contact info when customer is logged in
  useEffect(() => {
    if (user) {
      if (user.name) setFullName((prev) => prev || user.name);
      if (user.email) setEmail((prev) => prev || user.email);
      getCustomerProfileAction().then((profile) => {
        if (profile) {
          if (profile.fullName) setFullName(profile.fullName);
          if (profile.phone) setPhone(profile.phone);
          if (profile.email) setEmail(profile.email);
          if (profile.address) setAddress(profile.address);
          if (profile.apt) setApt(profile.apt);
          if (profile.city) setCity(profile.city);
          if (profile.district) setRegion(profile.district);
          if (profile.postalCode) setPostal(profile.postalCode);
        }
      });
    }
  }, [user]);

  // Items in the shape the server expects
  const quoteItems = cartItems.map((item) => ({
    productId: item.product.productId || item.product.slug || item.product.id,
    variantName: item.product.color || undefined,
    size: item.product.size || undefined,
    quantity: item.quantity,
  }));
  const quoteKey = JSON.stringify(quoteItems) + "|" + (appliedDiscount?.code || "") + "|" + (region || "");

  // Server-calculated summary with tiered shipping and free shipping check
  const [quote, setQuote] = useState<{
    subtotalBdt: number; discountBdt: number; vatBdt: number; vatPercent: number;
    deliveryChargeBdt: number; totalBdt: number; freeShippingEligible?: boolean;
    freeShippingThresholdBdt?: number; amountNeededForFreeShippingBdt?: number; standardDeliveryChargeBdt?: number;
  } | null>(null);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    if (cartItems.length === 0) {
      setQuote(null);
      setQuoteError("");
      return;
    }
    let cancelled = false;
    getCheckoutQuoteAction(quoteItems, appliedDiscount?.code, region).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setQuote(res);
        setQuoteError("");
        if (appliedDiscount && res.promoError) {
          setAppliedDiscount(null);
          setPromoError(res.promoError);
        }
      } else {
        setQuote(null);
        setQuoteError(res.message);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);

  // Auto-save abandoned checkout drafts for CRM follow-up
  useEffect(() => {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanEmail = email.trim();
    if (!cleanPhone && !cleanEmail) return;
    if (cartItems.length === 0) return;

    const timer = setTimeout(() => {
      saveAbandonedCheckoutAction({
        customerName: fullName.trim() || undefined,
        phone: cleanPhone || undefined,
        email: cleanEmail || undefined,
        items: quoteItems,
        subtotalBdt: quote?.subtotalBdt,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fullName, phone, email, quoteKey]);

  // Shown instantly from the cart while the server quote loads
  const localSubtotal = cartItems.reduce((acc, item) => {
    const rawPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, '')) || 0;
    return acc + rawPrice * item.quantity;
  }, 0);
  const subtotalVal = quote?.subtotalBdt ?? localSubtotal;
  const vatRatePct = quote?.vatPercent ?? 10;
  const discountVal = quote?.discountBdt ?? 0;
  const localTaxable = Math.max(0, localSubtotal - discountVal);
  const vatVal = quote?.vatBdt ?? (cartItems.length > 0 ? Math.round((localTaxable * vatRatePct) / 100) : 0);
  const deliveryVal = quote?.deliveryChargeBdt ?? 0;
  const totalVal = quote?.totalBdt ?? Math.max(0, localTaxable + vatVal + deliveryVal);

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
        body: JSON.stringify({ code, subtotal: subtotalVal }),
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

    if (!address.trim()) {
      newErrors.address = "Street address is required";
    }

    if (!region) {
      newErrors.region = "State / Region (District) is required";
    }

    if (payment === "bkash" || payment === "nagad") {
      const cleanTrx = trxId.trim().toUpperCase();
      if (!cleanTrx) {
        newErrors.trxId = `Please enter your ${payment === "bkash" ? "bKash" : "Nagad"} Transaction ID (TrxID)`;
      } else if (!/^[A-Za-z0-9]{8,16}$/.test(cleanTrx)) {
        newErrors.trxId = "Transaction ID must be 8-16 alphanumeric characters.";
      }
      if (senderPhone.trim()) {
        const cleanSender = senderPhone.trim().replace(/\D/g, '');
        if (!/^01[3-9]\d{8}$/.test(cleanSender)) {
          newErrors.senderPhone = "Please enter a valid 11-digit Bangladeshi mobile number.";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (cartItems.length === 0) {
      setErrors({ form: "Your cart is empty. Please add products before placing an order." });
      return;
    }

    if (quoteError) {
      setErrors({ form: quoteError });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Prices are NOT sent: the server looks them up from the database.
      const orderItemsInput = cartItems.map((item) => ({
        productId: item.product.productId || item.product.slug || item.product.id,
        productName: item.product.name || 'Apparel Item',
        variantName: item.product.color || undefined,
        size: item.product.size || undefined,
        thumbnailUrl: item.product.imageUrl || undefined,
        quantity: item.quantity,
      }));

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
        trxId: (payment === 'bkash' || payment === 'nagad') ? trxId.trim() : undefined,
        senderPhone: (payment === 'bkash' || payment === 'nagad') ? senderPhone.trim() : undefined,
        cartItems: orderItemsInput,
        promoCode: appliedDiscount?.code,
      };

      const res = await placeOrderAction(orderPayload);

      if (res.success) {
        setOrderPlaced(true);
        useCartStore.getState().clearCart();
        const ordNum = res.orderNumber || res.orderId || 'LIV-1042';
        const locStr = [city.trim(), region.trim()].filter(Boolean).join(', ') || 'Dhaka, Bangladesh';
        router.push(`/order-confirmed?orderNumber=${encodeURIComponent(ordNum)}&total=${res.totalAmount || totalVal}&location=${encodeURIComponent(locStr)}&paymentMethod=${encodeURIComponent(res.paymentMethod || 'Cash on Delivery')}`);
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

  if (cartReady && cartItems.length === 0 && !isSubmitting && !orderPlaced) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-white">
        <SiteNav />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-[var(--lv-gutter)] py-16">
          <h1 className="t-h2 m-0">Your cart is empty</h1>
          <p className="t-lead mt-5 mb-9 max-w-[440px]">
            Add a few pieces you love, then come back here to check out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/all-products" className="lv-btn lv-btn--solid">Shop all products</Link>
            <Link href="/" className="lv-btn lv-btn--outline">Back to home</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
      <SiteNav />

      <div style={{ flex: 1 }}>
        <div className="max-[1112px]:!px-[16px] max-md:!pt-[24px] max-md:!pb-[32px]" style={{
          maxWidth: "1080px",
          margin: "0px auto",
          padding: "48px 0px",
        }}>

          {/* Top Row: Checkout Heading & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
            <h1 className="t-h2 m-0">Checkout</h1>
            {user ? (
              <p className="t-body m-0 mt-2 text-[var(--lv-ink-muted)]">
                Signed in as <span className="text-[#0d0d0d]">{user.email}</span>
              </p>
            ) : (
              <p className="t-body m-0 mt-2 text-[var(--lv-ink-muted)]">
                Already have an account?{" "}
                <a href="/signin?redirect=/checkout" className="text-[#0d0d0d] underline underline-offset-4">
                  Sign in
                </a>
              </p>
            )}
          </div>

          {/* Main 2-Column Grid (Personal Information & Order Summary on exact same horizontal level) */}
          <div className="max-md:!grid-cols-1 max-md:!gap-[40px]" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "start",
          }}>

            {/* ── LEFT: Form ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

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
                  <div className="max-[420px]:!grid-cols-1 max-[420px]:!gap-[16px]" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                            fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
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
                            fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
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
                        <p style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "12px", color: "#d4183d" }}>
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
                            fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
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
                            fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
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
                        <p style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "12px", color: "#d4183d" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={sectionLabel}>Payment method</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full" style={{ opacity: cartItems.length === 0 ? 0.5 : 1, pointerEvents: cartItems.length === 0 ? "none" : "auto" }}>

                  {/* Cash on delivery */}
                  <button
                    type="button"
                    disabled={cartItems.length === 0}
                    onClick={() => setPayment("cash")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 14px",
                      border: payment === "cash" ? "1.5px solid #000000" : "1px solid #e2e8f0",
                      background: payment === "cash" ? "#fafafa" : "#ffffff",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <TruckIcon />
                      <span style={{ ...base, fontSize: "16px", fontWeight: payment === "cash" ? 500 : 400 }}>Cash on delivery</span>
                    </span>
                    {payment === "cash" && <CheckCircle />}
                  </button>

                  {/* bKash: selectable once a valid merchant number is saved in Admin → Settings */}
                  <button
                    type="button"
                    disabled={cartItems.length === 0 || !isBkashConfigured}
                    onClick={() => setPayment("bkash")}
                    aria-disabled={!isBkashConfigured}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 14px",
                      border: payment === "bkash" ? "1.5px solid #d12053" : "1px solid #e2e8f0",
                      background: payment === "bkash" ? "#fff5f7" : "#ffffff",
                      cursor: isBkashConfigured ? "pointer" : "not-allowed",
                      opacity: isBkashConfigured ? 1 : 0.55,
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/payment-icons/bkash.svg" alt="" width={40} height={40} style={{ display: "block", margin: "-8px -4px -8px -8px" }} />
                      <span style={{ ...base, fontSize: "16px", fontWeight: payment === "bkash" ? 500 : 400 }}>bKash</span>
                    </span>
                    {!isBkashConfigured ? (
                      <span style={{ ...base, fontSize: "13px", color: "var(--ink-muted)" }}>Coming soon</span>
                    ) : (
                      payment === "bkash" && <CheckCircle />
                    )}
                  </button>

                  {/* Nagad: selectable once a valid merchant number is saved in Admin → Settings */}
                  <button
                    type="button"
                    disabled={cartItems.length === 0 || !isNagadConfigured}
                    onClick={() => setPayment("nagad")}
                    aria-disabled={!isNagadConfigured}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 14px",
                      border: payment === "nagad" ? "1.5px solid #e65c00" : "1px solid #e2e8f0",
                      background: payment === "nagad" ? "#fff9f5" : "#ffffff",
                      cursor: isNagadConfigured ? "pointer" : "not-allowed",
                      opacity: isNagadConfigured ? 1 : 0.55,
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/payment-icons/nagad.svg" alt="" width={40} height={40} style={{ display: "block", margin: "-8px -4px -8px -8px" }} />
                      <span style={{ ...base, fontSize: "16px", fontWeight: payment === "nagad" ? 500 : 400 }}>Nagad</span>
                    </span>
                    {!isNagadConfigured ? (
                      <span style={{ ...base, fontSize: "13px", color: "var(--ink-muted)" }}>Coming soon</span>
                    ) : (
                      payment === "nagad" && <CheckCircle />
                    )}
                  </button>

                </div>

                {/* Manual mobile payment (no gateway yet): customer uses "Send Money" to our number, then enters the TrxID */}
                {(payment === "bkash" || payment === "nagad") && (() => {
                  const isBkash = payment === "bkash";
                  const wallet = isBkash ? "bKash" : "Nagad";
                  const number = isBkash ? bkashNumber : nagadNumber;
                  const ussd = isBkash ? "*247#" : "*167#";
                  return (
                    <div className="border border-[var(--lv-line)] p-4 sm:p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="t-small text-[var(--lv-ink-muted)]">Send Money to our {wallet} number</span>
                          <span className="text-[20px] tracking-[0.04em] text-[#0d0d0d] tabular-nums">{number}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(number).catch(() => {})}
                          className="lv-btn lv-btn--outline !min-h-9 !px-3 !text-[13px]"
                        >
                          Copy
                        </button>
                      </div>
                      <ol className="t-small m-0 pl-5 list-decimal flex flex-col gap-1 text-[#3a3a3a]">
                        <li>Open the {wallet} app (or dial {ussd}) and choose <strong>Send Money</strong>.</li>
                        <li>Send exactly <strong>৳{totalVal.toFixed(0)}</strong> to <strong>{number}</strong>.</li>
                        <li>Enter the Transaction ID (TrxID) from your confirmation SMS below, then confirm your order.</li>
                      </ol>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <InputField
                            label={`${wallet} Transaction ID (TrxID) *`}
                            value={trxId}
                            onChange={(v) => { setTrxId(v); if (errors.trxId) setErrors(prev => ({ ...prev, trxId: "" })); }}
                            error={errors.trxId}
                            placeholder="e.g. 9J47AB12"
                          />
                        </div>
                        <div className="flex-1">
                          <InputField
                            label={`Number you sent from (optional)`}
                            type="tel"
                            value={senderPhone}
                            onChange={setSenderPhone}
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                      </div>
                      <p className="t-small m-0 text-[var(--lv-ink-muted)]">We check the payment and confirm your order by phone before dispatch.</p>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <h2 className="t-h3 m-0">Order summary</h2>

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
                      fontFamily: "'Overused Grotesk', sans-serif",
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
                        fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
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
                          <div className="bg-[#f0f0f0] flex h-[140px] w-[105px] max-md:h-[117px] max-md:w-[88px] aspect-[3/4] items-center justify-center overflow-hidden shrink-0">
                            <SmartImage
                              alt={item.product.name}
                              width={210}
                              height={280}
                              sizes="105px"
                              className="w-full h-full object-cover aspect-[3/4]"
                              src={item.product.imageUrl || (typeof productImg === 'string' ? productImg : productImg?.src) || "/images/for_him.jpg"}
                              fallbackSrc="/images/for_him.jpg"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-[3px] self-stretch min-w-0">
                            <div className="flex items-start justify-between gap-[8px] w-full leading-[24px] text-[#1c1c1c]">
                              <div className="font-sans flex flex-col items-start min-w-0">
                                <p className="text-[16px] font-medium leading-snug">{item.product.name}</p>
                                {item.product.color && <p className="text-[14px] text-[#5c5c5c]">Color: {item.product.color}</p>}
                                {item.product.size && <p className="text-[14px] text-[#5c5c5c]">Size: {item.product.size}</p>}
                              </div>
                              <p className="font-sans text-[17px] font-medium shrink-0 whitespace-nowrap">{item.product.price}</p>
                            </div>
                            <div className="flex items-center justify-between w-full shrink-0 pt-[8px]">
                              <div className="flex items-center border border-[#e2e2e2] h-10">
                                <button
                                  type="button"
                                  disabled={item.quantity <= 1}
                                  onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                  className="size-10 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="size-4 stroke-[1.5]" aria-hidden />
                                </button>
                                <span className="w-9 text-center text-[16px] tabular-nums text-[#1c1c1c]">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                  className="size-10 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-[#f5f5f5]"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="size-4 stroke-[1.5]" aria-hidden />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(itemKey)}
                                className="text-[15px] underline underline-offset-4 text-[#5c5c5c] hover:text-black bg-transparent border-none p-0 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Free-delivery progress (same as the cart). Hidden when the offer is off in Admin → Settings. */}
              {cartItems.length > 0 && (quote?.freeShippingThresholdBdt ?? 0) > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="t-small m-0 text-[#1a1a1a]">
                    {quote?.freeShippingEligible ? (
                      <span className="text-[#1f7a3a]">You&apos;ve unlocked free delivery</span>
                    ) : (
                      <>
                        Add <strong className="font-semibold">৳{(quote?.amountNeededForFreeShippingBdt ?? 0).toLocaleString()}</strong> more for free delivery
                      </>
                    )}
                  </p>
                  <div className="w-full h-1 bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-[#0d0d0d] transition-all duration-300"
                      style={{
                        width: `${
                          quote?.freeShippingEligible
                            ? 100
                            : Math.max(0, Math.min(100, Math.round((1 - (quote?.amountNeededForFreeShippingBdt ?? 0) / (quote?.freeShippingThresholdBdt || 1)) * 100)))
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Gift Card / Promo Code Input Section */}
              <div style={{ width: "100%", paddingTop: "16px", paddingBottom: "16px", borderTop: "1px dashed #d0d0d0", borderBottom: "1px dashed #d0d0d0", margin: "4px 0", opacity: cartItems.length === 0 ? 0.4 : 1, pointerEvents: cartItems.length === 0 ? "none" : "auto" }}>
                <div style={{ display: "flex", width: "100%", height: "44px", background: "#f4f4f4" }}>
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
                      fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
                      fontSize: "16px",
                      color: "#1c1c1c",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    style={{
                      width: "100px",
                      background: promoCode.trim() ? "#0d0d0d" : "#e0e0e0",
                      color: promoCode.trim() ? "#ffffff" : "#8a8a8a",
                      border: "none",
                      cursor: promoCode.trim() ? "pointer" : "not-allowed",
                      fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
                      fontSize: "15px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      transition: "all 0.2s ease",
                    }}
                  >
                    APPLY
                  </button>
                </div>
                {promoError && (
                  <p style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "13px", color: "#d4183d", marginTop: "6px" }}>
                    {promoError}
                  </p>
                )}
                {appliedDiscount && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                    <p style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "14px", color: "#10b981", fontWeight: 500 }}>
                      Code '{appliedDiscount.code}' applied ({appliedDiscount.description})
                    </p>
                    <span
                      onClick={handleRemovePromo}
                      style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "14px", color: "#808080", textDecoration: "underline", cursor: "pointer", marginLeft: "auto" }}
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
                    <p style={{ ...base, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>Subtotal</p>
                    <p style={{ ...base, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {subtotalVal.toFixed(0)} BDT</p>
                  </div>
                  {appliedDiscount && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ ...base, letterSpacing: "0", color: "#d4183d" }}>Discount ({appliedDiscount.code})</p>
                      <p style={{ ...base, letterSpacing: "0", color: "#d4183d", fontWeight: 500 }}>-৳ {discountVal.toFixed(0)} BDT</p>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ ...base, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>VAT</p>
                    <p style={{ ...base, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {vatVal.toFixed(0)} BDT</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ ...base, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>Delivery Charge</p>
                    <p style={{ ...base, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>
                      {deliveryVal === 0 && quote?.freeShippingEligible ? (
                        <>
                          <span style={{ textDecoration: "line-through", color: "var(--ink-muted)", marginRight: "8px" }}>
                            ৳ {(quote?.standardDeliveryChargeBdt ?? 0).toFixed(0)} BDT
                          </span>
                          Free
                        </>
                      ) : (
                        `৳ ${deliveryVal.toFixed(0)} BDT`
                      )}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ ...base, fontWeight: 500, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>Total</p>
                  <p style={{ ...base, fontWeight: 500, letterSpacing: "0", color: cartItems.length === 0 ? "#808080" : "var(--ink)" }}>৳ {totalVal.toFixed(0)} BDT</p>
                </div>

                {quoteError && !errors.form && (
                  <p style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "14px", color: "#d4183d", fontWeight: 500, textAlign: "center" }}>
                    {quoteError}
                  </p>
                )}

                {errors.form && (
                  <p style={{ fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)", fontSize: "14px", color: "#d4183d", fontWeight: 500, textAlign: "center" }}>
                    {errors.form}
                  </p>
                )}

                <button
                  type="button"
                  disabled={cartItems.length === 0 || isSubmitting}
                  onClick={handleProceedToPayment}
                  className="lv-btn lv-btn--solid lv-btn--block disabled:!bg-neutral-200 disabled:!border-neutral-200 disabled:!text-neutral-500 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Placing your order…" : "Confirm order"}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      <SiteFooter compact />
    </div>
  );
}
