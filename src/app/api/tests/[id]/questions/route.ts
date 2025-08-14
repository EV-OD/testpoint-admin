
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Question } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const testId = params.id;
  try {
    const questionData: Omit<Question, 'id'> = await request.json();

    if (!questionData.text || !Array.isArray(questionData.options) || questionData.correctOptionIndex === undefined) {
      return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }
    
    if (questionData.options.length > 0) {
        if (questionData.correctOptionIndex < 0 || questionData.correctOptionIndex >= questionData.options.length) {
            return NextResponse.json({ message: 'Correct option index is out of bounds.' }, { status: 400 });
        }
    }


    const questionRef = await adminDb.collection('tests').doc(testId).collection('questions').add({
      ...questionData,
      created_at: new Date().toISOString(),
    });

    // Also update question_count in the parent test document
    const testRef = adminDb.collection('tests').doc(testId);
    await adminDb.runTransaction(async (transaction) => {
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists) {
            throw new Error("Test not found");
        }
        const newCount = (testDoc.data()?.question_count || 0) + 1;
        transaction.update(testRef, { question_count: newCount });
    });

    const newQuestion = { id: questionRef.id, ...questionData };

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating question for test ${testId}:`, error);
    return NextResponse.json({ message: 'Failed to create question', error: error.message }, { status: 500 });
  }
}


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const testId = params.id;
  try {
    const questionsSnapshot = await adminDb.collection('tests').doc(testId).collection('questions').orderBy('created_at').get();
    const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    return NextResponse.json(questions);
  } catch (error: any) {
    console.error(`Error fetching questions for test ${testId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch questions', error: error.message }, { status: 500 });
  }
}
