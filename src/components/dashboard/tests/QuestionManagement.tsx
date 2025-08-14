
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Question, Test, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ArrowLeft, Loader2, CheckCircle, Edit, Upload, X, FileWarning } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionItem } from './QuestionItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

type CsvQuestion = {
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOptionIndex: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'dirty' | 'error';

// Simple debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}


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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingQuestions, setImportingQuestions] = useState<Partial<Question>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const debouncedSaves = useRef<Record<string, (question: Question) => void>>({});

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

  const fetchQuestions = useCallback(async (isInitial = false) => {
    if (!testId) return;
    if (isInitial) setLoading(true);
    try {
      const response = await fetch(`/api/tests/${testId}/questions`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch questions');
      setQuestions(data);
      if (isInitial) {
        const initialStatuses: Record<string, SaveStatus> = {};
        data.forEach((q: Question) => {
            initialStatuses[q.id] = 'saved';
        });
        setQuestionStatuses(initialStatuses);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [testId, toast]);

  useEffect(() => {
    fetchTestDetails();
    fetchQuestions(true);
  }, [fetchTestDetails, fetchQuestions]);
  
  const handleAddQuestion = async () => {
    const tempId = `temp-${Date.now()}`;
    const newQuestionData: Omit<Question, 'id'> = {
      text: 'New Question',
      options: [
        { id: uuidv4(), text: 'Option 1' },
        { id: uuidv4(), text: 'Option 2' },
      ],
      correctOptionIndex: 0
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
      await fetchTestDetails();

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


 const handleQuestionChange = useCallback((questionId: string, updatedData: Partial<Question>) => {
    setQuestions(prevQuestions => {
      const newQuestions = prevQuestions.map(q => 
        q.id === questionId ? { ...q, ...updatedData } : q
      );

      const changedQuestion = newQuestions.find(q => q.id === questionId);
      
      if (changedQuestion) {
        if (!debouncedSaves.current[questionId]) {
          debouncedSaves.current[questionId] = debounce(async (questionToSave: Question) => {
            try {
              const response = await fetch(`/api/tests/${testId}/questions/${questionToSave.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: questionToSave.text,
                  options: questionToSave.options.map(o => ({...o, id: o.id.startsWith('temp') ? uuidv4() : o.id })),
                  correctOptionIndex: questionToSave.correctOptionIndex,
                }),
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save changes.');
              }
              setQuestionStatuses(prev => ({ ...prev, [questionId]: 'saved' }));
            } catch (error: any) {
              toast({ title: 'Error', description: `Could not save question: ${error.message}`, variant: 'destructive' });
              setQuestionStatuses(prev => ({ ...prev, [questionId]: 'error' }));
            }
          }, 1500);
        }
        
        setQuestionStatuses(prev => ({ ...prev, [questionId]: 'dirty' }));
        debouncedSaves.current[questionId](changedQuestion);
      }
      
      return newQuestions;
    });
  }, [testId, toast]);


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
      await fetchTestDetails();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setQuestions(originalQuestions);
    }
  };

  const globalSaveStatus = useMemo(() => {
    const statuses = Object.values(questionStatuses);
    if (statuses.some(s => s === 'saving')) return 'saving';
    if (statuses.some(s => s === 'dirty')) return 'dirty';
    if (statuses.some(s => s === 'error')) return 'error';
    if (statuses.every(s => s === 'saved')) return 'all_saved';
    return 'idle';
  }, [questionStatuses]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportError(null);
      Papa.parse<CsvQuestion>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const requiredHeaders = ['text', 'option1', 'option2', 'correctOptionIndex'];
          const headers = result.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            setImportError(`Missing required CSV columns: ${missingHeaders.join(', ')}`);
            setImportingQuestions([]);
            return;
          }
          
          const parsedQuestions = result.data.map(row => {
            const options = [row.option1, row.option2, row.option3, row.option4]
                .filter(o => o)
                .map((o) => ({ id: `import-opt-${uuidv4()}`, text: o }));

            return {
                text: row.text,
                options,
                correctOptionIndex: parseInt(row.correctOptionIndex, 10) - 1 // CSV is 1-based, our index is 0-based
            }
          });
          setImportingQuestions(parsedQuestions);
        },
        error: (error) => {
            setImportError(`CSV parsing error: ${error.message}`);
            setImportingQuestions([]);
        }
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importingQuestions.length) return;
    setIsImporting(true);

    try {
        const response = await fetch(`/api/tests/${testId}/questions/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({questions: importingQuestions}),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Bulk import failed');
        }

        toast({
            title: 'Import Complete',
            description: `${result.successCount} questions imported successfully.`
        });

        setIsImportModalOpen(false);
        setImportingQuestions([]);
        await fetchQuestions();
        await fetchTestDetails();
    } catch (error: any) {
        toast({ title: 'Import Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsImporting(false);
    }
  };


  const renderGlobalStatus = () => {
    switch(globalSaveStatus) {
        case 'saving':
            return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/><span>Saving changes...</span></div>;
        case 'dirty':
            return <div className="flex items-center gap-2 text-blue-600"><Edit className="h-4 w-4"/><span>Saving...</span></div>;
        case 'error':
            return <div className="flex items-center gap-2 text-destructive"><FileWarning className="h-4 w-4"/><span>Some changes failed to save.</span></div>;
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
                <h1 className="text-2xl font-bold">Manage Questions ({test?.question_count || 0})</h1>
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
              question={q}
              questionNumber={index + 1}
              onDelete={handleDeleteQuestion}
              onQuestionChange={handleQuestionChange}
              saveStatus={questionStatuses[q.id] || 'idle'}
            />
          ))
        )}

        {questions.length === 0 && !loading && (
             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No questions yet.</p>
                <p>Click "Add New Question" or "Import from CSV" to get started.</p>
            </div>
        )}

        <div className="flex justify-center gap-4">
             <Button onClick={handleAddQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Question
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV
            </Button>
        </div>
      </div>
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
            <DialogTitle>Import Questions from CSV</DialogTitle>
            <DialogDescription>
                Select a CSV file to bulk-import questions. The file must contain columns: `text`, `option1`, `option2`, `option3`, `option4`, and `correctOptionIndex` (1-based).
                <Button asChild variant="link" className="p-0 h-auto ml-1">
                  <a href="/sample-questions.csv" download>Download sample CSV</a>
                </Button>
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {importError && (
                    <p className="text-sm text-destructive">{importError}</p>
                )}
                {importingQuestions.length > 0 && (
                    <>
                        <h4 className="font-medium">Questions to Import ({importingQuestions.length})</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Text</TableHead>
                                        <TableHead>Options</TableHead>
                                        <TableHead>Correct</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {importingQuestions.map((q, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="max-w-xs truncate">{q.text}</TableCell>
                                            <TableCell>{q.options?.length}</TableCell>
                                            <TableCell>{(q.correctOptionIndex ?? 0) + 1}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmImport} disabled={isImporting || importingQuestions.length === 0 || !!importError}>
                    {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import {importingQuestions.length > 0 ? `${importingQuestions.length} Questions` : ''}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
