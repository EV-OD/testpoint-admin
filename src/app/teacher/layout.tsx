
'use client';

import { Cpu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 items-center justify-between px-6 bg-card border-b">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">
              TestPoint Teacher
          </h1>
        </div>
        <Button
            variant="ghost"
            onClick={handleLogout}
            className="justify-start text-base hover:bg-destructive/20 hover:text-destructive"
        >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
        </Button>
      </header>
      <main className="flex-grow p-4 md:p-6 lg:p-8 bg-background">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
