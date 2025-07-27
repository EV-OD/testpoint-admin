
"use client";

import { useState } from 'react';
import { UserManagement } from '@/components/dashboard/users/UserManagement';
import { GroupManagement } from '@/components/dashboard/groups/GroupManagement';
import { TestManagement } from '@/components/dashboard/tests/TestManagement';
import { ProfilePage } from '@/components/dashboard/profile/ProfilePage';
import { DashboardLayout, type View } from '@/components/dashboard/DashboardLayout';

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
      case 'profile':
        return <ProfilePage />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </DashboardLayout>
  );
}
