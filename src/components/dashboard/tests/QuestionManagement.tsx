
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
        // This endpoint doesn't exist, we will need to create it.
        // For now, let's just create a dummy test object.
        // In a real app, you would fetch from `/api/tests/${testId}`
        // and that endpoint would need to be created.
        setTest({ id: testId, name: 'Loading test...' } as Test)
    } catch(e) {
        console.log(e)
    }
  }, [testId]);

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
    // Create a temporary question for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newQuestion: Question = {
      id: tempId,
      text: 'New Question',
      options: [
        { id: '1', text: 'Option 1', isCorrect: true },
        { id: '2', text: 'Option 2', isCorrect: false },
      ],
    };

    // Optimistically update the UI
    setQuestions(prev => [...prev, newQuestion]);

    try {
      const response = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newQuestion.text,
          options: newQuestion.options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question.');
      }
      
      const savedQuestion = await response.json();
      
      // Replace temporary question with the one from the server
      setQuestions(prev => prev.map(q => q.id === tempId ? savedQuestion : q));
      toast({ title: 'Success', description: 'New question added.' });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      // Rollback: remove the temporary question if the API call fails
      setQuestions(prev => prev.filter(q => q.id !== tempId));
    }
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  }

  const handleDeleteQuestion = async (questionId: string) => {
    const originalQuestions = [...questions];
    const questionToDelete = originalQuestions.find(q => q.id === questionId);
    
    // Optimistically remove the question from the UI
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
      // Rollback: re-add the question if the API call fails
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
          <p className="text-muted-foreground">For test: {test?.name}</p>
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
