"use server";

import sql from '@/lib/db';
import type { Test, Group } from "@/lib/types";
import { unstable_noStore as noStore } from 'next/cache';

// NOTE: All data fetching is now done via the Next.js API routes,
// but these server-side query functions are kept here as they can
// be used directly by Server Components if needed in the future.
// The API routes themselves use the `sql` template tag directly.

// USER QUERIES
export async function getUsersWithGroups() {
  noStore();
  return sql`
    SELECT p.id, p.name, p.email, p.role, 
           COALESCE(json_agg(json_build_object('name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]') as groups
    FROM profiles p
    LEFT JOIN user_groups ug ON p.id = ug.user_id
    LEFT JOIN groups g ON ug.group_id = g.id
    GROUP BY p.id
  `;
}

export async function getUsers() {
    noStore();
    return sql`SELECT id, name, role FROM profiles`;
}

export async function getProfileByUserId(userId: string) {
    noStore();
    const [profile] = await sql`SELECT id, name, email, role FROM profiles WHERE id = ${userId}`;
    return profile;
}

// GROUP QUERIES
export async function getGroupsWithMemberCount() {
    noStore();
    return sql`
        SELECT 
            g.id, 
            g.name, 
            CAST(COUNT(ug.user_id) AS INTEGER) as member_count 
        FROM groups g 
        LEFT JOIN user_groups ug ON g.id = ug.group_id 
        GROUP BY g.id, g.name
    `;
}

export async function getGroups() {
    noStore();
    return sql`SELECT * FROM groups`;
}

export async function getGroupWithMembers(groupId: string) {
    noStore();
    const [group] = await sql`SELECT * FROM groups WHERE id = ${groupId}`;
    if (!group) return null;

    const members = await sql`SELECT user_id FROM user_groups WHERE group_id = ${groupId}`;
    const userIds = members.map((m: any) => m.user_id);
    
    return { ...group, userIds };
}

export async function deleteGroup(groupId: string) {
    noStore();
    await sql.begin(async sql => {
        await sql`DELETE FROM user_groups WHERE group_id = ${groupId}`;
        await sql`DELETE FROM tests WHERE group_id = ${groupId}`;
        await sql`DELETE FROM groups WHERE id = ${groupId}`;
    });
    return { error: null };
}

export async function upsertGroup(groupData: { id?: string; name: string; userIds: string[] }) {
    noStore();
    const { id, name, userIds } = groupData;
    
    await sql.begin(async (sql) => {
        let groupId = id;
        if (id) {
            await sql`UPDATE groups SET name = ${name} WHERE id = ${id}`;
        } else {
            const [newGroup] = await sql`INSERT INTO groups (name) VALUES (${name}) RETURNING id`;
            groupId = newGroup.id;
        }

        await sql`DELETE FROM user_groups WHERE group_id = ${groupId}`;

        if (userIds && userIds.length > 0) {
            const relations = userIds.map(userId => ({ group_id: groupId, user_id: userId }));
            await sql`INSERT INTO user_groups ${sql(relations, 'group_id', 'user_id')}`;
        }
    });
    return { error: null };
}

// TEST QUERIES
export async function getTests() {
    noStore();
    return sql`
        SELECT t.*, row_to_json(g.*) as groups 
        FROM tests t 
        LEFT JOIN groups g ON t.group_id = g.id
    `;
}

export async function deleteTest(testId: string) {
    noStore();
    await sql`DELETE FROM tests WHERE id = ${testId}`;
    return { error: null };
}

export async function upsertTest(testData: Omit<Test, 'id' | 'groups'> & { id?: string }) {
    noStore();
    const { id, name, group_id, time_limit, question_count, date_time } = testData;
    const isoDateTime = new Date(date_time).toISOString();

    if (id) {
        await sql`UPDATE tests SET name = ${name}, group_id = ${group_id}, time_limit = ${time_limit}, question_count = ${question_count}, date_time = ${isoDateTime} WHERE id = ${id}`;
    } else {
        await sql`INSERT INTO tests (name, group_id, time_limit, question_count, date_time) VALUES (${name}, ${group_id}, ${time_limit}, ${question_count}, ${isoDateTime})`;
    }
    return { error: null };
}
