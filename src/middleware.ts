import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

const PROTECTED_ROUTES = ['/dashboard'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = cookies().get('session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      // Clear the invalid cookie
      response.cookies.delete('session');
      return response;
    }
  }

  // If the user is logged in and tries to access a public route like login, redirect to dashboard
  if (sessionCookie && PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
