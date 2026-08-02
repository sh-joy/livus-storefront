'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { ExternalLink, ChevronRight } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Full-page standalone layout for Admin Sign-In (no sidebar or top header)
  if (pathname.startsWith('/admin/sign-in')) {
    return <main className="w-full min-h-screen bg-[#0a0a0a] font-sans">{children}</main>;
  }

  // Generate clean breadcrumb segments from pathname
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="admin-portal flex min-h-screen w-full bg-background text-foreground font-sans">
        <AppSidebar />

        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto font-sans">
          {/* Top Header Bar */}
          <header className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {/* Dynamic Route Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                {pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1;
                  const href = '/' + pathSegments.slice(0, index + 1).join('/');
                  return (
                    <div key={href} className="flex items-center gap-1.5">
                      {index > 0 && <ChevronRight className="size-3 text-muted-foreground/50" />}
                      {isLast ? (
                        <span className="font-semibold text-foreground capitalize">
                          {segment.replace(/-/g, ' ')}
                        </span>
                      ) : (
                        <Link href={href} className="hover:text-foreground transition-colors capitalize">
                          {segment.replace(/-/g, ' ')}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Right Action */}
            <div className="flex items-center gap-4 text-xs font-sans">
              <Link
                href="/"
                target="_blank"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 hover:underline font-medium"
              >
                <span>View Storefront</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </header>

          {/* Content View Area */}
          <main className="admin-main p-8 flex-1 font-sans">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
