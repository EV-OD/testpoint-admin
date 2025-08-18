

"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Test, Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';

const antiCheatConfigSchema = z.object({
    enabled: z.boolean().default(true),
    enableScreenshotPrevention: z.boolean().default(true),
    enableScreenRecordingDetection: z.boolean().default(true),
    maxWarnings: z.coerce.number().min(0).default(3),
    violationAction: z.enum(['WARNING_ONLY', 'SUBMIT_TEST', 'END_SESSION']).default('WARNING_ONLY'),
    preset: z.enum(['STRICT', 'BALANCED', 'LENIENT', 'CUSTOM']).default('BALANCED'),
}).default({});


const testFormSchema = z.object({
  name: z.string().min(3, { message: "Test name must be at least 3 characters." }),
  group_id: z.string({ required_error: "Please select a group." }),
  time_limit: z.coerce.number().min(1, { message: "Time limit must be at least 1 minute." }),
  question_count: z.coerce.number().min(0, { message: "Question count cannot be negative." }).default(0),
  date: z.date({ required_error: "A date for the test is required." }),
  time: z.string({ required_error: "A time for the test is required." }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  antiCheatConfig: antiCheatConfigSchema,
});

type TestFormValues = z.infer<typeof testFormSchema>;

interface TestFormProps {
  test?: Test;
  allGroups: Group[];
  onSave: (test: Omit<Test, 'id' | 'status' | 'date_time'> & { id?: string, date_time: Date, antiCheatConfig?: any }) => void;
  onClose: () => void;
}

const PRESETS = {
    STRICT: {
        enableScreenshotPrevention: true,
        enableScreenRecordingDetection: true,
        maxWarnings: 1,
        violationAction: 'SUBMIT_TEST'
    },
    BALANCED: {
        enableScreenshotPrevention: true,
        enableScreenRecordingDetection: true,
        maxWarnings: 3,
        violationAction: 'WARNING_ONLY'
    },
    LENIENT: {
        enableScreenshotPrevention: false,
        enableScreenRecordingDetection: false,
        maxWarnings: 5,
        violationAction: 'WARNING_ONLY'
    }
}


export function TestForm({ test, allGroups, onSave, onClose }: TestFormProps) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
        name: test?.name || '',
        group_id: test?.group_id || undefined,
        time_limit: test?.time_limit || 60,
        question_count: test?.question_count || 0,
        date: test?.date_time ? new Date(test.date_time) : new Date(),
        time: test?.date_time ? format(new Date(test.date_time), 'HH:mm') : '09:00',
        antiCheatConfig: {
          enabled: test?.antiCheatConfig?.enabled ?? true,
          preset: test?.antiCheatConfig?.preset ?? 'BALANCED',
          enableScreenshotPrevention: test?.antiCheatConfig?.enableScreenshotPrevention ?? true,
          enableScreenRecordingDetection: test?.antiCheatConfig?.enableScreenRecordingDetection ?? true,
          maxWarnings: test?.antiCheatConfig?.maxWarnings ?? 3,
          violationAction: test?.antiCheatConfig?.violationAction ?? 'WARNING_ONLY',
        }
    },
  });

  const preset = form.watch('antiCheatConfig.preset');

  useEffect(() => {
    if (preset === 'STRICT' || preset === 'BALANCED' || preset === 'LENIENT') {
        const presetValues = PRESETS[preset];
        form.setValue('antiCheatConfig.enableScreenshotPrevention', presetValues.enableScreenshotPrevention);
        form.setValue('antiCheatConfig.enableScreenRecordingDetection', presetValues.enableScreenRecordingDetection);
        form.setValue('antiCheatConfig.maxWarnings', presetValues.maxWarnings);
        form.setValue('antiCheatConfig.violationAction', presetValues.violationAction as 'WARNING_ONLY' | 'SUBMIT_TEST' | 'END_SESSION');
    }
  }, [preset, form]);


  const onSubmit = (data: TestFormValues) => {
    const [hours, minutes] = data.time.split(':').map(Number);
    const combinedDateTime = new Date(data.date);
    combinedDateTime.setHours(hours, minutes);

    onSave({ 
        id: test?.id, 
        name: data.name,
        group_id: data.group_id,
        time_limit: data.time_limit,
        question_count: data.question_count,
        date_time: combinedDateTime,
        antiCheatConfig: data.antiCheatConfig,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{test ? 'Edit Test' : 'Create New Test'}</DialogTitle>
          <DialogDescription>
            {test ? 'Update the details for this draft test.' : 'Enter the details for the new test. You can add questions after creating it.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Final Exam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group for this test" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (mins)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="question_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. of Questions</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} readOnly/>
                    </FormControl>
                    <FormDescription>
                        This is updated automatically.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Test Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Test Time</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
             <FormDescription>
                The official start date and time for the test.
             </FormDescription>

            {test && (
                <>
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                         <div>
                            <h3 className="text-lg font-medium">Anti-Cheat Settings</h3>
                            <p className="text-sm text-muted-foreground">
                                Configure violation detection and prevention measures.
                            </p>
                         </div>
                        
                        <FormField
                            control={form.control}
                            name="antiCheatConfig.enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Anti-Cheat</FormLabel>
                                    <FormDescription>
                                        Globally enable or disable all anti-cheat features for this test.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />

                        {form.watch('antiCheatConfig.enabled') && (
                            <div className='space-y-4 pl-4 border-l-2 ml-2'>
                                <FormField
                                    control={form.control}
                                    name="antiCheatConfig.preset"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Configuration Preset</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a preset..." />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="STRICT">Strict</SelectItem>
                                                <SelectItem value="BALANCED">Balanced</SelectItem>
                                                <SelectItem value="LENIENT">Lenient</SelectItem>
                                                <SelectItem value="CUSTOM">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Select a preset or choose Custom to fine-tune settings below.</FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4" onClick={() => form.setValue('antiCheatConfig.preset', 'CUSTOM')}>
                                     <FormField
                                        control={form.control}
                                        name="antiCheatConfig.enableScreenshotPrevention"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Prevent Screenshots</FormLabel>
                                                <FormDescription>Block screenshots and screen recording (Android only).</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="antiCheatConfig.enableScreenRecordingDetection"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Detect Screen Recording</FormLabel>
                                                <FormDescription>Log attempts to record the screen during the test.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="antiCheatConfig.maxWarnings"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum Warnings</FormLabel>
                                                <FormControl>
                                                <Input type="number" {...field} />
                                                </FormControl>
                                                <FormDescription>Number of warnings before a disciplinary action is taken.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="antiCheatConfig.violationAction"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Action on Final Violation</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an action" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="WARNING_ONLY">Warning Only</SelectItem>
                                                    <SelectItem value="SUBMIT_TEST">Force Submit Test</SelectItem>
                                                    <SelectItem value="END_SESSION">End Session Immediately</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Action to take when maximum warnings are exceeded.</FormDescription>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}


             <DialogFooter className='pt-4'>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Test</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
