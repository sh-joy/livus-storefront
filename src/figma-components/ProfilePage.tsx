'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { InputField } from "./InputField";
import {
  searchCustomerOrdersAction,
  getCustomerProfileAction,
  saveCustomerProfileAction,
  cancelCustomerOrderAction,
} from "@/app/actions/orders";
import productImg from "@/imports/ProductDetails/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

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

type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

interface OrderItem {
  name: string;
  meta: string;
  price: string;
  imageUrl?: string;
}

interface Order {
  id: string;
  rawId?: string;
  date: string;
  total: string;
  status: OrderStatus;
  subtotal: string;
  vat: string;
  delivery: string;
  items: OrderItem[];
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const sampleOrders: Order[] = [
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

const statusStyle: Record<string, CSSProperties> = {
  Pending: {
    background: "#fff3cd", color: "#856404",
    padding: "4px 12px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap",
  },
  Processing: {
    background: "#cce5ff", color: "#004085",
    padding: "4px 12px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap",
  },
  Shipped: {
    background: "#e2d9f3", color: "#4a1282",
    padding: "4px 12px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap",
  },
  Delivered: {
    background: "#d8f3dc", color: "#2d6a4f",
    padding: "4px 12px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap",
  },
  Cancelled: {
    background: "#f8d7da", color: "#721c24",
    padding: "4px 12px",
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "13px", letterSpacing: "0.7px", textTransform: "uppercase",
    fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap",
  },
};

import { authClient, useSession, signOut } from "@/lib/auth-client";

const REGIONS_LIST = [
  "Dhaka Division",
  "Chittagong Division",
  "Sylhet Division",
  "Rajshahi Division",
  "Khulna Division",
  "Barisal Division",
  "Rangpur Division",
  "Mymensingh Division",
];

const REGION_CITIES_MAP: Record<string, string[]> = {
  "Dhaka Division": ["Dhaka", "Gazipur", "Narayanganj", "Savar", "Uttara", "Faridpur", "Tangail", "Manikganj"],
  "Chittagong Division": ["Chittagong", "Cox's Bazar", "Comilla", "Feni", "Noakhali", "Brahmanbaria", "Chandpur"],
  "Sylhet Division": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  "Rajshahi Division": ["Rajshahi", "Bogra", "Pabna", "Naogaon", "Natore", "Nawabganj"],
  "Khulna Division": ["Khulna", "Jessore", "Kushtia", "Satkhira", "Bagerhat"],
  "Barisal Division": ["Barisal", "Bhola", "Patuakhali", "Barguna"],
  "Rangpur Division": ["Rangpur", "Dinajpur", "Saidpur", "Kurigram"],
  "Mymensingh Division": ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

const ALL_CITIES = Array.from(new Set(Object.values(REGION_CITIES_MAP).flat()));

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value && String(value).trim().length > 0);
  const isFloating = focused || hasValue;

  return (
    <div className="relative w-full pt-4 font-sans" style={{ boxSizing: "border-box" }}>
      {isFloating && (
        <label
          className="absolute left-0 pointer-events-none transition-all duration-200 select-none"
          style={{
            top: "0px",
            transform: "scale(0.82)",
            transformOrigin: "top left",
            color: focused ? "#0d0d0d" : "#808080",
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            fontSize: "16px",
            lineHeight: "22px",
            fontWeight: 500,
            letterSpacing: "0.17px",
          }}
        >
          {label}
        </label>
      )}
      <div style={{
        borderBottom: `1px solid ${focused ? "#000000" : "rgba(0, 0, 0, 0.2)"}`,
        transition: "border-color 0.2s ease",
        background: "transparent",
      }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            display: "block",
            width: "100%",
            padding: "8px 0 6px 0",
            fontSize: "16px",
            lineHeight: "22px",
            color: value ? "#0d0d0d" : "#808080",
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            letterSpacing: "0.17px",
            fontWeight: 400,
            background: "transparent",
            border: "none",
            outline: "none",
            cursor: "pointer",
            WebkitAppearance: "none",
          }}
        >
          <option value="" disabled style={{ color: "#808080", background: "#ffffff" }}>
            {placeholder || `Select ${label}`}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ color: "#0d0d0d", background: "#ffffff" }}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const router = useRouter();

  const { data: sessionData } = useSession();
  const isLoggedIn = !!sessionData?.user;
  const user = sessionData?.user;

  const [name, setName]       = useState(user?.name || "");
  const [email, setEmail]     = useState(user?.email || "");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");
  const [apt, setApt]         = useState("");
  const [city, setCity]       = useState("");
  const [region, setRegion]   = useState("");
  const [zip, setZip]         = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // 1. Sync session user details as soon as session finishes loading
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if ((user as any)?.phoneNumber) setPhone((user as any).phoneNumber);
  }, [user?.name, user?.email]);

  // 2. Load customer saved address & order history from database when logged in
  useEffect(() => {
    async function loadCustomerData() {
      if (user?.email) {
        const custData = await getCustomerProfileAction(user.email);
        if (custData) {
          if (custData.fullName) setName(custData.fullName);
          if (custData.email) setEmail(custData.email);
          if (custData.phone) setPhone(custData.phone);
          if (custData.address) setAddress(custData.address);
          if (custData.apt) setApt(custData.apt);
          if (custData.city) setCity(custData.city);
          if (custData.district) setRegion(custData.district);
          if (custData.postalCode) setZip(custData.postalCode);
        }
      }
    }
    if (isLoggedIn && user?.email) {
      loadCustomerData();
    }
  }, [isLoggedIn, user?.email]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError("");

    // Phone number validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (phone && (digitsOnly.length < 11 || digitsOnly.length > 14)) {
      setProfileError("Please enter a valid phone number (e.g. 01711223344).");
      setSavingProfile(false);
      return;
    }

    try {
      const res = await saveCustomerProfileAction({
        fullName: name,
        email: email || user?.email || "",
        phone: phone,
        address: address,
        apt: apt,
        city: city,
        district: region,
        postalCode: zip,
      });

      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || "Failed to save profile.");
      }
    } catch (err: any) {
      setProfileError(err?.message || "An unexpected error occurred.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  // Live order history & search state
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrders = async (query?: string) => {
    setLoadingOrders(true);
    try {
      const userIdentifier = user?.email || email || phone || "";
      const dbOrders = await searchCustomerOrdersAction(userIdentifier, query);
      setOrdersList((dbOrders || []) as any);
    } catch (err) {
      console.error("Failed to load customer orders from database:", err);
      setOrdersList([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders("");
    }
  }, [isLoggedIn, user?.email]);

  const handleSearchSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setHasSearched(true);
    fetchOrders(orderSearchQuery);
  };

  const handleClearSearch = () => {
    setOrderSearchQuery("");
    setHasSearched(false);
    if (isLoggedIn) {
      fetchOrders("");
    } else {
      setOrdersList([]);
    }
  };

  const availableCities = region && REGION_CITIES_MAP[region] ? REGION_CITIES_MAP[region] : ALL_CITIES;

  // Order Cancellation State
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancelOrder = async () => {
    if (!cancelConfirmOrder) return;
    setCancellingOrder(true);
    setCancelMessage(null);
    try {
      const guestPhoneArg = cancelConfirmOrder.phone || phone || orderSearchQuery;
      const res = await cancelCustomerOrderAction(cancelConfirmOrder.rawId || cancelConfirmOrder.id, guestPhoneArg);
      if (res.success) {
        setCancelMessage({ type: 'success', text: res.message });
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === cancelConfirmOrder.id || o.rawId === cancelConfirmOrder.rawId
              ? { ...o, status: 'Cancelled' as OrderStatus }
              : o
          )
        );
        setCancelConfirmOrder(null);
      } else {
        setCancelMessage({ type: 'error', text: res.message || 'Failed to cancel order.' });
      }
    } catch (err: any) {
      setCancelMessage({ type: 'error', text: err?.message || 'Failed to cancel order.' });
    } finally {
      setCancellingOrder(false);
    }
  };

  const renderOrderStepper = (status: OrderStatus) => {
    if (status === 'Cancelled') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: '#fff1f2',
          border: '1px solid #fecdd3',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e11d48', flexShrink: 0 }} />
          <p style={{ ...base, fontSize: '14px', color: '#9f1239', margin: 0 }}>
            <strong>ORDER CANCELLED</strong> — This order was cancelled and reserved items were restored to stock.
          </p>
        </div>
      );
    }

    const steps: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = steps.indexOf(status);

    return (
      <div style={{ padding: '12px 0 6px 0', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* Connecting line */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '32px',
            right: '32px',
            height: '2px',
            background: '#e5e7eb',
            zIndex: 0,
          }}>
            <div style={{
              height: '100%',
              background: '#050505',
              width: `${Math.max(0, (Math.min(currentIdx, steps.length - 1) / (steps.length - 1)) * 100)}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>

          {steps.map((st, i) => {
            const isDone = currentIdx > i;
            const isCurrent = currentIdx === i;
            return (
              <div key={st} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                zIndex: 1,
                position: 'relative',
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                  background: isDone || isCurrent ? '#050505' : '#ffffff',
                  color: isDone || isCurrent ? '#ffffff' : '#9ca3af',
                  border: isDone || isCurrent ? '2px solid #050505' : '2px solid #d1d5db',
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '12px',
                  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCurrent ? '#050505' : isDone ? '#4b5563' : '#9ca3af',
                }}>
                  {st}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (

    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
      <SiteNav />

      <div style={{ flex: 1 }}>
        <div className="max-md:!px-[16px] max-md:!pt-[32px] max-md:!pb-[48px] max-md:!gap-[40px]" style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "1080px",
          margin: "0px auto",
          padding: "80px 24px",
          gap: "60px",
        }}>

          {/* Heading row — Centered Profile / Sign out container */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
            <p className="max-md:!text-[36px] max-md:!leading-[40px]" style={{
              fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
              fontSize: "48px", fontWeight: 600, lineHeight: "56px",
              color: "var(--ink)",
            }}>Profile &amp; Orders</p>
            {isLoggedIn && (
              <p
                style={{ ...base, color: "var(--ink-muted)", textDecoration: "underline", cursor: "pointer" }}
                onClick={handleSignOut}
              >
                Sign out
              </p>
            )}
          </div>

          {/* Personal information section (Only rendered if logged in) */}
          {isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <p style={sectionLabel}>Personal information</p>

              <div className="max-md:!grid-cols-1 max-md:!gap-[20px]" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
                <InputField label="Full name" value={name} onChange={setName} autoComplete="name" />
                <InputField label="Phone number" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
                <InputField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
                <InputField label="Street address" value={address} onChange={setAddress} autoComplete="street-address" />
                <InputField label="Apt / Suite / Floor" value={apt} onChange={setApt} />
                <SelectField
                  label="State / Region"
                  value={region}
                  onChange={(selectedReg) => {
                    setRegion(selectedReg);
                    if (selectedReg && REGION_CITIES_MAP[selectedReg] && !REGION_CITIES_MAP[selectedReg].includes(city)) {
                      setCity(REGION_CITIES_MAP[selectedReg][0] || "");
                    }
                  }}
                  options={REGIONS_LIST}
                  placeholder="Select State / Region"
                />
                <SelectField
                  label="City"
                  value={city}
                  onChange={setCity}
                  options={availableCities}
                  placeholder="Select City"
                />
                <InputField label="ZIP / Post code" value={zip} onChange={setZip} autoComplete="postal-code" />
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-sans text-center">
                  Profile information saved successfully!
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-sans text-center">
                  {profileError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: "#050505", color: "#ffffff", border: "none", cursor: "pointer",
                    padding: "12px 20px",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "17px", letterSpacing: "0.5px", textTransform: "uppercase",
                    fontWeight: 400, lineHeight: "24px",
                    opacity: savingProfile ? 0.7 : 1,
                  }}
                >
                  {savingProfile ? "SAVING..." : profileSuccess ? "SAVED ✓" : "SAVE CHANGES"}
                </button>
              </div>
            </div>
          ) : (
            /* Auth Required Banner when guest / logged out */
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              background: "#fafafa",
              border: "1px solid #e2e2e2",
              textAlign: "center",
              gap: "16px",
            }}>
              <p className="max-md:!text-[26px] max-md:!leading-[32px]" style={{
                fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                fontSize: "32px",
                fontWeight: 600,
                lineHeight: "40px",
                color: "#1c1c1c",
              }}>
                You have to be logged in to see this information
              </p>
              <p style={{ ...base, color: "var(--ink-muted)", maxWidth: "480px" }}>
                Please log in to your account or create a new account to view and edit your personal profile information.
              </p>
              <div style={{ display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => router.push("/signin")}
                  style={{
                    background: "#050505",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    padding: "12px 28px",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "16px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  LOG IN
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  style={{
                    background: "#ffffff",
                    color: "#050505",
                    border: "1px solid #050505",
                    cursor: "pointer",
                    padding: "12px 28px",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "16px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.1)", flexShrink: 0 }} />

          {/* Order history section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <p style={sectionLabel}>Order history ({ordersList.length})</p>

              {/* Order Search Bar by Phone Number or Order ID */}
              <form
                action="javascript:void(0)"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchSubmit(e);
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", maxWidth: "540px" }}
              >
                <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder={isLoggedIn ? "Search your orders by Order ID or product..." : "Order ID + phone, e.g. LIV-123456 01712345678"}
                    className="max-md:!text-[16px]"
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 14px",
                      border: "1px solid #e2e2e2",
                      fontSize: "15px",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      outline: "none",
                      background: "#ffffff",
                      color: "#1c1c1c",
                    }}
                  />
                  {orderSearchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      title="Clear search"
                      aria-label="Clear search input"
                      style={{
                        position: "absolute",
                        right: "10px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.6,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#000000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="1" y1="1" x2="13" y2="13" />
                        <line x1="13" y1="1" x2="1" y2="13" />
                      </svg>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  style={{
                    background: "#050505",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    fontSize: "15px",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  SEARCH
                </button>
              </form>
            </div>

            {/* Cancel feedback toast */}
            {cancelMessage && (
              <div style={{
                padding: '12px 16px',
                background: cancelMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${cancelMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: cancelMessage.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: '14px',
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
              }}>
                {cancelMessage.text}
              </div>
            )}

            {loadingOrders ? (
              <div style={{ padding: "40px 0", textTransform: "uppercase", fontSize: "16px", color: "#888888", textAlign: "center" }}>
                Looking for your order...
              </div>
            ) : ordersList.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                {hasSearched ? (
                  <>
                    <p style={{
                      fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                      fontSize: "24px",
                      fontWeight: 500,
                      lineHeight: "32px",
                      letterSpacing: "0.5px",
                      color: "#1c1c1c",
                    }}>
                      No orders found
                    </p>
                    <p style={{ ...base, color: "var(--ink-muted)", maxWidth: "460px", fontSize: "16px" }}>
                      We couldn't find any results matching "{orderSearchQuery}". Please check your phone number or Order ID and try again.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{
                      fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                      fontSize: "24px",
                      fontWeight: 500,
                      lineHeight: "32px",
                      letterSpacing: "0.5px",
                      color: "#1c1c1c",
                    }}>
                      Check your order
                    </p>
                    <p style={{ ...base, color: "var(--ink-muted)", maxWidth: "460px", fontSize: "16px" }}>
                      Enter your phone number or Order ID and click SEARCH to track your order status.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {ordersList.map((order, idx) => (
                  <div key={idx} style={{ position: "relative", background: "#ffffff" }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      border: "1px solid rgba(0,0,0,0.12)",
                      pointerEvents: "none",
                    }} />
                    <div className="max-md:!p-[16px]" style={{
                      display: "flex", flexDirection: "column", gap: "20px",
                      padding: "28px",
                    }}>
                      {/* Order header row */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <p style={{ ...base, fontSize: "20px", fontWeight: 500, letterSpacing: "-0.36px", color: "#000000" }}>
                            {order.id.startsWith("#") ? order.id : `#${order.id}`}
                          </p>
                          <p style={{ ...base, fontSize: "15px", color: "#666666", letterSpacing: "-0.085px" }}>{order.date}</p>
                          {order.address && (
                            <p style={{ ...base, fontSize: "13px", color: "#888888", marginTop: "2px" }}>
                              Delivering to: {order.address}
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", marginLeft: "auto" }}>
                          <p style={{ ...base, fontSize: "18px", fontWeight: 500, letterSpacing: "-0.36px", color: "#000000" }}>
                            Total: {order.total}
                          </p>
                          <span style={statusStyle[order.status] || statusStyle.Pending}>{order.status}</span>
                        </div>
                      </div>

                      {/* Order Status Progress Stepper */}
                      {renderOrderStepper(order.status)}

                      {/* Items List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {order.items.map((item, j) => (
                          <div key={j} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            <div style={{
                              width: "60px", height: "80px", aspectRatio: "3 / 4", background: "#f0f0f0",
                              overflow: "hidden", flexShrink: 0, border: "1px solid #e2e2e2",
                            }}>
                              <img
                                alt={item.name}
                                src={item.imageUrl || (typeof productImg === 'string' ? productImg : productImg?.src) || "/images/for_him.jpg"}
                                style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "3 / 4" }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                              <p style={{ ...base, fontWeight: 500, fontSize: "17px", color: "#1c1c1c" }}>{item.name}</p>
                              <p style={{ ...base, color: "var(--ink-muted)", fontSize: "15px" }}>{item.meta}</p>
                            </div>
                            <p style={{ ...base, fontWeight: 500, fontSize: "17px", flexShrink: 0, color: "#1c1c1c" }}>{item.price}</p>
                          </div>
                        ))}
                      </div>

                      {/* Thin separator */}
                      <div style={{ width: "100%", height: "1px", background: "#e2e2e2" }} />

                      {/* Pricing summary & Order Actions */}
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                        <div>
                          {order.status === "Pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button
                                type="button"
                                onClick={() => setCancelConfirmOrder(order)}
                                style={{
                                  background: "#ffffff",
                                  color: "#d4183d",
                                  border: "1px solid #d4183d",
                                  padding: "8px 18px",
                                  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                                  fontSize: "14px",
                                  letterSpacing: "0.5px",
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                  fontWeight: 500,
                                }}
                              >
                                CANCEL ORDER
                              </button>
                              <span style={{ fontSize: "12px", color: "#888888" }}>
                                Eligible for instant self-service cancellation
                              </span>
                            </div>
                          ) : order.status === "Cancelled" ? (
                            <span style={{ fontSize: "13px", color: "#9f1239", fontWeight: 500 }}>
                              Order Cancelled
                            </span>
                          ) : (
                            <span style={{ fontSize: "13px", color: "#4b5563", fontWeight: 500 }}>
                              In Progress
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                          <p style={{ ...base, fontSize: "15px", color: "#555555" }}>Subtotal: {order.subtotal}</p>
                          {(order as any).discount && <p style={{ ...base, fontSize: "15px", color: "#d4183d" }}>Discount: -{(order as any).discount}</p>}
                          <p style={{ ...base, fontSize: "15px", color: "#555555" }}>VAT: {order.vat}</p>
                          <p style={{ ...base, fontSize: "15px", color: "#555555" }}>Delivery Charge: {order.delivery}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancellation Confirmation Modal Dialog */}
          {cancelConfirmOrder && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(2px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}>
              <div style={{
                background: "#ffffff",
                maxWidth: "460px",
                width: "100%",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                  fontSize: "28px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#050505",
                }}>
                  CANCEL ORDER?
                </h3>
                <p style={{ ...base, fontSize: "15px", color: "#555555", margin: 0 }}>
                  Are you sure you want to cancel order <strong>{cancelConfirmOrder.id}</strong>? The reserved apparel items will be restored to store stock. This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setCancelConfirmOrder(null)}
                    disabled={cancellingOrder}
                    style={{
                      background: "#ffffff",
                      color: "#050505",
                      border: "1px solid #d1d5db",
                      padding: "10px 20px",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      fontSize: "15px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    KEEP ORDER
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancellingOrder}
                    style={{
                      background: "#d4183d",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 24px",
                      fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                      fontSize: "15px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      opacity: cancellingOrder ? 0.7 : 1,
                    }}
                  >
                    {cancellingOrder ? "CANCELLING..." : "CONFIRM CANCELLATION"}
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
