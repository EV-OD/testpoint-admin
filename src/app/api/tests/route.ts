
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { Test } from '@/lib/types';
import admin from 'firebase-admin';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { name, group_id, time_limit, question_count, date_time } = await request.json();
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !group_id || !time_limit || !question_count || !date_time) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const test_maker = decodedToken.uid;


    const testRef = await adminDb.collection('tests').add({
      name,
      group_id,
      time_limit,
      question_count,
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

    let testsQuery = adminDb.collection('tests').orderBy('date_time', 'desc');

    if (userRole === 'teacher') {
        testsQuery = testsQuery.where('test_maker', '==', decodedToken.uid);
    }
    
    const testsSnapshot = await testsQuery.get();
    
    const groupsSnapshot = await adminDb.collection('groups').get();
    const groupsMap = new Map();
    groupsSnapshot.forEach(doc => {
      groupsMap.set(doc.id, doc.data());
    });
    
    const tests = testsSnapshot.docs.map(doc => {
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

    return NextResponse.json(tests);
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ message: 'Failed to fetch tests', error: error.message }, { status: 500 });
  }
}
