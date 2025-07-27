import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    const session = await getIronSession(cookies(), sessionOptions);
    session.destroy();
    return NextResponse.json({ message: 'Logged out' }, { status: 200 });
}
