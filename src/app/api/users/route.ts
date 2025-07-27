import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET all users (this endpoint is now unused, data is fetched via Server Actions)
export async function GET() {
    return NextResponse.json({ message: 'This endpoint is not used for GET requests.' }, { status: 405 });
}

// POST a new user
export async function POST(req: NextRequest) {
    try {
        const { name, email, role, password } = await req.json();

        // Check for existing user
        const existingUsers = await sql`SELECT id FROM profiles WHERE email = ${email}`;
        if (existingUsers.length > 0) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await sql`
            INSERT INTO profiles (name, email, role, password) 
            VALUES (${name}, ${email}, ${role}, ${hashedPassword})
            RETURNING id, name, email, role
        `;
        
        return NextResponse.json(result[0], { status: 201 });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ message: error.message || 'Database error creating user' }, { status: 500 });
    }
}
