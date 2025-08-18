
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    const testRef = adminDb.collection('tests').doc(id);
    const testDoc = await testRef.get();

    if (!testDoc.exists) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    const testData = testDoc.data();
    if (testData?.test_maker !== decodedToken.uid) {
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userDoc.data()?.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
    }

    if (testData?.status !== 'published' && testData?.status !== 'ongoing') {
      return NextResponse.json({ message: 'Only ongoing tests can be ended.' }, { status: 400 });
    }

    await testRef.update({
      status: 'completed',
      date_time: new Date(),
    });

    return NextResponse.json({ message: 'Test ended successfully' });
  } catch (error: any) {
    console.error(`Error ending test ${id}:`, error);
    return NextResponse.json({ message: 'Failed to end test', error: error.message }, { status: 500 });
  }
}
