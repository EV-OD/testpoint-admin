import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';


// PUT (update) a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const { name, role } = await req.json();
        
        const result = await sql`
            UPDATE profiles 
            SET name = ${name}, role = ${role} 
            WHERE id = ${id}
            RETURNING id, name, email, role
        `;

        if (result.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(result[0], { status: 200 });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ message: error.message || 'Database error updating user' }, { status: 500 });
    }
}

// DELETE a user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const result = await sql`DELETE FROM profiles WHERE id = ${id}`;

        if (result.count === 0) {
             return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: error.message || 'Database error deleting user' }, { status: 500 });
    }
}
