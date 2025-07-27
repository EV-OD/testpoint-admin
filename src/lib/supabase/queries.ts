"use server";

import sql from '@/lib/db';
import type { Test, Group } from "@/lib/types";

// USER QUERIES
export async function getUsersWithGroups() {
  try {
    const users = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.email, 
        p.role, 
        COALESCE(
          (SELECT json_agg(json_build_object('name', g.name)) 
           FROM groups g 
           JOIN user_groups ug ON g.id = ug.group_id 
           WHERE ug.user_id = p.id), 
          '[]'::json
        ) as groups
      FROM profiles p;
    `;
    return { data: users, error: null };
  } catch (error) {
    console.error('Database error fetching users with groups:', error);
    return { data: [], error };
  }
}

export async function getUsers() {
    try {
        const users = await sql`SELECT id, name, role FROM profiles`;
        return { data: users, error: null };
    } catch (error) {
        console.error('Database error fetching users:', error);
        return { data: [], error };
    }
}

// GROUP QUERIES
export async function getGroupsWithMemberCount() {
    try {
        const groups = await sql`
            SELECT g.id, g.name, COUNT(ug.user_id) as member_count 
            FROM groups g 
            LEFT JOIN user_groups ug ON g.id = ug.group_id 
            GROUP BY g.id, g.name;
        `;
        return { data: groups, error: null };
    } catch (error) {
        console.error('Database error fetching groups with member count:', error);
        return { data: [], error };
    }
}

export async function getGroups() {
    try {
        const groups = await sql`SELECT * FROM groups`;
        return { data: groups, error: null };
    } catch (error) {
        console.error('Database error fetching groups:', error);
        return { data: [], error };
    }
}

export async function getGroupWithMembers(groupId: string) {
    try {
        const groups = await sql`SELECT * FROM groups WHERE id = ${groupId}`;
        if (groups.length === 0) return { data: null, error: new Error('Group not found') };
        const group = groups[0];

        const members = await sql`SELECT user_id FROM user_groups WHERE group_id = ${groupId}`;
        const userIds = members.map((m: any) => m.user_id);
        
        return { data: { ...group, userIds }, error: null };
    } catch (error) {
        console.error('Database error fetching group with members:', error);
        return { data: null, error };
    }
}

export async function deleteGroup(groupId: string) {
    try {
        await sql`DELETE FROM groups WHERE id = ${groupId}`;
        return { error: null };
    } catch (error) {
        console.error('Database error deleting group:', error);
        return { error };
    }
}

export async function upsertGroup(groupData: { id?: string; name: string; userIds: string[] }) {
    const { id, name, userIds } = groupData;
    
    try {
        return await sql.begin(async sql => {
            let group;
            if (id) {
                const results = await sql`UPDATE groups SET name = ${name} WHERE id = ${id} RETURNING *`;
                group = results[0];
            } else {
                const results = await sql`INSERT INTO groups (name) VALUES (${name}) RETURNING *`;
                group = results[0];
            }

            await sql`DELETE FROM user_groups WHERE group_id = ${group.id}`;

            if (userIds && userIds.length > 0) {
                const relations = userIds.map(userId => ({ group_id: group.id, user_id: userId }));
                await sql`INSERT INTO user_groups ${sql(relations, 'group_id', 'user_id')}`;
            }
            
            return { error: null };
        });
    } catch (error) {
        console.error('Database error upserting group:', error);
        return { error };
    }
}

// TEST QUERIES
export async function getTests() {
    try {
        const tests = await sql`
            SELECT t.*, row_to_json(g) as groups
            FROM tests t
            LEFT JOIN groups g ON t.group_id = g.id;
        `;
        return { data: tests, error: null };
    } catch (error) {
        console.error('Database error fetching tests:', error);
        return { data: [], error };
    }
}


export async function deleteTest(testId: string) {
    try {
        await sql`DELETE FROM tests WHERE id = ${testId}`;
        return { error: null };
    } catch (error) {
        console.error('Database error deleting test:', error);
        return { error };
    }
}

export async function upsertTest(testData: Omit<Test, 'id' | 'groups'> & { id?: string }) {
    const { id, name, group_id, time_limit, question_count, date_time } = testData;

    try {
        if (id) {
            await sql`
                UPDATE tests 
                SET name = ${name}, group_id = ${group_id}, time_limit = ${time_limit}, question_count = ${question_count}, date_time = ${date_time}
                WHERE id = ${id}
            `;
        } else {
            await sql`
                INSERT INTO tests (name, group_id, time_limit, question_count, date_time)
                VALUES (${name}, ${group_id}, ${time_limit}, ${question_count}, ${date_time})
            `;
        }
        return { error: null };
    } catch (error) {
        console.error('Database error upserting test:', error);
        return { error };
    }
}
