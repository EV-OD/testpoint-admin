
'use client';

import { DashboardLayout, type View } from '@/components/dashboard/DashboardLayout';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<View>('users');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Determine view based on URL
    if (pathname.includes('/dashboard/users')) {
      setActiveView('users');
    } else if (pathname.includes('/dashboard/groups')) {
      setActiveView('groups');
    } else if (pathname.includes('/dashboard/tests')) {
      setActiveView('tests');
    } else if (pathname.includes('/dashboard/profile')) {
        setActiveView('profile');
    } else if (pathname === '/dashboard') {
        // If on the root dashboard, check local storage for the last view
        // This code now safely runs only on the client
        const lastView = localStorage.getItem('lastDashboardView') as View | null;
        const viewToNavigate = lastView || 'users';
        setActiveView(viewToNavigate);
        router.replace(`/dashboard?view=${viewToNavigate}`);
    }
  }, [pathname, router]);

  const handleSetActiveView = (view: View) => {
      setActiveView(view);
      localStorage.setItem('lastDashboardView', view);
      router.push(`/dashboard?view=${view}`);
  }

  return (
    <DashboardLayout activeView={activeView} setActiveView={handleSetActiveView}>
      {children}
    </DashboardLayout>
  );
}
