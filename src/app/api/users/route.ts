import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET all users
export async function GET() {
    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // Check if the user is an admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { data: users, error } = await supabase.rpc('get_users_with_groups');
        
        if (error) throw error;
        
        return NextResponse.json(users, { status: 200 });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }
}

// POST a new user
export async function POST(req: NextRequest) {
    const supabaseAdmin = createAdminClient();
    
    try {
        const { name, email, role, password } = await req.json();

        // Use the admin client to create a new user
        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Or false if you don't want email verification
        });

        if (authError) throw authError;

        // Now create the profile for the new user
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: newUser.user.id,
            name,
            role,
        });

        if (profileError) {
            // If profile creation fails, we should probably delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw profileError;
        }

        // Return a simplified user object, don't expose sensitive details
        return NextResponse.json({ id: newUser.user.id, name, email, role }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating user:', error);
        // Check for unique constraint violation
        if (error.code === '23505' || error.message?.includes('already exists')) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: error.message || 'Database error creating user' }, { status: 500 });
    }
}
