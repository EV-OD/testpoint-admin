"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { UserForm } from './UserForm';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

type UserWithGroups = User & { groups: { name: string }[] };

export function UserManagement() {
  const [users, setUsers] = useState<UserWithGroups[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select(`
        id, name, email, role,
        groups ( name )
      `);
      if (error) throw error;

      // The raw query returns email in the top-level object, but our type expects it inside `auth`
      // and also the groups relation needs to be flattened. This reshapes the data.
      const reshapedData = data.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        email: p.email,
        groups: p.groups || []
      })) as UserWithGroups[];

      setUsers(reshapedData);
    } catch(error) {
      toast({ title: "Error fetching users", description: (error as Error).message, variant: "destructive" });
    }
  }, [toast, supabase]);

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
    try {
        // We can't delete users directly this way with RLS.
        // We need a server-side operation for this.
        // For now, we'll just show a toast.
        toast({ title: "Feature not implemented", description: "User deletion must be handled via a server function.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error deleting user", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleSaveUser = async (userData: any) => {
    const isEditing = !!userData.id;

    try {
        if (isEditing) {
            const { error } = await supabase
                .from('profiles')
                .update({ name: userData.name, role: userData.role })
                .eq('id', userData.id);
            if (error) throw error;
        } else {
            // Creating a user requires calling the admin API, which is not secure from the client.
            // This should be done in a server action or edge function.
            // For now, we'll show a toast.
             toast({ title: "Feature not implemented", description: "User creation must be handled via a server function.", variant: "destructive" });
             setIsFormOpen(false);
             return;
        }
        
        toast({ title: isEditing ? "User Updated" : "User Created", description: `The user has been successfully ${isEditing ? 'updated' : 'created'}.`});
        fetchUsers();

    } catch(error) {
        toast({ title: `Error ${isEditing ? 'updating' : 'creating'} user`, description: (error as Error).message, variant: "destructive" });
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
    </>
  );
}
