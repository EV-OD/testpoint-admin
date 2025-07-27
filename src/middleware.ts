import { type NextRequest } from 'next/server'
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const session = await getIronSession(request.cookies, sessionOptions);

  if (!session.user && !request.nextUrl.pathname.startsWith('/login')) {
    return Response.redirect(new URL('/login', request.url))
  }

   if (session.user && request.nextUrl.pathname.startsWith('/login')) {
    return Response.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
