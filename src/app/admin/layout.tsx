'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { ChevronRight } from "lucide-react";

function getBreadcrumbs(pathname: string) {
  if (pathname === '/admin' || pathname === '/admin/') {
    return [{ label: 'Dashboard', href: '/admin' }];
  }

  const cleanPath = pathname.replace(/^\/admin\/?/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  if (segments[0] === 'products') {
    crumbs.push({ label: 'Products', href: '/admin/products' });
    if (segments[1] === 'new') {
      crumbs.push({ label: 'Add Product' });
    } else if (segments[1] === 'edit' || segments[2] === 'edit') {
      crumbs.push({ label: 'Edit Product' });
    } else if (segments[1]) {
      crumbs.push({ label: segments[1] });
    }
  } else if (segments[0] === 'orders') {
    crumbs.push({ label: 'Orders', href: '/admin/orders' });
    if (segments[1] === 'new') crumbs.push({ label: 'Create Order' });
  } else if (segments[0] === 'customers') {
    crumbs.push({ label: 'Customers', href: '/admin/customers' });
  } else if (segments[0] === 'categories') {
    crumbs.push({ label: 'Categories', href: '/admin/categories' });
  } else if (segments[0] === 'inventory') {
    crumbs.push({ label: 'Inventory', href: '/admin/inventory' });
  } else if (segments[0] === 'discounts') {
    crumbs.push({ label: 'Discounts & Promos', href: '/admin/discounts' });
  } else if (segments[0] === 'marquee') {
    crumbs.push({ label: 'Marquee Banners', href: '/admin/marquee' });
  } else if (segments[0] === 'abandoned-carts') {
    crumbs.push({ label: 'Abandoned Carts', href: '/admin/abandoned-carts' });
  } else if (segments[0] === 'newsletter') {
    crumbs.push({ label: 'Newsletter CRM', href: '/admin/newsletter' });
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: 'Store Settings', href: '/admin/settings' });
  } else {
    segments.forEach((seg, idx) => {
      const label = seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      crumbs.push({
        label,
        href: idx < segments.length - 1 ? `/admin/${segments.slice(0, idx + 1).join('/')}` : undefined,
      });
    });
  }

  return crumbs;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Full-page standalone layout for Admin Sign-In (no sidebar or top header)
  if (pathname.startsWith('/admin/sign-in')) {
    return <main className="admin-portal w-full min-h-screen bg-[#0a0a0a] font-sans">{children}</main>;
  }

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="admin-portal flex min-h-screen w-full bg-background text-foreground font-sans">
        <AppSidebar />

        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto font-sans">
          {/* Top Header Bar */}
          <header className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {/* Dynamic Route Breadcrumbs without Admin text */}
              <nav className="flex items-center gap-1.5 text-xs font-sans">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={crumb.label + index} className="flex items-center gap-1.5">
                      {index > 0 && <ChevronRight className="size-3 text-neutral-400" />}
                      {isLast || !crumb.href ? (
                        <span className="font-semibold text-neutral-900">
                          {crumb.label}
                        </span>
                      ) : (
                        <Link href={crumb.href} className="text-neutral-500 hover:text-black transition-colors font-medium">
                          {crumb.label}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </header>

          {/* Content View Area */}
          <main className="admin-main p-8 flex-1 font-sans">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
