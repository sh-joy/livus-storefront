import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /admin routes (except /admin/sign-in)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/sign-in')) {
    const adminCookie = request.cookies.get('livus_admin_session')?.value;

    if (!adminCookie || adminCookie !== 'true') {
      const adminSignInUrl = new URL('/admin/sign-in', request.url);
      adminSignInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminSignInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
