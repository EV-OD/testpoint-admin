
"use client";

import React from 'react';
import Header from '@/components/Header';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export type View = 'users' | 'groups' | 'tests';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
}

export function DashboardLayout({ children, activeView, setActiveView }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex flex-col w-full">
        <Header />
        <main className="flex-grow p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
