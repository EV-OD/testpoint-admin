"use client";

import { useState } from 'react';
import { UserManagement } from '@/components/dashboard/users/UserManagement';
import { GroupManagement } from '@/components/dashboard/groups/GroupManagement';
import { TestManagement } from '@/components/dashboard/tests/TestManagement';
import { ProfilePage } from '@/components/dashboard/profile/ProfilePage';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [view, setView] = useState<'users' | 'groups' | 'tests' | 'profile'>('users');
  
    const renderContent = () => {
        switch (view) {
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

    // This is now handled by the layout. We just need to decide what to show
    // when the user lands on /dashboard. We can redirect or show a default.
    // Let's redirect to users view for now.
    const pathname = usePathname();
    if (pathname === '/dashboard') {
        const lastView = localStorage.getItem('lastDashboardView') || 'users';
        let componentToRender;
        switch(lastView) {
            case 'users':
                componentToRender = <UserManagement />;
                break;
            case 'groups':
                componentToRender = <GroupManagement />;
                break;
            case 'tests':
                componentToRender = <TestManagement />;
                break;
            case 'profile':
                componentToRender = <ProfilePage />;
                break;
            default:
                componentToRender = <UserManagement />;
        }
        return componentToRender;
    }

  // The layout will render the correct page content based on the URL
  return null;
}
