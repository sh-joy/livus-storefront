import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-session';

// Next.js 16: "middleware" is now "proxy" (runs on the Node.js runtime).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

  // Legacy Better-Auth admin login page → the real admin sign-in
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/sign-in', request.url));
  }

  if (pathname === '/admin/sign-in') {
    if (adminSession) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') && !adminSession) {
    const signInUrl = new URL('/admin/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
