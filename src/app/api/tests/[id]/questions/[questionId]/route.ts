
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Question } from '@/lib/types';

export async function PUT(request: Request, { params }: { params: { id: string, questionId: string } }) {
    const { id: testId, questionId } = params;
    try {
        const questionData: Partial<Question> = await request.json();

        if (!questionData) {
            return NextResponse.json({ message: 'Missing question data' }, { status: 400 });
        }

        await adminDb.collection('tests').doc(testId).collection('questions').doc(questionId).update(questionData);

        return NextResponse.json({ message: 'Question updated successfully' });
    } catch (error: any) {
        console.error(`Error updating question ${questionId} for test ${testId}:`, error);
        return NextResponse.json({ message: 'Failed to update question', error: error.message }, { status: 500 });
    }
}


export async function DELETE(request: Request, { params }: { params: { id: string, questionId: string } }) {
  const { id: testId, questionId } = params;
  try {
    if (!testId || !questionId) {
        return NextResponse.json({ message: 'Test ID and Question ID are required' }, { status: 400 });
    }
    
    await adminDb.collection('tests').doc(testId).collection('questions').doc(questionId).delete();

    // Also update question_count in the parent test document
    const testRef = adminDb.collection('tests').doc(testId);
    await adminDb.runTransaction(async (transaction) => {
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists) {
            // Test might have been deleted, which is okay.
            return;
        }
        const currentCount = testDoc.data()?.question_count || 0;
        const newCount = Math.max(0, currentCount - 1);
        transaction.update(testRef, { question_count: newCount });
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting question ${questionId} from test ${testId}:`, error);
    return NextResponse.json({ message: 'Failed to delete question', error: error.message }, { status: 500 });
  }
}
