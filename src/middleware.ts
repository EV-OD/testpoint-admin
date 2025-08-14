
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/teacher'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  if (sessionCookie && PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
  * Match all request paths except for the ones starting with:
  * - api (API routes)
  * - _next/static (static files)
  * - _next/image (image optimization files)
  * - favicon.ico (favicon file)
  */
  matcher: ['/dashboard/:path*', '/teacher/:path*', '/login'],
};
