
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Question, Test } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionItem } from './QuestionItem';

interface QuestionManagementProps {
  testId: string;
}

export function QuestionManagement({ testId }: QuestionManagementProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchTestDetails = useCallback(async () => {
    try {
        // This endpoint doesn't exist yet, but we can fetch the test details
        // from the main tests endpoint and find the one with the matching id.
        const res = await fetch(`/api/tests`);
        const tests = await res.json();
        if (!res.ok) throw new Error(tests.message || 'Failed to fetch test details');
        const currentTest = tests.find((t: Test) => t.id === testId);
        setTest(currentTest || { id: testId, name: 'Test not found' } as Test)
    } catch(e: any) {
        console.error(e);
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
        setTest({ id: testId, name: 'Error loading name' } as Test);
    }
  }, [testId, toast]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tests/${testId}/questions`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch questions');
      setQuestions(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [testId, toast]);

  useEffect(() => {
    fetchTestDetails();
    fetchQuestions();
  }, [fetchTestDetails, fetchQuestions]);
  
 const handleAddQuestion = async () => {
    const tempId = `temp-${Date.now()}`;
    const newQuestionData = {
      text: 'New Question',
      options: [
        { id: `${Date.now()}-1`, text: 'Option 1', isCorrect: true },
        { id: `${Date.now()}-2`, text: 'Option 2', isCorrect: false },
      ],
    };

    const optimisticQuestion: Question = {
        id: tempId,
        ...newQuestionData,
    };

    setQuestions(prev => [...prev, optimisticQuestion]);

    try {
      const response = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question.');
      }
      
      const savedQuestion = await response.json();
      
      setQuestions(prev => prev.map(q => q.id === tempId ? { ...savedQuestion, text: newQuestionData.text, options: newQuestionData.options } : q));
      toast({ title: 'Success', description: 'New question added.' });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setQuestions(prev => prev.filter(q => q.id !== tempId));
    }
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  }

  const handleDeleteQuestion = async (questionId: string) => {
    const originalQuestions = [...questions];
    
    setQuestions(prev => prev.filter(q => q.id !== questionId));

    try {
      const response = await fetch(`/api/tests/${testId}/questions/${questionId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete question');
      }
      toast({ title: 'Success', description: 'Question deleted successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setQuestions(originalQuestions);
    }
  };


  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard?view=tests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Manage Questions</h1>
          <div className="text-muted-foreground">For test: {test?.name || <Skeleton className="h-5 w-32 inline-block" />}</div>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : (
          questions.map((q, index) => (
            <QuestionItem 
              key={q.id}
              testId={testId}
              question={q}
              questionNumber={index + 1}
              onUpdate={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
            />
          ))
        )}

        {questions.length === 0 && !loading && (
             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No questions yet.</p>
                <p>Click "Add New Question" to get started.</p>
            </div>
        )}

        <div className="flex justify-center">
             <Button onClick={handleAddQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Question
            </Button>
        </div>
      </div>
    </>
  );
}
