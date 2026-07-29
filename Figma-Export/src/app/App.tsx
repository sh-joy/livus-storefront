import { BrowserRouter, Routes, Route, useNavigate } from "react-router";
import Homepage from "../imports/Homepage";
import ForHim from "../imports/ForHim-2";
import ForHer from "../imports/ForHer";
import ProductDetails from "../imports/ProductDetails-1";
import Search from "../imports/Search-1";
import OrderConfirmed from "../imports/OrderConfirmed";
import PageNonFound from "../imports/PageNonFound";
import { DrawerProvider } from "./components/DrawerContext";
import { AppShell } from "./components/AppShell";
import { SignInPage } from "./components/SignInPage";
import { SignUpPage } from "./components/SignUpPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { ProfilePage } from "./components/ProfilePage";

function useProductCardNav() {
  const navigate = useNavigate();
  return (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
    for (let i = 0; i < 12; i++) {
      if (!el) break;
      const cls = typeof el.className === "string" ? el.className : "";
      if (
        cls.includes("justify-self-stretch") &&
        cls.includes("self-start") &&
        cls.includes("flex-col")
      ) {
        navigate("/product");
        return;
      }
      el = el.parentElement;
    }
  };
}

function HomepageWithNav() {
  const navigate = useNavigate();
  const onProductClick = useProductCardNav();
  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
    for (let i = 0; i < 5; i++) {
      if (!el) break;
      const text = el.textContent?.trim();
      if (text === "Shop For Him") { navigate("/for-him"); return; }
      if (text === "Shop For Her") { navigate("/for-her"); return; }
      el = el.parentElement;
    }
    onProductClick(e);
  };
  return <div className="size-full" onClick={handleClick}><Homepage /></div>;
}

function ForHimWithNav() {
  const navigate = useNavigate();
  const onProductClick = useProductCardNav();
  const handleClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.textContent?.trim() === "LIVUS" && el.tagName === "P") { navigate("/"); return; }
    onProductClick(e);
  };
  return <div className="size-full" onClick={handleClick}><ForHim /></div>;
}

function ForHerWithNav() {
  const navigate = useNavigate();
  const onProductClick = useProductCardNav();
  const handleClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.textContent?.trim() === "LIVUS" && el.tagName === "P") { navigate("/"); return; }
    onProductClick(e);
  };
  return <div className="size-full" onClick={handleClick}><ForHer /></div>;
}

function ProductDetailsWithNav() {
  const navigate = useNavigate();
  const onProductClick = useProductCardNav();
  const handleClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.textContent?.trim() === "LIVUS" && el.tagName === "P") { navigate("/"); return; }
    onProductClick(e);
  };
  return <div className="size-full" onClick={handleClick}><ProductDetails /></div>;
}

function SearchWithNav() {
  const navigate = useNavigate();
  const onProductClick = useProductCardNav();
  const handleClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (el.textContent?.trim() === "LIVUS" && el.tagName === "P") { navigate("/"); return; }

    // Detect the X (close) icon — it lives in a size-[20px] container in the search header
    let cursor: Element | null = e.target as Element;
    for (let i = 0; i < 6; i++) {
      if (!cursor) break;
      const cls = (cursor as HTMLElement).getAttribute?.("class") ?? "";
      if (cls.includes("size-[20px]") && !cls.includes("size-full")) {
        navigate("/");
        return;
      }
      cursor = cursor.parentElement;
    }

    onProductClick(e);
  };
  return <div className="size-full" onClick={handleClick}><Search /></div>;
}

function OrderConfirmedWithNav() {
  const navigate = useNavigate();
  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
    for (let i = 0; i < 5; i++) {
      if (!el) break;
      const text = el.textContent?.trim();
      if (text === "LIVUS" && el.tagName === "P") { navigate("/"); return; }
      if (text === "View my orders") { navigate("/profile"); return; }
      el = el.parentElement;
    }
  };
  return <div className="size-full" onClick={handleClick}><OrderConfirmed /></div>;
}

function PageNotFoundWithNav() {
  const navigate = useNavigate();
  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
    for (let i = 0; i < 5; i++) {
      if (!el) break;
      const text = el.textContent?.trim();
      if (text === "LIVUS" && el.tagName === "P") { navigate("/"); return; }
      if (text === "Return to homepage") { navigate("/"); return; }
      el = el.parentElement;
    }
  };
  return <div className="size-full" onClick={handleClick}><PageNonFound /></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <DrawerProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomepageWithNav />} />
            <Route path="/for-him" element={<ForHimWithNav />} />
            <Route path="/for-her" element={<ForHerWithNav />} />
            <Route path="/product" element={<ProductDetailsWithNav />} />
            <Route path="/search" element={<SearchWithNav />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/order-confirmed" element={<OrderConfirmedWithNav />} />
            <Route path="*" element={<PageNotFoundWithNav />} />
          </Routes>
        </AppShell>
      </DrawerProvider>
    </BrowserRouter>
  );
}
