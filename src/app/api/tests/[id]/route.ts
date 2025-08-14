
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { name, group_id, time_limit, question_count, date_time } = await request.json();
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || !name || !group_id || !time_limit || !question_count || !date_time) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userRole = userDoc.data()?.role;

    const testRef = adminDb.collection('tests').doc(id);
    const testDoc = await testRef.get();

    if (!testDoc.exists) {
        return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    if (userRole !== 'admin' && testDoc.data()?.test_maker !== decodedToken.uid) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await testRef.update({
        name,
        group_id,
        time_limit,
        question_count,
        date_time,
    });

    return NextResponse.json({ message: 'Test updated successfully' });
  } catch (error: any) {
    console.error(`Error updating test ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update test', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
     const sessionCookie = request.cookies.get('session')?.value;
     if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
     const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
     const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
     const userRole = userDoc.data()?.role;

    if (!id) {
        return NextResponse.json({ message: 'Test ID is required' }, { status: 400 });
    }

    const testRef = adminDb.collection('tests').doc(id);
    const testDoc = await testRef.get();

    if (!testDoc.exists) {
        return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    
    if (userRole !== 'admin' && testDoc.data()?.test_maker !== decodedToken.uid) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    await adminDb.collection('tests').doc(id).delete();

    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting test ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete test', error: error.message }, { status: 500 });
  }
}
