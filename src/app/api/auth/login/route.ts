import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  try {
    const users = await sql`SELECT id, name, email, role, password FROM profiles WHERE email = ${email}`;
    
    if (users.length === 0) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    if (user.role !== 'admin') {
        return NextResponse.json({ message: 'Access denied. Only admins can log in.' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    const session = await getIronSession(cookies(), sessionOptions);
    session.user = userWithoutPassword;
    await session.save();

    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
