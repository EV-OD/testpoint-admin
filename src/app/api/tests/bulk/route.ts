
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type BulkTestAction = 'publish' | 'revert_to_draft' | 'delete';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userRole = userDoc.data()?.role;

    const { testIds, action }: { testIds: string[]; action: BulkTestAction } = await request.json();

    if (!Array.isArray(testIds) || testIds.length === 0 || !action) {
      return NextResponse.json({ message: 'Missing required fields: testIds and action' }, { status: 400 });
    }

    const batch = adminDb.batch();
    let successCount = 0;
    const errors: { id: string; reason: string }[] = [];

    for (const testId of testIds) {
      const testRef = adminDb.collection('tests').doc(testId);
      const testDoc = await testRef.get();

      if (!testDoc.exists) {
        errors.push({ id: testId, reason: 'Test not found.' });
        continue;
      }
      
      const testData = testDoc.data();

      // Permission check: admin or owner
      if (userRole !== 'admin' && testData?.test_maker !== decodedToken.uid) {
          errors.push({ id: testId, reason: 'Forbidden' });
          continue;
      }
      
      try {
        switch (action) {
          case 'publish':
            if (testData?.status === 'draft') {
              if (testData?.question_count > 0) {
                 batch.update(testRef, { status: 'published' });
                 successCount++;
              } else {
                 errors.push({ id: testId, reason: 'Test must have at least one question to be published.' });
              }
            } else {
               errors.push({ id: testId, reason: 'Only draft tests can be published.' });
            }
            break;
            
          case 'revert_to_draft':
            if (testData?.status === 'published') {
               batch.update(testRef, { status: 'draft' });
               successCount++;
            } else {
                errors.push({ id: testId, reason: 'Only published tests can be reverted to draft.' });
            }
            break;

          case 'delete':
            if (testData?.status === 'draft') {
               batch.delete(testRef);
               successCount++;
            } else {
                errors.push({ id: testId, reason: 'Only draft tests can be deleted.' });
            }
            break;
            
          default:
            errors.push({ id: testId, reason: 'Invalid action specified.' });
        }
      } catch (e: any) {
         errors.push({ id: testId, reason: e.message || 'An unknown error occurred.' });
      }
    }

    await batch.commit();

    return NextResponse.json({
      message: 'Bulk action completed.',
      successCount,
      errorCount: errors.length,
      errors,
    });

  } catch (error: any) {
    console.error('Error during bulk test action:', error);
    return NextResponse.json({ message: 'Failed to process bulk action', error: error.message }, { status: 500 });
  }
}
