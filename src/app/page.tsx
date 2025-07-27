
"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import { UserManagement } from '@/components/dashboard/users/UserManagement';
import { GroupManagement } from '@/components/dashboard/groups/GroupManagement';
import { TestManagement } from '@/components/dashboard/tests/TestManagement';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

type View = 'users' | 'groups' | 'tests';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('users');

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />;
      case 'groups':
        return <GroupManagement />;
      case 'tests':
        return <TestManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />
          <SidebarInset>
            <main className="flex-grow p-4 md:p-6 lg:p-8">
              {renderContent()}
            </main>
          </SidebarInset>
        </div>
        <footer className="py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TestPoint Admin. All Rights Reserved.
        </footer>
      </div>
    </SidebarProvider>
  );
}
