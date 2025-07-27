import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession(request.cookies, sessionOptions);

  const { user } = session;

  const isPublicPage = request.nextUrl.pathname === '/login';

  if (!user && !isPublicPage) {
    // If not logged in and not on the login page, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user && isPublicPage) {
    // If logged in and on the login page, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
