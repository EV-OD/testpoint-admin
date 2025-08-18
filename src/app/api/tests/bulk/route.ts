
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

    const errors: { id: string; reason: string }[] = [];
    let successCount = 0;

    for (const testId of testIds) {
        const testRef = adminDb.collection('tests').doc(testId);
        try {
            await adminDb.runTransaction(async (transaction) => {
                const testDoc = await transaction.get(testRef);

                if (!testDoc.exists) {
                    throw new Error('Test not found.');
                }
                
                const testData = testDoc.data();

                // Permission check: admin or owner
                if (userRole !== 'admin' && testData?.test_maker !== decodedToken.uid) {
                    throw new Error('Forbidden');
                }
                
                switch (action) {
                    case 'publish':
                        if (testData?.status === 'draft') {
                            if (testData?.question_count > 0) {
                                transaction.update(testRef, { status: 'published' });
                            } else {
                                throw new Error('Test must have at least one question to be published.');
                            }
                        } else {
                            throw new Error('Only draft tests can be published.');
                        }
                        break;
                    
                    case 'revert_to_draft':
                        if (testData?.status === 'published' || testData?.status === 'ongoing' || testData?.status === 'completed') {
                           transaction.update(testRef, { status: 'draft' });
                           // Also delete all test sessions for this test
                           const sessionsSnapshot = await adminDb.collection('test_sessions').where('test_id', '==', testId).get();
                           if (!sessionsSnapshot.empty) {
                               sessionsSnapshot.docs.forEach(doc => {
                                   transaction.delete(doc.ref);
                               });
                           }
                        } else {
                            throw new Error('Only published, ongoing, or completed tests can be reverted to draft.');
                        }
                        break;

                    case 'delete':
                        if (testData?.status === 'draft') {
                           transaction.delete(testRef);
                        } else {
                            throw new Error('Only draft tests can be deleted.');
                        }
                        break;
                    
                    default:
                        throw new Error('Invalid action specified.');
                }
            });
            successCount++;
        } catch (e: any) {
            errors.push({ id: testId, reason: e.message || 'An unknown error occurred.' });
        }
    }

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
