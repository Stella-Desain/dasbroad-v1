import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, loading } = useAuthStore();
  const { sidebarCollapsed } = useAppStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background isolate">
      <Header />
      <Sidebar />
      <main
        className={cn(
          'pt-[64px] min-h-screen transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'pl-[72px]' : 'pl-[256px]'
        )}
      >
        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
