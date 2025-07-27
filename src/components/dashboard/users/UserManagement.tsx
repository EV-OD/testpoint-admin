
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { getUsersWithGroups, deleteUser, upsertUser, resetPasswordForUser, createUserWithProfile } from '@/lib/supabase/queries';

type UserWithGroups = User & { groups: { name: string }[] };

export function UserManagement() {
  const [users, setUsers] = useState<UserWithGroups[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    const { data, error } = await getUsersWithGroups();
    if (error) {
      toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
    } else {
      setUsers(data || []);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddNew = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const { error } = await deleteUser(userId);
    if (error) {
        toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "User Deleted", description: "The user has been successfully deleted.", variant: "destructive" });
        fetchUsers();
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;
    
    const { error } = await resetPasswordForUser(selectedUser.email);
    if(error){
        toast({ title: "Password Reset Failed", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Password Reset", description: `A password reset link has been sent to ${selectedUser.email}.` });
    }
    setIsResetDialogOpen(false);
    setSelectedUser(undefined);
  };

  const handleSaveUser = async (userData: any) => {
    if (userData.id) { // Existing user
      const { error } = await upsertUser({ id: userData.id, name: userData.name, role: userData.role, email: userData.email });
      if (error) {
        toast({ title: "Error updating user", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "User Updated", description: "The user details have been successfully updated." });
        fetchUsers();
      }
    } else { // New user
      const { error } = await createUserWithProfile(userData);
      if (error) {
         toast({ title: "Error creating user", description: error.message, variant: "destructive" });
      } else {
         toast({ title: "User Created", description: "A new user has been successfully created." });
         fetchUsers();
      }
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
                      {user.groups.map(g => g.name).join(', ')}
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
