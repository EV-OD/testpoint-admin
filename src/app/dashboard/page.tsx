"use client";

import { useEffect, useState } from 'react';
import { UserManagement } from '@/components/dashboard/users/UserManagement';
import { GroupManagement } from '@/components/dashboard/groups/GroupManagement';
import { TestManagement } from '@/components/dashboard/tests/TestManagement';
import { ProfilePage } from '@/components/dashboard/profile/ProfilePage';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type View = 'users' | 'groups' | 'tests' | 'profile';

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const [view, setView] = useState<View | null>(null);

    useEffect(() => {
        const viewParam = (searchParams.get('view') as View) || 'users';
        setView(viewParam);
    }, [searchParams]);

    const renderContent = () => {
        if (!view) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }

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

  return renderContent();
}
