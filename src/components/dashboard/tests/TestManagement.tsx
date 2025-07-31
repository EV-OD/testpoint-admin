"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Test, Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { TestForm } from './TestForm';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type TestWithGroup = Test & { groups: { name: string } | null };

export function TestManagement() {
  const [tests, setTests] = useState<TestWithGroup[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | undefined>(undefined);
  const { toast } = useToast();

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tests');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch tests');
      setTests(data);
    } catch (error: any) {
      toast({ title: 'Error fetching tests', description: error.message, variant: 'destructive' });
    } finally {
        setLoading(false);
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
    fetchTests();
    fetchGroups();
  }, [fetchTests, fetchGroups]);

  const handleAddNew = () => {
    setSelectedTest(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (test: Test) => {
    setSelectedTest(test);
    setIsFormOpen(true);
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

  const handleSaveTest = async (testData: Omit<Test, 'id'> & { id?: string }) => {
    const isEditing = !!testData.id;
    const url = isEditing ? `/api/tests/${testData.id}` : '/api/tests';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} test.`);
        }
        toast({ title: 'Success', description: `Test successfully ${isEditing ? 'updated' : 'created'}.`});
        setIsFormOpen(false);
        setSelectedTest(undefined);
        fetchTests();
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tests</CardTitle>
            <CardDescription>Schedule and manage tests for different groups.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Test
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead className="hidden md:table-cell">Group</TableHead>
                  <TableHead className="hidden sm:table-cell">Date & Time</TableHead>
                  <TableHead className="hidden lg:table-cell">Time Limit</TableHead>
                  <TableHead className="hidden lg:table-cell">Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading tests...</TableCell></TableRow>
                ) : tests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No tests found. Create one to get started.
                        </TableCell>
                    </TableRow>
                ) : tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{test.groups?.name || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{format(new Date(test.date_time), 'PPp')}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{test.time_limit} mins</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{test.question_count}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(test)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
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
                                      This action cannot be undone. This will permanently delete this test.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                      onClick={() => handleDelete(test.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                  >
                                      Delete Test
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {isFormOpen && (
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
