
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];

    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        if (new Date().getTime() / 1000 - decodedToken.auth_time < 5 * 60) {
            const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION });
            const expires = new Date(Date.now() + SESSION_DURATION);
            cookies().set('session', sessionCookie, { expires, httpOnly: true, secure: true, path: '/' });
            return NextResponse.json({ status: 'success' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Recent sign-in required' }, { status: 401 });
        }
      } catch (error) {
        console.error('Error creating session cookie:', error);
        return NextResponse.json({ message: 'Failed to create session' }, { status: 401 });
      }
    }
  }

  return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
}
