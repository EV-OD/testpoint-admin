
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Test, Group, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit, FileQuestion, Send } from 'lucide-react';
import { TestForm } from './TestForm';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';


type TestWithGroup = Test & { groups: { name: string } | null };

export function TestManagement() {
  const [tests, setTests] = useState<TestWithGroup[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | undefined>(undefined);
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        } else {
          setUserRole('teacher');
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setUserRole('teacher');
      }
    };
    fetchProfile();
  }, []);

  const canManageTests = userRole === 'admin' || userRole === 'teacher';

  const fetchTests = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/tests');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch tests');
      
      const now = new Date();
      const updatedTests = data.map((test: Test) => {
        if (test.status === 'published' && new Date(test.date_time) < now) {
          // This is a simplistic check. A more robust solution might use a server-side job
          // to transition statuses. For now, we'll update status on the client.
          return { ...test, status: 'completed' };
        }
        return test;
      });

      setTests(updatedTests);
    } catch (error: any) {
      toast({ title: 'Error fetching tests', description: error.message, variant: 'destructive' });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [toast]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch groups');
      setAllGroups(data);
    } catch (error: any) {
      toast({ title: 'Error fetching groups', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchTests(true);
    if (canManageTests) {
      fetchGroups();
    }
  }, [fetchTests, fetchGroups, canManageTests]);
  
  const handleAddNew = () => {
    setSelectedTest(undefined);
    setIsFormOpen(true);
  };

  const handleEditDetails = (test: Test) => {
    setSelectedTest(test);
    setIsFormOpen(true);
  };

  const handleViewQuestions = (testId: string) => {
    const path = userRole === 'admin' ? `/dashboard/tests/${testId}` : `/teacher/tests/${testId}`;
    router.push(path);
  };

  const handleDelete = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete test');
      }
      toast({ title: 'Success', description: 'Test deleted successfully.' });
      fetchTests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handlePublish = async (test: Test) => {
    if (test.question_count === 0) {
      toast({
        title: "Cannot Publish Test",
        description: "A test must have at least one question to be published.",
        variant: "destructive"
      });
      return;
    }
    try {
      const response = await fetch(`/api/tests/${test.id}/publish`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish test');
      }
      toast({ title: 'Success', description: 'Test published successfully.' });
      fetchTests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };


  const handleSaveTest = async (testData: Omit<Test, 'id' | 'status'> & { id?: string }) => {
    const isEditing = !!testData.id;
    const url = isEditing ? `/api/tests/${testData.id}` : '/api/tests';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} test.`);
      }
      toast({ title: 'Success', description: `Test successfully ${isEditing ? 'updated' : 'created'}.` });
      setIsFormOpen(false);
      setSelectedTest(undefined);
      if (!isEditing) {
        handleViewQuestions(data.id);
      } else {
        await fetchTests();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const testsByStatus = useMemo(() => {
    return {
      draft: tests.filter(t => t.status === 'draft'),
      published: tests.filter(t => t.status === 'published'),
      completed: tests.filter(t => t.status === 'completed'),
    };
  }, [tests]);
  
  const renderTestTable = (testList: TestWithGroup[], status: Test['status']) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test Name</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Questions</TableHead>
            {status === 'draft' && <TableHead>Status</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
          ) : testList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No {status} tests found.
              </TableCell>
            </TableRow>
          ) : (
            testList.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="font-medium">{test.name}</TableCell>
                <TableCell className="text-muted-foreground">{test.groups?.name || 'N/A'}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(test.date_time), 'PPp')}</TableCell>
                <TableCell className="text-muted-foreground">{test.question_count}</TableCell>
                {status === 'draft' && <TableCell><Badge variant="outline">Draft</Badge></TableCell>}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewQuestions(test.id)}>
                        <FileQuestion className="mr-2 h-4 w-4" />
                        {status === 'draft' ? 'Edit Questions' : 'View Questions'}
                      </DropdownMenuItem>
                       {status === 'draft' && canManageTests && (
                        <>
                          <DropdownMenuItem onClick={() => handleEditDetails(test)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePublish(test)} disabled={test.question_count === 0}>
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" className="w-full justify-start text-sm text-destructive hover:text-destructive p-2 m-0 h-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this test and all its questions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(test.id)} className="bg-destructive hover:bg-destructive/90">
                                  Delete Test
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      {status === 'published' && (
                        <DropdownMenuItem disabled>
                           In Progress
                        </DropdownMenuItem>
                      )}
                      {status === 'completed' && (
                         <DropdownMenuItem>
                           View Results
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Test Management</CardTitle>
            <CardDescription>Create, publish, and review tests.</CardDescription>
          </div>
          {canManageTests && (
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Test
            </Button>
          )}
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="draft">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draft">Drafts ({testsByStatus.draft.length})</TabsTrigger>
              <TabsTrigger value="published">Published ({testsByStatus.published.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({testsByStatus.completed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="draft" className="mt-4">
                {renderTestTable(testsByStatus.draft, 'draft')}
            </TabsContent>
            <TabsContent value="published" className="mt-4">
                {renderTestTable(testsByStatus.published, 'published')}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
                {renderTestTable(testsByStatus.completed, 'completed')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {isFormOpen && canManageTests && (
        <TestForm
          test={selectedTest}
          allGroups={allGroups}
          onSave={handleSaveTest}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </>
  );
}
