

'use client';

import { DashboardLayout, type View } from '@/components/dashboard/DashboardLayout';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<View>('users');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // If a teacher somehow lands on the admin dashboard, redirect them.
          if (data.role === 'teacher') {
            router.replace('/teacher');
            return;
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);


  useEffect(() => {
    if (loading || !user) return;
    
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
        // Default view for admin
        const lastView = localStorage.getItem('lastDashboardView') as View | null;
        const viewToNavigate = lastView || 'users';
        
        setActiveView(viewToNavigate);
        router.replace(`/dashboard?view=${viewToNavigate}`);
    }
  }, [pathname, router, user, loading]);

  const handleSetActiveView = (view: View) => {
      setActiveView(view);
      localStorage.setItem('lastDashboardView', view);
      router.push(`/dashboard?view=${view}`);
  }

  if (loading || (user?.role === 'teacher')) {
    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Skeleton className="w-64 flex-shrink-0" />
            <div className="flex flex-col w-full">
                <Skeleton className="h-16" />
                <main className="flex-grow p-4 md:p-6 lg:p-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </main>
            </div>
        </div>
    )
  }

  return (
    <DashboardLayout 
      activeView={activeView} 
      setActiveView={handleSetActiveView}
      userRole={user?.role || null}
    >
      {children}
    </DashboardLayout>
  );
}
