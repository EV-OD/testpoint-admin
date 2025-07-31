"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
            <Cpu className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Login to TestPoint</CardTitle>
          <CardDescription>Firebase authentication will be implemented here.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground">The login form has been temporarily disabled while we migrate to Firebase Auth.</p>
            <Button className="w-full mt-4" disabled>Login</Button>
        </CardContent>
      </Card>
    </div>
  );
}
