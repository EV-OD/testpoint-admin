
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, X, Trash2, Check, Loader2 } from 'lucide-react';
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


interface QuestionItemProps {
  testId: string;
  question: Question;
  questionNumber: number;
  onUpdate: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export function QuestionItem({ testId, question, questionNumber, onUpdate, onDelete }: QuestionItemProps) {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const { toast } = useToast();

  const debouncedSave = useMemo(
    () =>
      debounce(async (updatedQuestion: Question) => {
        setSaveStatus('saving');
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
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000); // Reset after 2s
        } catch (error: any) {
          toast({ title: 'Error', description: `Could not save question: ${error.message}`, variant: 'destructive' });
          setSaveStatus('idle');
        }
      }, 1500), // 1.5 second debounce delay
    [testId, toast]
  );

  // When parent component's question changes, update local state
  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  // When local state changes, trigger a debounced save
  useEffect(() => {
    // Only save if the question has actually changed.
    if (JSON.stringify(localQuestion) !== JSON.stringify(question)) {
      debouncedSave(localQuestion);
    }
  }, [localQuestion, question, debouncedSave]);
  
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = { ...localQuestion, text: e.target.value };
    setLocalQuestion(newQuestion);
    onUpdate(newQuestion);
  };
  
  const handleOptionTextChange = (optionId: string, text: string) => {
    const newOptions = localQuestion.options.map(opt => (opt.id === optionId ? { ...opt, text } : opt));
    const newQuestion = { ...localQuestion, options: newOptions };
    setLocalQuestion(newQuestion);
    onUpdate(newQuestion);
  };
  
  const handleCorrectOptionChange = (correctOptionId: string) => {
    const newOptions = localQuestion.options.map(opt => ({ ...opt, isCorrect: opt.id === correctOptionId }));
    const newQuestion = { ...localQuestion, options: newOptions };
    setLocalQuestion(newQuestion);
    onUpdate(newQuestion);
  };
  
  const handleAddOption = () => {
    const newOption: Option = {
      id: `${Date.now()}`, // Temporary unique ID
      text: '',
      isCorrect: false,
    };
    const newQuestion = { ...localQuestion, options: [...localQuestion.options, newOption] };
    setLocalQuestion(newQuestion);
    onUpdate(newQuestion);
  };
  
  const handleRemoveOption = (optionId: string) => {
    const newOptions = localQuestion.options.filter(opt => opt.id !== optionId);
    // If we are removing the correct option, make the first one correct
    if (!newOptions.some(o => o.isCorrect) && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
    }
    const newQuestion = { ...localQuestion, options: newOptions };
    setLocalQuestion(newQuestion);
    onUpdate(newQuestion);
  };
  
  const correctOptionId = localQuestion.options.find(o => o.isCorrect)?.id;

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></div>;
      case 'saved':
        return <div className="flex items-center gap-2 text-green-600"><Check className="h-4 w-4" /><span>Saved</span></div>;
      default:
        return null;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg">Question {questionNumber}</CardTitle>
          <CardDescription className="pt-2 text-sm text-muted-foreground">
            Changes are saved automatically.
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
            {renderSaveStatus()}
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
        </div>
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
                <RadioGroupItem value={option.id} />
                <Input
                  value={option.text}
                  onChange={e => handleOptionTextChange(option.id, e.target.value)}
                  placeholder="Option text"
                  className={cn(option.isCorrect && "font-semibold")}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(option.id)} disabled={localQuestion.options.length <= 2}>
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
