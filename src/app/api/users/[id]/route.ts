import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';


async function getAdminSupabase() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return null;
    }
    
    return supabase;
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
        
        const { data: updatedUser, error } = await supabase
            .from('profiles')
            .update({ name, role })
            .eq('id', id)
            .select('id, name, role')
            .single();

        if (error) throw error;

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Also fetch the email from the auth.users table
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(id);
        const email = authUser?.email || '';

        return NextResponse.json({ ...updatedUser, email }, { status: 200 });

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
        const { error } = await supabase.auth.admin.deleteUser(id);

        if (error) {
            // The RLS on profiles should cascade delete, but if not, handle it here.
            // If the user doesn't exist in auth, it might still exist in profiles.
             const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
             if(profileError) throw profileError;
             else throw error;
        }

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: error.message || 'Database error deleting user' }, { status: 500 });
    }
}
