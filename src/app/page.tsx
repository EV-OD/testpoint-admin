import Header from '@/components/Header';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <DashboardTabs />
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TestPoint Admin. All Rights Reserved.
      </footer>
    </div>
  );
}
