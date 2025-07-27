"use client";

import { useState } from 'react';
import { groups as initialGroups, users as allUsers } from '@/lib/data';
import type { Group, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { GroupForm } from './GroupForm';
import { useToast } from '@/hooks/use-toast';

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [users, setUsers] = useState<User[]>(allUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
  const { toast } = useToast();

  const handleAddNew = () => {
    setSelectedGroup(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (group: Group) => {
    setSelectedGroup(group);
    setIsFormOpen(true);
  };
  
  const handleDelete = (groupId: string) => {
    // Also remove group from users
    setUsers(currentUsers => currentUsers.map(u => ({
      ...u,
      groupIds: u.groupIds.filter(id => id !== groupId)
    })))
    setGroups(groups.filter((group) => group.id !== groupId));

    toast({
      title: "Group Deleted",
      description: "The group has been successfully deleted.",
      variant: "destructive",
    });
  };

  const handleSaveGroup = (groupData: {id?: string; name: string, userIds: string[]}) => {
    const { id, name, userIds } = groupData;
    
    if (id) {
      // Update existing group
      setGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
       toast({
        title: "Group Updated",
        description: "The group has been successfully updated.",
      });
    } else {
      // Create new group
      const newGroup = { id: `g${Date.now()}`, name };
      setGroups([...groups, newGroup]);
      toast({
        title: "Group Created",
        description: "A new group has been successfully created.",
      });
    }

    const groupId = id || `g${Date.now()}`;

    // Update user associations
    setUsers(currentUsers => currentUsers.map(user => {
      const isInGroup = userIds.includes(user.id);
      const wasInGroup = user.groupIds.includes(groupId);

      if (isInGroup && !wasInGroup) {
        return { ...user, groupIds: [...user.groupIds, groupId] };
      }
      if (!isInGroup && wasInGroup) {
        return { ...user, groupIds: user.groupIds.filter(gid => gid !== groupId) };
      }
      return user;
    }));

    setIsFormOpen(false);
    setSelectedGroup(undefined);
  };

  const getUserCountForGroup = (groupId: string) => {
    return users.filter(user => user.groupIds.includes(groupId)).length;
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
                    <TableCell>{getUserCountForGroup(group.id)}</TableCell>
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
          allUsers={users}
          onSave={handleSaveGroup}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </>
  );
}
