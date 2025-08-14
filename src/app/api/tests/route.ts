
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Test } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { name, group_id, time_limit, question_count, date_time } = await request.json();

    if (!name || !group_id || !time_limit || !question_count || !date_time) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const testRef = await adminDb.collection('tests').add({
      name,
      group_id,
      time_limit,
      question_count,
      date_time: new Date(date_time).toISOString(),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ id: testRef.id, name, group_id, time_limit, question_count, date_time }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating test:', error);
    return NextResponse.json({ message: 'Failed to create test', error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const testsSnapshot = await adminDb.collection('tests').orderBy('date_time', 'desc').get();
    
    // Fetch all groups to map group_id to group name
    const groupsSnapshot = await adminDb.collection('groups').get();
    const groupsMap = new Map();
    groupsSnapshot.forEach(doc => {
      groupsMap.set(doc.id, doc.data());
    });
    
    const tests = testsSnapshot.docs.map(doc => {
      const data = doc.data() as Test;
      const group = groupsMap.get(data.group_id);
      return {
        ...data,
        id: doc.id,
        groups: group ? { name: group.name } : null,
      };
    });

    return NextResponse.json(tests);
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ message: 'Failed to fetch tests', error: error.message }, { status: 500 });
  }
}
