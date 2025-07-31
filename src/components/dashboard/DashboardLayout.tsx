
"use client";

import React from 'react';
import Header from '@/components/Header';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useRouter } from 'next/navigation';

export type View = 'users' | 'groups' | 'tests' | 'profile';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
}

export function DashboardLayout({ children, activeView, setActiveView }: DashboardLayoutProps) {
  const router = useRouter();
  
  const handleViewChange = (view: View) => {
    setActiveView(view);
    // Navigate to a placeholder page if we create a dedicated page later
    if (view === 'users' || view === 'groups' || view === 'tests' || view === 'profile') {
        // For now, we manage view in the main dashboard page state
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar activeView={activeView} setActiveView={handleViewChange} />
      <div className="flex flex-col w-full">
        <Header />
        <main className="flex-grow p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
