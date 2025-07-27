"use server";

import { createClient } from "@/lib/supabase/server";
import type { User, Group, Test } from "@/lib/types";

// USER QUERIES
export async function getUsersWithGroups() {
  const supabase = createClient();
  return supabase.from("profiles").select(`
    id,
    name,
    email,
    role,
    groups ( name )
  `);
}

export async function getUsers() {
  const supabase = createClient();
  return supabase.from("profiles").select(`id, name, role`);
}

export async function getProfileByUserId(userId: string) {
    const supabase = createClient();
    return supabase.from('profiles').select('*').eq('id', userId).single();
}


export async function deleteUser(userId: string) {
    const supabase = createClient();
    // We need to use the service role key to delete users from auth.users
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    return { data, error };
}

export async function upsertUser(user: Partial<User>) {
    const supabase = createClient();
    return supabase.from('profiles').upsert({ id: user.id!, name: user.name!, role: user.role!, email: user.email! }).select().single();
}

export async function createUserWithProfile(userData: any) {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, 
    });

    if (authError) return { data: null, error: authError };

    if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
        });
        if (profileError) {
             // If profile creation fails, we should probably delete the auth user
             await supabase.auth.admin.deleteUser(authData.user.id);
             return { data: null, error: profileError };
        }
    }
    return { data: authData, error: null };
}

export async function resetPasswordForUser(email: string) {
    const supabase = createClient();
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: '/update-password'
    });
}


// GROUP QUERIES
export async function getGroupsWithMemberCount() {
    const supabase = createClient();
    return supabase.rpc('get_groups_with_member_count');
}

export async function getGroups() {
    const supabase = createClient();
    return supabase.from('groups').select('*');
}

export async function getGroupWithMembers(groupId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('groups').select(`*, user_groups(user_id)`).eq('id', groupId).single();
    if(error) return { data: null, error };
    
    const userIds = data.user_groups.map((ug: any) => ug.user_id);
    return { data: { ...data, userIds }, error: null };
}

export async function deleteGroup(groupId: string) {
    const supabase = createClient();
    return supabase.from('groups').delete().eq('id', groupId);
}

export async function upsertGroup(groupData: { id?: string; name: string; userIds: string[] }) {
    const supabase = createClient();
    const { id, name, userIds } = groupData;

    // Upsert group details
    const { data: group, error: groupError } = await supabase.from('groups').upsert({ id: id, name: name }).select().single();
    if (groupError) return { error: groupError };

    const groupId = group.id;

    // Clear existing members
    const { error: deleteError } = await supabase.from('user_groups').delete().eq('group_id', groupId);
    if(deleteError) return { error: deleteError };
    
    // Add new members
    const userGroupRelations = userIds.map(userId => ({ group_id: groupId, user_id: userId }));
    const { error: insertError } = await supabase.from('user_groups').insert(userGroupRelations);

    return { error: insertError };
}

// TEST QUERIES
export async function getTests() {
    const supabase = createClient();
    return supabase.from('tests').select(`
        *,
        groups ( name )
    `);
}

export async function deleteTest(testId: string) {
    const supabase = createClient();
    return supabase.from('tests').delete().eq('id', testId);
}

export async function upsertTest(testData: Omit<Test, 'id'> & { id?: string }) {
     const supabase = createClient();
    const testPayload = {
        ...testData,
        date_time: new Date(testData.date_time).toISOString(),
    };
    return supabase.from('tests').upsert(testPayload);
}
