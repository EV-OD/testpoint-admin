import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Question } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const testId = params.id;
  try {
    const questionData: Omit<Question, 'id'> = await request.json();

    if (!questionData.text || !Array.isArray(questionData.options)) {
      return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }
    
    // Ensure one option is correct if options are provided
    if (questionData.options.length > 0) {
        const hasCorrectOption = questionData.options.some(opt => opt.isCorrect);
        if (!hasCorrectOption && questionData.options.some(opt => opt.text)) {
            // If there are options with text, one must be correct
             return NextResponse.json({ message: 'One option must be marked as correct.' }, { status: 400 });
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
