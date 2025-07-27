import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

async function isAdmin() {
    const session = await getIronSession(cookies(), sessionOptions);
    return session.user && session.user.role === 'admin';
}

// PUT (update) a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = params;
    try {
        const { name, role } = await req.json();
        
        const [updatedUser] = await sql`
            UPDATE profiles
            SET name = ${name}, role = ${role}
            WHERE id = ${id}
            RETURNING id, name, email, role
        `;

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Database error updating user' }, { status: 500 });
    }
}

// DELETE a user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = params;
    try {
        // We need to delete from user_groups first due to foreign key constraints
        await sql`DELETE FROM user_groups WHERE user_id = ${id}`;

        const result = await sql`
            DELETE FROM profiles WHERE id = ${id}
        `;

        if (result.count === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Database error deleting user' }, { status: 500 });
    }
}
