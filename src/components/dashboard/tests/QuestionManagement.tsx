
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Question, Test, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ArrowLeft, Loader2, CheckCircle, Edit } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionItem, type SaveStatus } from './QuestionItem';

export function QuestionManagement() {
  const router = useRouter();
  const params = useParams();
  const testId = typeof params.id === 'string' ? params.id : '';

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, SaveStatus>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  const fetchTestDetails = useCallback(async () => {
    if (!testId) return;
    try {
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
    if (!testId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tests/${testId}/questions`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch questions');
      setQuestions(data);
      const initialStatuses: Record<string, SaveStatus> = {};
      data.forEach((q: Question) => {
        initialStatuses[q.id] = 'saved';
      });
      setQuestionStatuses(initialStatuses);
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
    setQuestionStatuses(prev => ({ ...prev, [tempId]: 'saving' }));


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
      
      setQuestions(prev => prev.map(q => q.id === tempId ? savedQuestion : q));
      setQuestionStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[tempId];
        newStatuses[savedQuestion.id] = 'saved';
        return newStatuses;
      });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setQuestions(prev => prev.filter(q => q.id !== tempId));
      setQuestionStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[tempId];
        return newStatuses;
      });
    }
  };

  const handleQuestionStatusChange = (questionId: string, status: SaveStatus) => {
    setQuestionStatuses(prev => ({ ...prev, [questionId]: status }));
  };

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

  const globalSaveStatus = useMemo(() => {
    const statuses = Object.values(questionStatuses);
    if (statuses.some(s => s === 'saving')) return 'saving';
    if (statuses.some(s => s === 'dirty')) return 'dirty';
    if (statuses.every(s => s === 'saved')) return 'all_saved';
    return 'idle';
  }, [questionStatuses]);

  const renderGlobalStatus = () => {
    switch(globalSaveStatus) {
        case 'saving':
            return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/><span>Saving...</span></div>;
        case 'dirty':
            return <div className="flex items-center gap-2 text-muted-foreground"><Edit className="h-4 w-4"/><span>Unsaved changes</span></div>;
        case 'all_saved':
            if (questions.length > 0) {
               return <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4"/><span>All changes saved</span></div>;
            }
            return null;
        default:
            return <div className="h-6"></div>;
    }
  }

  const handleGoBack = () => {
    if (user?.role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/dashboard?view=tests');
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Manage Questions</h1>
                <div className="text-muted-foreground">For test: {test?.name || <Skeleton className="h-5 w-32 inline-block" />}</div>
            </div>
        </div>
        <div className="text-sm">
            {renderGlobalStatus()}
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
              onDelete={handleDeleteQuestion}
              onStatusChange={handleQuestionStatusChange}
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
