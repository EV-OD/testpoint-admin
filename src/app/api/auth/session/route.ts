import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getIronSession(cookies(), sessionOptions);

  if (session.user) {
    return NextResponse.json({
      isLoggedIn: true,
      user: session.user,
    }, { status: 200 });
  }

  return NextResponse.json({
    isLoggedIn: false,
  }, { status: 200 });
}
