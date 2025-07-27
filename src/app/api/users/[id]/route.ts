import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';


async function getAdminSupabase() {
    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return null;
    }
    
    // Use the admin client for elevated privileges
    return createAdminClient();
}


// PUT (update) a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = await getAdminSupabase();
    if (!supabase) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    try {
        const { name, role } = await req.json();
        
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({ name, role })
            .eq('id', id)
            .select('id, name, role')
            .single();

        if (error) throw error;

        if (!updatedProfile) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Also fetch the email from the auth.users table
        const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(id);
        if(userError) throw userError;
        
        const email = authUser?.email || '';

        return NextResponse.json({ ...updatedProfile, email }, { status: 200 });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ message: error.message || 'Database error updating user' }, { status: 500 });
    }
}

// DELETE a user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = await getAdminSupabase();
    if (!supabase) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { id } = params;
    try {
        const { error } = await supabase.auth.admin.deleteUser(id, true); // true to soft delete, false to hard delete

        if (error) {
             throw error;
        }

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: error.message || 'Database error deleting user' }, { status: 500 });
    }
}
