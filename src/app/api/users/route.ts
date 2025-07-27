import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

async function isAdmin() {
    const session = await getIronSession(cookies(), sessionOptions);
    return session.user && session.user.role === 'admin';
}

// GET all users
export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const users = await sql`
            SELECT p.id, p.name, p.email, p.role, 
                   COALESCE(json_agg(json_build_object('name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]') as groups
            FROM profiles p
            LEFT JOIN user_groups ug ON p.id = ug.user_id
            LEFT JOIN groups g ON ug.group_id = g.id
            GROUP BY p.id
        `;
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }
}

// POST a new user
export async function POST(req: NextRequest) {
     if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { name, email, role, password } = await req.json();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [newUser] = await sql`
            INSERT INTO profiles (name, email, role, password)
            VALUES (${name}, ${email}, ${role}, ${hashedPassword})
            RETURNING id, name, email, role
        `;

        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        console.error(error);
        // Check for unique constraint violation
        if (error instanceof Error && 'code' in error && error.code === '23505') {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Database error creating user' }, { status: 500 });
    }
}
