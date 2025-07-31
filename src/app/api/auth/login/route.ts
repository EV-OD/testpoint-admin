import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];

    if (idToken) {
      const expires = new Date(Date.now() + SESSION_DURATION);
      cookies().set('session', idToken, { expires, httpOnly: true, secure: true, path: '/' });
      return NextResponse.json({ status: 'success' }, { status: 200 });
    }
  }

  return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
}
