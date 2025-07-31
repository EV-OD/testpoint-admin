
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Question, Test } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Trash2, ArrowLeft, Radio, CheckCircle } from 'lucide-react';
import { QuestionForm } from './QuestionForm';
import { useRouter } from 'next/navigation';

interface QuestionManagementProps {
  testId: string;
}

export function QuestionManagement({ testId }: QuestionManagementProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchTestDetails = useCallback(async () => {
    // This assumes you have an API route to fetch a single test's details
    // You might need to create this if it doesn't exist.
    // For now, we'll just use a placeholder.
    // In a real app:
    // const response = await fetch(`/api/tests/${testId}`);
    // const data = await response.json();
    // setTest(data);
    // For now:
    setTest({ id: testId, name: 'Loading test...' } as Test);
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

  const handleSaveQuestion = async (questionData: Omit<Question, 'id'>) => {
    try {
      const response = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question.');
      }
      toast({ title: 'Success', description: 'Question created successfully.' });
      setIsFormOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleDelete = async (questionId: string) => {
    try {
        const response = await fetch(`/api/tests/${testId}/questions/${questionId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete question');
        }
        toast({ title: 'Success', description: 'Question deleted successfully.' });
        fetchQuestions();
     } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
     }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold">Manage Questions</h1>
            <p className="text-muted-foreground">For test: {test?.name}</p>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Question Bank</CardTitle>
            <CardDescription>Add, view, and manage questions for this test.</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Question
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No questions yet.</p>
                <p>Click "Add New Question" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, index) => (
                <Card key={q.id}>
                  <CardHeader className='flex-row justify-between items-start'>
                    <div className='flex-1'>
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                      <CardDescription className="pt-2 text-base text-foreground">{q.text}</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this question and its options.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleDelete(q.id)}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {q.options.map(opt => (
                        <li key={opt.id} className="flex items-center text-sm">
                          {opt.isCorrect ? (
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <Radio className="h-4 w-4 mr-2 text-muted-foreground" />
                          )}
                          <span>{opt.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {isFormOpen && (
        <QuestionForm onSave={handleSaveQuestion} onClose={() => setIsFormOpen(false)} />
      )}
    </>
  );
}
