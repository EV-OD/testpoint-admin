
"use client";

import { useState } from 'react';
import { users as initialUsers, groups as allGroups } from '@/lib/data';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Edit, KeyRound } from 'lucide-react';
import { UserForm } from './UserForm';
import { PasswordResetDialog } from './PasswordResetDialog';
import { useToast } from '@/hooks/use-toast';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();

  const handleAddNew = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
    toast({
      title: "User Deleted",
      description: "The user has been successfully deleted.",
      variant: "destructive",
    });
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (!selectedUser) return;
    console.log(`Password reset for ${selectedUser.name}`);
    toast({
      title: "Password Reset",
      description: `A password reset link has been sent to ${selectedUser.email}.`,
    });
    setIsResetDialogOpen(false);
    setSelectedUser(undefined);
  };

  const handleSaveUser = (user: User) => {
    if (selectedUser) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
       toast({
        title: "User Updated",
        description: "The user details have been successfully updated.",
      });
    } else {
      setUsers([...users, { ...user, id: `u${Date.now()}` }]);
       toast({
        title: "User Created",
        description: "A new user has been successfully created.",
      });
    }
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const getRoleBadgeVariant = (role: User['role']): 'default' | 'secondary' | 'destructive' => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card className="shadow-none border-0">
        <CardHeader className="flex flex-row items-center justify-between px-0">
          <div>
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>Manage all user accounts in the system.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Groups</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {user.groupIds.map(id => allGroups.find(g => g.id === id)?.name).join(', ')}
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)}>
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
        <UserForm
          user={selectedUser}
          onSave={handleSaveUser}
          onClose={() => setIsFormOpen(false)}
        />
      )}
      {isResetDialogOpen && selectedUser && (
        <PasswordResetDialog
          user={selectedUser}
          onConfirm={confirmResetPassword}
          onCancel={() => setIsResetDialogOpen(false)}
        />
      )}
    </>
  );
}
