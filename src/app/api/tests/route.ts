
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { Test } from '@/lib/types';
import admin from 'firebase-admin';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { name, group_id, time_limit, date_time } = await request.json();
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !group_id || !time_limit || !date_time) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const test_maker = decodedToken.uid;


    const testRef = await adminDb.collection('tests').add({
      name,
      group_id,
      time_limit,
      question_count: 0,
      test_maker,
      date_time: new Date(date_time),
      created_at: new Date(),
      status: 'draft', // New tests are always drafts
    });

    const newTest = await testRef.get();
    const testData = newTest.data() as Test;


    return NextResponse.json({ 
        id: testRef.id, 
        ...testData,
        date_time: (testData.date_time as any).toDate().toISOString(),
        question_count: 0,
        status: 'draft',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating test:', error);
    return NextResponse.json({ message: 'Failed to create test', error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userRole = userDoc.data()?.role;

    const testsSnapshot = await adminDb.collection('tests').get();
    
    const groupsSnapshot = await adminDb.collection('groups').get();
    const groupsMap = new Map();
    groupsSnapshot.forEach(doc => {
      groupsMap.set(doc.id, doc.data());
    });
    
    let allTests = testsSnapshot.docs.map(doc => {
      const data = doc.data();
      const group = groupsMap.get(data.group_id);
      
      let isoDateTime;
      if (data.date_time?.toDate) {
        isoDateTime = data.date_time.toDate().toISOString();
      } else if (typeof data.date_time === 'string') {
        isoDateTime = data.date_time;
      } else {
        isoDateTime = new Date().toISOString();
      }

      return {
        ...data,
        id: doc.id,
        date_time: isoDateTime,
        groups: group ? { name: group.name } : null,
      };
    });

    // Filter by role in code
    if (userRole === 'teacher') {
        // A teacher can see tests they created OR tests assigned to groups they are a part of.
        const teacherGroupIds: string[] = [];
        groupsSnapshot.forEach(doc => {
            const groupData = doc.data();
            if (Array.isArray(groupData.userIds) && groupData.userIds.includes(decodedToken.uid)) {
                teacherGroupIds.push(doc.id);
            }
        });

        allTests = allTests.filter(test => 
            test.test_maker === decodedToken.uid || teacherGroupIds.includes(test.group_id)
        );
    }
    
    // Sort in code
    allTests.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

    return NextResponse.json(allTests);
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ message: 'Failed to fetch tests', error: error.message }, { status: 500 });
  }
}
