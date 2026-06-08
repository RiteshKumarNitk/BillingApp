import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const { pathname } = request.nextUrl;

  // Allow access to auth routes, API routes, and public assets without authentication
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/mobile') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/menu') ||
    pathname === '/' ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // If no valid token (or empty/invalid token from session expiry) and trying to access protected route, redirect to login
  if (!token?.id && pathname !== '/auth/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If user is trying to access login page while already logged in, redirect to dashboard
  if (token?.id && pathname === '/auth/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  // Role-based route protection
  if (token?.id) {
    const role = token.role as string;
    
    // Superadmin only routes
    if (role !== 'SUPERADMIN' && pathname.startsWith('/tenants')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    
    // Tenant only routes
    const tenantOnlyRoutes = ['/products', '/billing', '/roles'];
    const isTenantRoute = tenantOnlyRoutes.some(route => pathname.startsWith(route));
    
    if (role === 'SUPERADMIN' && isTenantRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/mobile|_next/static|_next/image|favicon.ico).*)',
  ],
};