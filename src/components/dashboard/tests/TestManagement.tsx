
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Test, Group, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit, FileQuestion, Send, CheckCircle, Circle, ArchiveRestore, Search, X } from 'lucide-react';
import { TestForm } from './TestForm';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


type TestWithGroup = Test & { groups: { name: string } | null };
type TestStatus = 'draft' | 'published' | 'completed';

export function TestManagement() {
  const [tests, setTests] = useState<TestWithGroup[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | undefined>(undefined);
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const [activeTab, setActiveTab] = useState<TestStatus>('draft');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [textFilter, setTextFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
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
        if (test.status === 'published' ) {
            const testStart = new Date(test.date_time);
            const testEnd = addMinutes(testStart, test.time_limit);
            if (testEnd < now) {
                 return { ...test, status: 'completed' };
            }
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
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch groups');
      }
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

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, textFilter, groupFilter]);
  
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
    await handleBulkAction([testId], 'delete');
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
    await handleBulkAction([test.id], 'publish');
  };

  const handleBulkAction = async (testIds: string[], action: 'publish' | 'revert_to_draft' | 'delete') => {
    if (testIds.length === 0) return;
    try {
      const response = await fetch('/api/tests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testIds, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Bulk action failed');
      }

      let successMessage = '';
      if (result.successCount > 0) {
        successMessage = `${result.successCount} tests ${action.replace('_', ' ')}d.`;
      }
      if (result.errorCount > 0) {
        const errorMessage = `Failed to ${action} ${result.errorCount} tests. See console for details.`;
        toast({ title: 'Bulk Action Partially Failed', description: `${successMessage} ${errorMessage}`, variant: 'destructive' });
        console.error('Bulk action errors:', result.errors);
      } else {
        toast({ title: 'Success', description: successMessage });
      }
    } catch(e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
        await fetchTests();
        setSelectedIds([]);
    }
  }


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

  const filteredTests = useMemo(() => {
    let filtered = tests;
    if (textFilter) {
      filtered = filtered.filter(t => t.name.toLowerCase().includes(textFilter.toLowerCase()));
    }
    if (groupFilter !== 'all') {
      filtered = filtered.filter(t => t.group_id === groupFilter);
    }
    return {
      draft: filtered.filter(t => t.status === 'draft'),
      published: filtered.filter(t => t.status === 'published'),
      completed: filtered.filter(t => t.status === 'completed'),
    };
  }, [tests, textFilter, groupFilter]);

  const handleSelectAll = (e: boolean) => {
    if (e) {
      setSelectedIds(filteredTests[activeTab].map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  }

  const handleSelectOne = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  }

  const renderBulkActionToolbar = () => {
    if (selectedIds.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
        <span className="text-sm font-medium pl-2">{selectedIds.length} selected</span>
        {activeTab === 'draft' && (
          <>
            <Button size="sm" onClick={() => handleBulkAction(selectedIds, 'publish')}>
              <Send className="mr-2 h-4 w-4" /> Publish
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction(selectedIds, 'delete')}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </>
        )}
        {activeTab === 'published' && (
           <Button size="sm" onClick={() => handleBulkAction(selectedIds, 'revert_to_draft')}>
              <ArchiveRestore className="mr-2 h-4 w-4" /> Revert to Draft
            </Button>
        )}
      </div>
    );
  }
  
  const renderTestTable = (testList: TestWithGroup[], status: Test['status']) => {
    const isAllSelected = testList.length > 0 && selectedIds.length === testList.length;

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                 <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Select all" />
              </TableHead>
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
              Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
            ) : testList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No {status} tests found.
                </TableCell>
              </TableRow>
            ) : (
              testList.map((test) => (
                <TableRow key={test.id} data-state={selectedIds.includes(test.id) && "selected"}>
                   <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(test.id)}
                        onCheckedChange={(checked) => handleSelectOne(test.id, !!checked)}
                        aria-label="Select row"
                      />
                   </TableCell>
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
                           <DropdownMenuItem onClick={() => handleBulkAction([test.id], 'revert_to_draft')}>
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Revert to Draft
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
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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
          </div>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="draft" onValueChange={(v) => setActiveTab(v as TestStatus)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draft">Drafts ({filteredTests.draft.length})</TabsTrigger>
              <TabsTrigger value="published">Published ({filteredTests.published.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filteredTests.completed.length})</TabsTrigger>
            </TabsList>

            <div className="mt-4">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by test name..." 
                            value={textFilter}
                            onChange={(e) => setTextFilter(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Filter by group..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            {allGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {(textFilter || groupFilter !== 'all') && (
                        <Button variant="ghost" onClick={() => {setTextFilter(''); setGroupFilter('all')}}>
                            <X className="mr-2 h-4 w-4" /> Clear
                        </Button>
                    )}
                </div>

                {renderBulkActionToolbar()}

                <TabsContent value="draft" className="mt-0">
                    {renderTestTable(filteredTests.draft, 'draft')}
                </TabsContent>
                <TabsContent value="published" className="mt-0">
                    {renderTestTable(filteredTests.published, 'published')}
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                    {renderTestTable(filteredTests.completed, 'completed')}
                </TabsContent>
            </div>
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

    