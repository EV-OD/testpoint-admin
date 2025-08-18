
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Test, TestSession, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw, Trash2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function TestResults() {
  const router = useRouter();
  const params = useParams();
  const testId = typeof params.id === 'string' ? params.id : '';

  const [test, setTest] = useState<Test | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) setUser(await res.json());
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

  const fetchResults = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/results/${testId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch test results');
      }
      const { test: testData, sessions: sessionsData } = await response.json();
      setTest(testData);
      setSessions(sessionsData);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [testId, toast]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleGoBack = () => {
    if (user?.role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/dashboard?view=tests');
    }
  };

  const handleResetSessions = async (sessionIds: string[]) => {
    if (sessionIds.length === 0) return;
    try {
      const response = await fetch(`/api/results/${testId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIdsToDelete: sessionIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset sessions');
      }
      toast({ title: 'Success', description: 'Selected sessions have been reset.' });
      setSelectedSessionIds([]);
      await fetchResults(); // Refresh data
    } catch (error: any) {
       toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessionIds(sessions.map(s => s.id));
    } else {
      setSelectedSessionIds([]);
    }
  };

  const handleSelectOne = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedSessionIds(prev => [...prev, id]);
    } else {
      setSelectedSessionIds(prev => prev.filter(sid => sid !== id));
    }
  };

  const renderStatusBadge = (status: TestSession['status']) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
        completed: 'default',
        submitted: 'default',
        expired: 'destructive',
        in_progress: 'outline',
        not_started: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  }

  const averageScore = useMemo(() => {
    const scoredSessions = sessions.filter(s => s.final_score !== null);
    if (scoredSessions.length === 0) return 'N/A';
    const totalScore = scoredSessions.reduce((acc, s) => acc + (s.final_score ?? 0), 0);
    return (totalScore / scoredSessions.length).toFixed(2) + '%';
  }, [sessions]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleGoBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                     {loading ? <Skeleton className="h-8 w-48" /> : <CardTitle>{test?.name} - Results</CardTitle>}
                     {loading ? <Skeleton className="h-5 w-64 mt-1" /> : <CardDescription>Showing {sessions.length} submissions. Average Score: {averageScore}</CardDescription>}
                </div>
            </div>
             <Button variant="outline" onClick={fetchResults}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedSessionIds.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium pl-2">{selectedSessionIds.length} selected</span>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Reset Selected
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the selected test sessions, allowing the students to retake the test. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleResetSessions(selectedSessionIds)} className="bg-destructive hover:bg-destructive/90">
                                Yes, Reset Sessions
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
         <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox 
                                checked={sessions.length > 0 && selectedSessionIds.length === sessions.length}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all" 
                            />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No submissions found for this test yet.
                    </TableCell>
                  </TableRow>
                ) : (
                    sessions.map((session) => (
                    <TableRow key={session.id} data-state={selectedSessionIds.includes(session.id) && "selected"}>
                        <TableCell>
                            <Checkbox
                                checked={selectedSessionIds.includes(session.id)}
                                onCheckedChange={(checked) => handleSelectOne(session.id, !!checked)}
                                aria-label="Select row"
                            />
                        </TableCell>
                        <TableCell className="font-medium">{session.student_name}</TableCell>
                        <TableCell>
                            {session.final_score !== null ? `${session.final_score.toFixed(2)}%` : 'Not Graded'}
                        </TableCell>
                        <TableCell>{renderStatusBadge(session.status)}</TableCell>
                        <TableCell>
                            {session.end_time ? format(new Date(session.end_time), 'PPp') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" disabled>
                             <Eye className="h-4 w-4" />
                             <span className="sr-only">View Submission</span>
                           </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
         </div>
      </CardContent>
    </Card>
  );
}
