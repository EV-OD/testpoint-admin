"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Group, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const groupFormSchema = z.object({
  name: z.string().min(3, { message: "Group name must be at least 3 characters." }),
  userIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one member.",
  }),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface GroupFormProps {
  group?: Group;
  allUsers: User[];
  onSave: (group: {id?: string, name: string; userIds: string[]}) => void;
  onClose: () => void;
}

export function GroupForm({ group, allUsers, onSave, onClose }: GroupFormProps) {
  const getInitialUserIds = () => {
    if (!group) return [];
    return allUsers.filter(u => u.groupIds.includes(group.id)).map(u => u.id);
  }

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group?.name || '',
      userIds: getInitialUserIds(),
    },
  });

  const onSubmit = (data: GroupFormValues) => {
    onSave({ ...data, id: group?.id });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit Group' : 'Create New Group'}</DialogTitle>
          <DialogDescription>
            {group ? 'Update the details for this group.' : 'Enter a name and select members for the new group.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Grade 10 Math" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userIds"
              render={() => (
                <FormItem>
                  <FormLabel>Members</FormLabel>
                   <ScrollArea className="h-40 w-full rounded-md border p-4">
                    {allUsers.map((user) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="userIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={user.id}
                              className="flex flex-row items-start space-x-3 space-y-0 my-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, user.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== user.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {user.name} ({user.role})
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
