
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, X, Trash2, Loader2, CheckCircle, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';


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


export type SaveStatus = 'idle' | 'saving' | 'saved' | 'dirty';
interface QuestionItemProps {
  testId: string;
  question: Question;
  questionNumber: number;
  onDelete: (questionId: string) => void;
  onStatusChange: (questionId: string, status: SaveStatus) => void;
}

export function QuestionItem({ testId, question, questionNumber, onDelete, onStatusChange }: QuestionItemProps) {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const { toast } = useToast();

   const updateStatus = (status: SaveStatus) => {
    setSaveStatus(status);
    onStatusChange(question.id, status);
  };

  const debouncedSave = useMemo(
    () =>
      debounce(async (updatedQuestion: Question) => {
        updateStatus('saving');
        try {
          const response = await fetch(`/api/tests/${testId}/questions/${updatedQuestion.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: updatedQuestion.text,
              options: updatedQuestion.options,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save changes.');
          }
          updateStatus('saved');
        } catch (error: any) {
          toast({ title: 'Error', description: `Could not save question: ${error.message}`, variant: 'destructive' });
          updateStatus('dirty'); // Revert to dirty on error
        }
      }, 1500),
    [testId, toast, onStatusChange, question.id]
  );

  useEffect(() => {
    // Only update local state if the incoming question is truly different
    // This check is important to prevent overwriting user input, especially during initial hydration
    if (JSON.stringify(localQuestion) !== JSON.stringify(question)) {
       setLocalQuestion(question);
       // When props change, we assume it's saved unless told otherwise.
       updateStatus('saved');
    }
  }, [question]);

  const handleLocalChange = (newQuestion: Question) => {
    setLocalQuestion(newQuestion);
    updateStatus('dirty');
    debouncedSave(newQuestion);
  };
  
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleLocalChange({ ...localQuestion, text: e.target.value });
  };
  
  const handleOptionTextChange = (optionId: string, text: string) => {
    const newOptions = localQuestion.options.map(opt => (opt.id === optionId ? { ...opt, text } : opt));
    handleLocalChange({ ...localQuestion, options: newOptions });
  };
  
  const handleCorrectOptionChange = (correctOptionId: string) => {
    const newOptions = localQuestion.options.map(opt => ({ ...opt, isCorrect: opt.id === correctOptionId }));
    handleLocalChange({ ...localQuestion, options: newOptions });
  };
  
  const handleAddOption = () => {
    const newOption: Option = {
      id: `temp-${Date.now()}`, 
      text: '',
      isCorrect: localQuestion.options.length === 0,
    };
    const updatedOptions = [...localQuestion.options, newOption];
    handleLocalChange({ ...localQuestion, options: updatedOptions });
  };
  
  const handleRemoveOption = (optionId: string) => {
    let newOptions = localQuestion.options.filter(opt => opt.id !== optionId);
    if (!newOptions.some(o => o.isCorrect) && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
    }
    handleLocalChange({ ...localQuestion, options: newOptions });
  };
  
  const correctOptionId = localQuestion.options.find(o => o.isCorrect)?.id;

  const renderStatusIndicator = () => {
    switch (saveStatus) {
        case 'saving':
            return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
        case 'saved':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'dirty':
            return <Circle className="h-4 w-4 text-foreground" />;
        default:
            return <Circle className="h-4 w-4 text-foreground" />;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-start">
        <div className="flex items-center gap-4">
           <CardTitle className="text-lg">Question {questionNumber}</CardTitle>
           {renderStatusIndicator()}
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
                <AlertDialogDescription>This will permanently delete this question.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(localQuestion.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={localQuestion.text}
          onChange={handleQuestionTextChange}
          placeholder="Type your question here..."
          className="text-base"
          rows={3}
        />
        
        <RadioGroup onValueChange={handleCorrectOptionChange} value={correctOptionId} className="space-y-2">
            {localQuestion.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <RadioGroupItem value={option.id} id={`${localQuestion.id}-${option.id}`} />
                <Input
                  value={option.text}
                  onChange={e => handleOptionTextChange(option.id, e.target.value)}
                  placeholder="Option text"
                  className={cn(option.isCorrect && "font-semibold")}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(option.id)} disabled={localQuestion.options.length <= 1}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </RadioGroup>
        
        <Button variant="outline" size="sm" onClick={handleAddOption}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </CardContent>
    </Card>
  );
}
