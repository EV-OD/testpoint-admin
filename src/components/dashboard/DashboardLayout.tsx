
"use client";

import React from 'react';
import Header from '@/components/Header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export type View = 'users' | 'groups' | 'tests';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
}

export function DashboardLayout({ children, activeView, setActiveView }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-grow p-4 md:p-6 lg:p-8">
            {children}
          </main>
          <footer className="py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TestPoint Admin. All Rights Reserved.
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
