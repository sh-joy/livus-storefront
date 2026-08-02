'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { InputField } from "./InputField";
import { searchCustomerOrdersAction, getCustomerProfileAction, saveCustomerProfileAction } from "@/app/actions/orders";
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
  date: string;
  total: string;
  status: OrderStatus;
  subtotal: string;
  vat: string;
  delivery: string;
  items: OrderItem[];
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

  // Load customer saved data from database when user is logged in
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
    if (isLoggedIn) {
      loadCustomerData();
    }
  }, [isLoggedIn, user?.email]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError("");

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
    // Only auto-load order history if user is logged in
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#ffffff" }}>
      <SiteNav />

      <div style={{ flex: 1 }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "1080px",
          margin: "0px auto",
          padding: "80px 24px",
          gap: "60px",
        }}>

          {/* Heading row — Centered Profile / Sign out container */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
            <p style={{
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
                <InputField label="Full name" value={name} onChange={setName} autoComplete="name" />
                <InputField label="Phone number" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
                <InputField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
                <InputField label="Street address" value={address} onChange={setAddress} autoComplete="street-address" />
                <InputField label="Apt / Suite / Floor" value={apt} onChange={setApt} />
                <InputField label="City" value={city} onChange={setCity} autoComplete="address-level2" />
                <InputField label="State / Region" value={region} onChange={setRegion} autoComplete="address-level1" />
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
              <p style={{
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
                    placeholder="Search orders by phone number or Order ID..."
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
                    <div style={{
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
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", marginLeft: "auto" }}>
                          <p style={{ ...base, fontSize: "18px", fontWeight: 500, letterSpacing: "-0.36px", color: "#000000" }}>
                            Total: {order.total}
                          </p>
                          <span style={statusStyle[order.status] || statusStyle.Pending}>{order.status}</span>
                        </div>
                      </div>

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
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                              <p style={{ ...base, fontWeight: 500, fontSize: "17px", color: "#1c1c1c" }}>{item.name}</p>
                              <p style={{ ...base, color: "var(--ink-muted)", fontSize: "15px" }}>{item.meta}</p>
                            </div>
                            <p style={{ ...base, fontWeight: 500, fontSize: "17px", flexShrink: 0, color: "#1c1c1c" }}>{item.price}</p>
                          </div>
                        ))}
                      </div>

                      {/* Thin separator */}
                      <div style={{ width: "100%", height: "1px", background: "#e2e2e2" }} />

                      {/* Pricing summary */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                        <p style={{ ...base, fontSize: "15px", color: "#555555" }}>Subtotal: {order.subtotal}</p>
                        <p style={{ ...base, fontSize: "15px", color: "#555555" }}>VAT: {order.vat}</p>
                        <p style={{ ...base, fontSize: "15px", color: "#555555" }}>Delivery Charge: {order.delivery}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
