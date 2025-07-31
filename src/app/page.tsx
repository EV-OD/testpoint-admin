
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Welcome to TestPoint</CardTitle>
                <CardDescription>The application backend has been switched to Firebase. The UI will be rebuilt in the next steps.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4">The previous UI components have been temporarily removed as they were connected to the old Supabase backend.</p>
                <p>We will now build out the authentication and data management features using Firebase.</p>
                 <Button onClick={() => router.push('/login')} className="mt-6 w-full">
                    Go to Login Page
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
