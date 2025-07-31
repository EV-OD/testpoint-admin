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

type GroupWithMemberCount = Group & { member_count: number };

export function GroupManagement() {
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState< (Group & { userIds: string[] }) | undefined>(undefined);
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
     console.log("Fetching groups...");
     setGroups([]);
  }, []);

  const fetchUsers = useCallback(async () => {
    console.log("Fetching users...");
    setAllUsers([]);
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, [fetchGroups, fetchUsers]);

  const handleAddNew = () => {
    setSelectedGroup(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = async (group: Group) => {
    toast({ title: "Note", description: "Edit functionality will be implemented with Firestore." });
  };
  
  const handleDelete = async (groupId: string) => {
     toast({ title: "Note", description: "Delete functionality will be implemented with Firestore." });
  };

  const handleSaveGroup = async (groupData: {id?: string; name: string, userIds: string[]}) => {
    toast({ title: "Note", description: "Save functionality will be implemented with Firestore." });
    setIsFormOpen(false);
    setSelectedGroup(undefined);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Create and manage user groups for tests. (Firestore backend pending)</CardDescription>
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
                {groups.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                        No groups found. Firestore integration is pending.
                        </TableCell>
                    </TableRow>
                ) : groups.map((group) => (
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
