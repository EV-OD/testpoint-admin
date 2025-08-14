import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found in Firestore' }, { status: 404 });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      id: decodedToken.uid,
      name: userData?.name || decodedToken.name,
      email: userData?.email || decodedToken.email,
      role: userData?.role,
    });

  } catch (error) {
    console.error('Error verifying session cookie:', error);
    // This could be due to an expired cookie.
    const response = NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });
    response.cookies.delete('session');
    return response;
  }
}
