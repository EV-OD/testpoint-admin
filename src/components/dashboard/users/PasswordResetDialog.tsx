"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface PasswordResetDialogProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PasswordResetDialog({ user, onConfirm, onCancel }: PasswordResetDialogProps) {
  return (
    <AlertDialog open={true} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will reset the password for{' '}
            <span className="font-semibold text-foreground">{user.name}</span> ({user.email}).
            They will receive an email with instructions to set a new password. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
             <Button onClick={onConfirm}>Yes, Reset Password</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
