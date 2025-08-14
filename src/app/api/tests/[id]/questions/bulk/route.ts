
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Question } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const testId = params.id;
  try {
    const body = await request.json();
    const questions: Partial<Question>[] = body.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: 'Missing or invalid questions array' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const questionsCollection = adminDb.collection('tests').doc(testId).collection('questions');

    let successCount = 0;
    
    for (const q of questions) {
        if (!q.text || !q.options || q.correctOptionIndex === undefined) {
            console.warn('Skipping invalid question object:', q);
            continue;
        }

        const newQuestionRef = questionsCollection.doc();
        const newQuestionData: Omit<Question, 'id'> = {
            text: q.text,
            options: q.options.map(opt => ({ ...opt, id: uuidv4() })),
            correctOptionIndex: q.correctOptionIndex,
        };

        batch.set(newQuestionRef, {
            ...newQuestionData,
            created_at: new Date().toISOString(),
        });
        successCount++;
    }
    
    await batch.commit();

    // Update question_count in the parent test document
    const testRef = adminDb.collection('tests').doc(testId);
    await adminDb.runTransaction(async (transaction) => {
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists) {
            throw new Error("Test not found");
        }
        const newCount = (testDoc.data()?.question_count || 0) + successCount;
        transaction.update(testRef, { question_count: newCount });
    });

    return NextResponse.json({
        message: 'Bulk questions import completed.',
        successCount,
    }, { status: 201 });

  } catch (error: any) {
    console.error(`Error during bulk question import for test ${testId}:`, error);
    return NextResponse.json({ message: 'Failed to process bulk import', error: error.message }, { status: 500 });
  }
}
