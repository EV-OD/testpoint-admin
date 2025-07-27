"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { User, Group, Test } from "@/lib/types";

// This admin client is used for operations requiring service_role permissions.
// It should only be used in server-side code.
const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Supabase URL or Service Role Key is not defined");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
         auth: {
            autoRefreshToken: false,
            persistSession: false
         }
    });
};


// USER QUERIES
export async function getUsersWithGroups() {
  const supabase = createServerClient();
  return supabase.from("profiles").select(`
    id,
    name,
    email,
    role,
    groups ( name )
  `);
}

export async function getUsers() {
  const supabase = createServerClient();
  return supabase.from("profiles").select(`id, name, role`);
}

export async function getProfileByUserId(userId: string) {
    const supabase = createServerClient();
    return supabase.from('profiles').select('*').eq('id', userId).single();
}


export async function deleteUser(userId: string) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    return { data, error };
}

export async function upsertUser(user: Partial<User>) {
    const supabase = createServerClient();
    return supabase.from('profiles').upsert({ id: user.id!, name: user.name!, role: user.role!, email: user.email! }).select().single();
}

export async function createUserWithProfile(userData: any) {
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
    });

    if (authError) return { data: null, error: authError };

    if (authData.user) {
        // Use the admin client to insert the profile, bypassing RLS.
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
        });

        if (profileError) {
             // If profile creation fails, we must delete the auth user to prevent orphans.
             await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
             return { data: null, error: profileError };
        }
    }
    return { data: authData, error: null };
}

export async function resetPasswordForUser(email: string) {
    const supabase = createServerClient();
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: '/update-password'
    });
}


// GROUP QUERIES
export async function getGroupsWithMemberCount() {
    const supabase = createServerClient();
    return supabase.rpc('get_groups_with_member_count');
}

export async function getGroups() {
    const supabase = createServerClient();
    return supabase.from('groups').select('*');
}

export async function getGroupWithMembers(groupId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('groups').select(`*, user_groups(user_id)`).eq('id', groupId).single();
    if(error) return { data: null, error };

    if (!data) {
        return { data: null, error: { message: "Group not found", details: "", hint: "", code: "404" } };
    }
    
    const userIds = data.user_groups.map((ug: any) => ug.user_id);
    // We need to remove the user_groups from the returned data
    // to match the expected type.
    const { user_groups, ...rest } = data;
    return { data: { ...rest, userIds }, error: null };
}

export async function deleteGroup(groupId: string) {
    const supabase = createServerClient();
    // First, delete related user_groups entries
    await supabase.from('user_groups').delete().eq('group_id', groupId);
    return supabase.from('groups').delete().eq('id', groupId);
}

export async function upsertGroup(groupData: { id?: string; name: string; userIds: string[] }) {
    const supabase = createServerClient();
    const { id, name, userIds } = groupData;

    // Upsert group details
    const { data: group, error: groupError } = await supabase.from('groups').upsert({ id: id, name: name }).select().single();
    if (groupError) return { error: groupError };

    const groupId = group.id;

    // Clear existing members
    const { error: deleteError } = await supabase.from('user_groups').delete().eq('group_id', groupId);
    if(deleteError) return { error: deleteError };
    
    // Add new members
    if (userIds.length > 0) {
      const userGroupRelations = userIds.map(userId => ({ group_id: groupId, user_id: userId }));
      const { error: insertError } = await supabase.from('user_groups').insert(userGroupRelations);
      return { error: insertError };
    }

    return { error: null };
}

// TEST QUERIES
export async function getTests() {
    const supabase = createServerClient();
    return supabase.from('tests').select(`
        *,
        groups ( name )
    `);
}

export async function deleteTest(testId: string) {
    const supabase = createServerClient();
    return supabase.from('tests').delete().eq('id', testId);
}

export async function upsertTest(testData: Omit<Test, 'id'> & { id?: string }) {
     const supabase = createServerClient();
    const testPayload = {
        ...testData,
        date_time: new Date(testData.date_time).toISOString(),
    };
    return supabase.from('tests').upsert(testPayload);
}
