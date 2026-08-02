'use client';

import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Tag,
  ClipboardList,
  ShoppingCart,
  Users,
  Mail,
  Ticket,
  Megaphone,
  Settings,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const allNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: ShoppingBag },
  { title: "Rapid Inventory", url: "/admin/inventory", icon: Boxes },
  { title: "Categories", url: "/admin/categories", icon: Tag },
  { title: "All Orders", url: "/admin/orders", icon: ClipboardList },
  { title: "Abandoned Carts", url: "/admin/abandoned-carts", icon: ShoppingCart },
  { title: "Customers Directory", url: "/admin/customers", icon: Users },
  { title: "Newsletter CRM", url: "/admin/subscribers", icon: Mail },
  { title: "Discounts & Promos", url: "/admin/promos", icon: Ticket },
  { title: "Marquee Banners", url: "/admin/marquee", icon: Megaphone },
  { title: "Store Settings", url: "/admin/settings", icon: Settings },
];

import { useSession, signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: sessionData } = useSession();

  const user = sessionData?.user;
  const userRole = (user as any)?.role || "admin";
  const userEmail = user?.email || "admin@livus.com";
  const userName = user?.name || "Admin User";
  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "AD";

  const handleLogout = async () => {
    document.cookie = 'livus_admin_session=; path=/; max-age=0';
    document.cookie = 'livus_admin_role=; path=/; max-age=0';
    await signOut();
    window.location.href = "/admin/sign-in";
  };

  return (
    <Sidebar className="font-sans rounded-none border-r border-neutral-800">
      <SidebarContent className="rounded-none flex flex-col h-full bg-[#121212] text-white p-0">
        {/* Brand Header */}
        <div className="px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
              <ArrowUpRight className="size-3.5" />
            </div>
            <Link
              href="/"
              className="font-sans text-sm font-semibold tracking-tight text-white hover:opacity-80 transition-opacity"
            >
              LIVUS Admin
            </Link>
          </div>
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold tracking-wider rounded-none ${
            userRole === 'superadmin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
          }`}>
            {userRole}
          </span>
        </div>

        {/* Single Flat Nav List in One Div - 0 Border Radius (rounded-none) */}
        <div className="flex-1 py-2 overflow-y-auto px-2">
          <SidebarMenu className="gap-0.5 px-0">
            {allNavItems.map((item) => {
              const isActive = pathname === item.url;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="rounded-none px-2.5 py-2.5 h-auto text-xs flex items-center gap-3 data-[active=true]:bg-[#262626] data-[active=true]:text-white text-neutral-300 hover:text-white hover:bg-neutral-800/60 font-normal transition-colors"
                  >
                    <Link href={item.url}>
                      <Icon className="size-4 shrink-0 text-neutral-400" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>

        {/* Bottom Profile Section with Sign Out */}
        <div className="mt-auto shrink-0 p-3 pt-2 font-sans border-t border-neutral-800/60">
          <div className="w-full p-2 rounded-none bg-transparent flex items-center gap-2.5">
            <div className="size-8 rounded-none bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate leading-tight">{userName}</span>
              <span className="text-[11px] text-neutral-400 truncate leading-tight">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out of admin"
              className="p-1 text-neutral-400 hover:text-rose-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
