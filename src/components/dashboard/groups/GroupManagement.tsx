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
import {
  getGroupsWithMemberCount,
  deleteGroup,
  upsertGroup,
  getUsers,
  getGroupWithMembers,
} from '@/lib/supabase/queries';

type GroupWithMemberCount = Group & { member_count: number };

export function GroupManagement() {
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState< (Group & { userIds: string[] }) | undefined>(undefined);
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    const { data, error } = await getGroupsWithMemberCount();
    if (error) {
      toast({ title: "Error fetching groups", description: error.message, variant: "destructive" });
    } else {
      setGroups(data || []);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await getUsers();
    if (error) {
      toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
    } else {
      setAllUsers(data || []);
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, [fetchGroups, fetchUsers]);

  const handleAddNew = () => {
    setSelectedGroup(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = async (group: Group) => {
    const { data, error } = await getGroupWithMembers(group.id);
    if(error){
      toast({ title: "Error fetching group details", description: error.message, variant: "destructive" });
      return;
    }
    setSelectedGroup(data);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (groupId: string) => {
    const { error } = await deleteGroup(groupId);
    if (error) {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group Deleted", description: "The group has been successfully deleted.", variant: "destructive" });
      fetchGroups();
    }
  };

  const handleSaveGroup = async (groupData: {id?: string; name: string, userIds: string[]}) => {
    const { error } = await upsertGroup(groupData);
    if (error) {
      toast({ title: "Error saving group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: groupData.id ? "Group Updated" : "Group Created", description: `The group has been successfully ${groupData.id ? 'updated' : 'created'}.` });
      fetchGroups();
    }
    setIsFormOpen(false);
    setSelectedGroup(undefined);
  };

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
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(group.id)}>
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
