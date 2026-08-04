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

  // Public CafeOS marketing site pages — none of these need a staff/tenant login. Listed
  // explicitly (not a broad prefix) so a future page under app/(app)/ can never accidentally end
  // up public just by sharing a path prefix with one of these.
  const MARKETING_PAGES = [
    '/', '/features', '/pricing', '/website-themes', '/qr-ordering', '/pos',
    '/kitchen-display', '/online-ordering', '/about', '/contact', '/faq',
    '/privacy', '/terms', '/cookie-policy',
  ];

  // Allow access to auth routes, API routes, customer routes, public tenant websites, and public
  // assets without admin auth. /site is the public tenant website (anonymous shoppers/visitors —
  // must never require a staff login); /s is its QR-code short link; /menu is kept for old
  // bookmarked/indexed links, which now just redirect into /site. /api/register is the public
  // self-serve signup (creates a PENDING tenant + owner) — unauthenticated by design.
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/register') ||
    pathname.startsWith('/api/mobile') ||
    pathname.startsWith('/api/customer') ||
    pathname.startsWith('/api/marketing') ||
    // Razorpay calls this server-to-server with a signed payload (no NextAuth session cookie),
    // so it must be reachable anonymously — the signature itself is the authentication.
    pathname.startsWith('/api/webhooks/razorpay') ||
    pathname.startsWith('/api/website/lead') ||
    pathname.startsWith('/api/website/visit') ||
    pathname.startsWith('/api/website/table') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/menu') ||
    pathname.startsWith('/site') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/customer') ||
    MARKETING_PAGES.includes(pathname) ||
    // SEO metadata files must reach crawlers without a session (previously /robots.txt 307'd to
    // /auth/login so robots.txt content never got served). /sitemap.xml is the app-level sitemap;
    // per-tenant sitemaps live under /site/[tenantId] and are already covered by the /site prefix.
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // If no valid token (or empty/invalid token from session expiry) and trying to access protected route,
  // return a JSON 401 for API consumers and redirect browser page requests to login.
  if (!token?.id && pathname !== '/auth/login') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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