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

type TestWithGroup = Test & { groups: { name: string } | null };

export function TestManagement() {
  const [tests, setTests] = useState<TestWithGroup[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | undefined>(undefined);
  const { toast } = useToast();

  const fetchTests = useCallback(async () => {
    console.log("Fetching tests...");
    setTests([]);
  }, []);

  const fetchGroups = useCallback(async () => {
    console.log("Fetching groups...");
    setAllGroups([]);
  }, []);

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
    toast({ title: "Note", description: "Delete functionality will be implemented with Firestore." });
  };

  const handleSaveTest = async (testData: Omit<Test, 'id'> & { id?: string }) => {
    toast({ title: "Note", description: "Save functionality will be implemented with Firestore." });
    setIsFormOpen(false);
    setSelectedTest(undefined);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tests</CardTitle>
            <CardDescription>Schedule and manage tests for different groups. (Firestore backend pending)</CardDescription>
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
                {tests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        No tests found. Firestore integration is pending.
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
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(test.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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
