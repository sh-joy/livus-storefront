import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Allow direct access to all admin routes without requiring authentication
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
