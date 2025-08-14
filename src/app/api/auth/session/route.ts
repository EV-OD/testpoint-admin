
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }

  // In a real app, you would verify the token here with Firebase Admin SDK
  // For now, we just check for presence.
  
  return NextResponse.json({ isLoggedIn: true }, { status: 200 });
}
