
'use client';

import { DashboardLayout, type View } from '@/components/dashboard/DashboardLayout';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<View>('users');
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('/dashboard/users')) {
      setActiveView('users');
    } else if (pathname.includes('/dashboard/groups')) {
      setActiveView('groups');
    } else if (pathname.includes('/dashboard/tests')) {
      setActiveView('tests');
    } else if (pathname.includes('/dashboard/profile')) {
        setActiveView('profile');
    } else if (pathname === '/dashboard') {
        const lastView = localStorage.getItem('lastDashboardView') as View | null;
        setActiveView(lastView || 'users');
    }
  }, [pathname]);

  const handleSetActiveView = (view: View) => {
      setActiveView(view);
      localStorage.setItem('lastDashboardView', view);
  }

  return (
    <DashboardLayout activeView={activeView} setActiveView={handleSetActiveView}>
      {children}
    </DashboardLayout>
  );
}
