
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Test } from '@/lib/types';
import admin from 'firebase-admin';

export const runtime = 'nodejs';

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
      date_time: new Date(date_time),
      created_at: new Date(),
    });

    const newTest = await testRef.get();
    const testData = newTest.data() as Test;


    return NextResponse.json({ 
        id: testRef.id, 
        ...testData,
        date_time: (testData.date_time as any).toDate().toISOString()
    }, { status: 201 });
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
      const data = doc.data();
      const group = groupsMap.get(data.group_id);
      
      // Handle both Timestamp and string dates
      let isoDateTime;
      if (data.date_time?.toDate) { // It's a Firestore Timestamp
        isoDateTime = data.date_time.toDate().toISOString();
      } else if (typeof data.date_time === 'string') { // It's already a string
        isoDateTime = data.date_time;
      } else { // Fallback for other cases
        isoDateTime = new Date().toISOString();
      }

      return {
        ...data,
        id: doc.id,
        date_time: isoDateTime,
        groups: group ? { name: group.name } : null,
      };
    });

    return NextResponse.json(tests);
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ message: 'Failed to fetch tests', error: error.message }, { status: 500 });
  }
}
