
"use client";

import React from 'react';
import Header from '@/components/Header';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import type { User } from '@/lib/types';

export type View = 'users' | 'groups' | 'tests' | 'profile';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  userRole: User['role'] | null;
}

export function DashboardLayout({ children, activeView, setActiveView, userRole }: DashboardLayoutProps) {
  
  const handleViewChange = (view: View) => {
    setActiveView(view);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DashboardSidebar activeView={activeView} setActiveView={handleViewChange} userRole={userRole} />
      <div className="flex flex-col w-full">
        <Header />
        <main className="flex-grow p-4 md:p-6 lg:p-8 bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
