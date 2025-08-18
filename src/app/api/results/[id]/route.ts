
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { TestSession } from '@/lib/types';
import admin from 'firebase-admin';

export const runtime = 'nodejs';

// GET test sessions for a specific test
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const testId = params.id;
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Permission check: only admin or the test maker can view results
    const testDoc = await adminDb.collection('tests').doc(testId).get();
    if (!testDoc.exists) {
        return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    const testData = testDoc.data();
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userRole = userDoc.data()?.role;

    if (userRole !== 'admin' && testData?.test_maker !== decodedToken.uid) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch sessions
    const sessionsSnapshot = await adminDb.collection('test_sessions').where('test_id', '==', testId).get();
    if (sessionsSnapshot.empty) {
        return NextResponse.json({ test: {id: testDoc.id, ...testData}, sessions: [] });
    }

    const studentIds = sessionsSnapshot.docs.map(doc => doc.data().student_id);

    // Fetch student names from the 'users' collection
    const usersSnapshot = await adminDb.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', studentIds).get();
    const studentNames = new Map<string, string>();
    usersSnapshot.forEach(doc => {
        studentNames.set(doc.id, doc.data().name);
    });

    const sessions: TestSession[] = sessionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            test_id: data.test_id,
            student_id: data.student_id,
            student_name: studentNames.get(data.student_id) || 'Unknown Student',
            start_time: data.start_time?.toDate ? data.start_time.toDate().toISOString() : data.start_time,
            end_time: data.end_time?.toDate ? data.end_time.toDate().toISOString() : data.end_time,
            final_score: data.final_score,
            status: data.status,
            answers: data.answers
        };
    });

    return NextResponse.json({ test: {id: testDoc.id, ...testData}, sessions });

  } catch (error: any) {
    console.error(`Error fetching results for test ${testId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch results', error: error.message }, { status: 500 });
  }
}

// POST to reset (delete) test sessions
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const testId = params.id;
  try {
     const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    const { sessionIdsToDelete }: { sessionIdsToDelete: string[] } = await request.json();

    if (!Array.isArray(sessionIdsToDelete) || sessionIdsToDelete.length === 0) {
        return NextResponse.json({ message: 'Session IDs must be a non-empty array' }, { status: 400 });
    }
    
    // Permission check
    const testDoc = await adminDb.collection('tests').doc(testId).get();
    if (!testDoc.exists) {
        return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (userDoc.data()?.role !== 'admin' && testDoc.data()?.test_maker !== decodedToken.uid) {
         return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const batch = adminDb.batch();
    sessionIdsToDelete.forEach(sessionId => {
        const sessionRef = adminDb.collection('test_sessions').doc(sessionId);
        batch.delete(sessionRef);
    });
    
    await batch.commit();
    
    return NextResponse.json({ message: 'Selected test sessions have been reset.' });

  } catch (error: any) {
    console.error(`Error resetting sessions for test ${testId}:`, error);
    return NextResponse.json({ message: 'Failed to reset sessions', error: error.message }, { status: 500 });
  }
}
