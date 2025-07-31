
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Group, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { GroupForm } from './GroupForm';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

type GroupWithMemberCount = Group & { member_count: number };

export function GroupManagement() {
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState< (Group & { userIds: string[] }) | undefined>(undefined);
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    // Only set loading true on initial fetch
    if (groups.length === 0) {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch groups');
      setGroups(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, groups.length]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
      const studentsAndTeachers = data.filter((u: User) => u.role === 'student' || u.role === 'teacher');
      setAllUsers(studentsAndTeachers);
    } catch (error: any) {
      toast({ title: 'Error fetching users', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const handleAddNew = () => {
    setSelectedGroup(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = async (group: Group) => {
    try {
      const response = await fetch(`/api/groups/${group.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch group details');
      setSelectedGroup(data);
      setIsFormOpen(true);
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleDelete = async (groupId: string) => {
     try {
        const response = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete group');
        }
        toast({ title: 'Success', description: 'Group deleted successfully.' });
        fetchGroups();
     } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
     }
  };

  const handleSaveGroup = async (groupData: {id?: string; name: string, userIds: string[]}) => {
    setIsSubmitting(true);
    const isEditing = !!groupData.id;
    const url = isEditing ? `/api/groups/${groupData.id}` : '/api/groups';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} group.`);
        }
        toast({ title: 'Success', description: `Group successfully ${isEditing ? 'updated' : 'created'}.`});
        setIsFormOpen(false);
        setSelectedGroup(undefined);
        await fetchGroups();
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Create and manage user groups for tests.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Group
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => renderSkeleton())
                ) : groups.length === 0 && !isSubmitting ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                        No groups found. Create one to get started.
                        </TableCell>
                    </TableRow>
                ) : (
                    <>
                    {isSubmitting && renderSkeleton()}
                    {groups.map((group) => (
                    <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.member_count}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEdit(group)}>
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
                                        This action cannot be undone. This will permanently delete the group.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(group.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete Group
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                    </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {isFormOpen && (
        <GroupForm
          group={selectedGroup}
          allUsers={allUsers}
          onSave={handleSaveGroup}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </>
  );
}

