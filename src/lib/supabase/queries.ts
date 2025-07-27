"use server";

import { createClient } from '@/lib/supabase/server';
import type { Test, Group } from "@/lib/types";
import { cookies } from 'next/headers';

// USER QUERIES
export async function getUsersWithGroups() {
  const supabase = createClient(cookies());
  const { data, error } = await supabase.rpc('get_users_with_groups');
   if (error) {
    console.error('Error fetching users with groups:', error);
    return { data: [], error };
  }
  return { data, error };
}

export async function getUsers() {
    const supabase = createClient(cookies());
    return await supabase.from('profiles').select('id, name, role');
}

export async function getProfileByUserId(userId: string) {
    const supabase = createClient(cookies());
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return { data, error };
}

// GROUP QUERIES
export async function getGroupsWithMemberCount() {
    const supabase = createClient(cookies());
    const { data, error } = await supabase.rpc('get_groups_with_member_count');
    return { data, error };
}

export async function getGroups() {
    const supabase = createClient(cookies());
    return await supabase.from('groups').select('*');
}

export async function getGroupWithMembers(groupId: string) {
    const supabase = createClient(cookies());
    const { data: group, error: groupError } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (groupError) return { data: null, error: groupError };

    const { data: members, error: membersError } = await supabase.from('user_groups').select('user_id').eq('group_id', groupId);
    if (membersError) return { data: null, error: membersError };

    const userIds = members.map((m: any) => m.user_id);
    
    return { data: { ...group, userIds }, error: null };
}

export async function deleteGroup(groupId: string) {
    const supabase = createClient(cookies());
    // Supabase cascading deletes should handle related records in user_groups and tests
    // if the foreign keys are set up with ON DELETE CASCADE.
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    return { error };
}

export async function upsertGroup(groupData: { id?: string; name: string; userIds: string[] }) {
    const supabase = createClient(cookies());
    const { id, name, userIds } = groupData;
    
    const { data: group, error: groupError } = await supabase.from('groups').upsert({ id, name }).select().single();

    if(groupError) return { error: groupError };

    // Delete existing relations
    const { error: deleteError } = await supabase.from('user_groups').delete().eq('group_id', group.id);
    if (deleteError) return { error: deleteError };

    // Add new relations
    if (userIds && userIds.length > 0) {
        const relations = userIds.map(userId => ({ group_id: group.id, user_id: userId }));
        const { error: insertError } = await supabase.from('user_groups').insert(relations);
        if (insertError) return { error: insertError };
    }

    return { error: null };
}

// TEST QUERIES
export async function getTests() {
    const supabase = createClient(cookies());
    return await supabase.from('tests').select('*, groups (name)');
}

export async function deleteTest(testId: string) {
    const supabase = createClient(cookies());
    const { error } = await supabase.from('tests').delete().eq('id', testId);
    return { error };
}

export async function upsertTest(testData: Omit<Test, 'id' | 'groups'> & { id?: string }) {
    const supabase = createClient(cookies());
    const { id, ...testInsertData } = testData;
    
    const { error } = await supabase.from('tests').upsert({ id, ...testInsertData });
    return { error };
}
