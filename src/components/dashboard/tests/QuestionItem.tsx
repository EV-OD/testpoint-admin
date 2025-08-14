
"use client";

import { useMemo } from 'react';
import type { Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, X, Trash2, Loader2, CheckCircle, Circle, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { SaveStatus } from './QuestionManagement';


interface QuestionItemProps {
  question: Question;
  questionNumber: number;
  onDelete: (questionId: string) => void;
  onQuestionChange: (questionId: string, updatedQuestion: Partial<Question>) => void;
  saveStatus: SaveStatus;
}

export function QuestionItem({ question, questionNumber, onDelete, onQuestionChange, saveStatus }: QuestionItemProps) {

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQuestionChange(question.id, { text: e.target.value });
  };
  
  const handleOptionTextChange = (optionIndex: number, text: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], text };
    onQuestionChange(question.id, { options: newOptions });
  };
  
  const handleCorrectOptionChange = (optionIndex: number) => {
     onQuestionChange(question.id, { correctOptionIndex: optionIndex });
  };
  
  const handleAddOption = () => {
    const newOption: Option = {
      id: `temp-${Date.now()}`, 
      text: '',
    };
    const updatedOptions = [...question.options, newOption];
    let newQuestion: Partial<Question> = { options: updatedOptions };
    if (updatedOptions.length === 1) {
        newQuestion.correctOptionIndex = 0;
    }
    onQuestionChange(question.id, newQuestion);
  };
  
  const handleRemoveOption = (optionIndexToRemove: number) => {
    let newOptions = question.options.filter((_, index) => index !== optionIndexToRemove);
    let newCorrectIndex = question.correctOptionIndex;

    if (newOptions.length > 0) {
        if (optionIndexToRemove === newCorrectIndex) {
            newCorrectIndex = 0;
        } else if (optionIndexToRemove < newCorrectIndex) {
            newCorrectIndex -= 1;
        }
    } else {
        newCorrectIndex = 0;
    }
    
    onQuestionChange(question.id, { options: newOptions, correctOptionIndex: newCorrectIndex });
  };
  
  const correctOptionId = question.options[question.correctOptionIndex]?.id;

  const renderStatusIndicator = () => {
    switch (saveStatus) {
        case 'saving':
            return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
        case 'saved':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'dirty':
            return <Edit className="h-4 w-4 text-blue-600" />;
        case 'error':
             return <X className="h-4 w-4 text-destructive" />;
        default:
            return <Circle className="h-4 w-4 text-foreground" />;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-start">
        <div className="flex items-center gap-4">
           <CardTitle className="text-lg">Question {questionNumber}</CardTitle>
           <div className='flex items-center gap-1 text-sm text-muted-foreground'>
            {renderStatusIndicator()}
           </div>
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
                <AlertDialogAction onClick={() => onDelete(question.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={question.text}
          onChange={handleQuestionTextChange}
          placeholder="Type your question here..."
          className="text-base"
          rows={3}
        />
        
        <RadioGroup onValueChange={(id) => handleCorrectOptionChange(question.options.findIndex(opt => opt.id === id))} value={correctOptionId} className="space-y-2">
            {question.options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                <Input
                  value={option.text}
                  onChange={e => handleOptionTextChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className={cn(question.correctOptionIndex === index && "font-semibold")}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} disabled={question.options.length <= 1}>
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
