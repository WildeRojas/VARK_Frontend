'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AppBackground from '@/components/layout/AppBackground';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';
import Spinner from '@/components/ui/Spinner';

function Shell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const { isCollapsed, isMobile } = useSidebar();

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner />
      </div>
    );
  }

  const currentSidebarWidth = isMobile
    ? '0px'
    : isCollapsed
      ? 'var(--sidebar-collapsed-width, 72px)'
      : 'var(--sidebar-width, 240px)';

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'transparent',
      }}
    >
      <AppBackground />
      <Sidebar />
      <Topbar />
      <main
        style={{
          position: 'relative',
          marginLeft: currentSidebarWidth,
          marginTop: 'var(--topbar-height)',
          padding: '24px 28px',
          minHeight: 'calc(100vh - var(--topbar-height))',
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Shell>{children}</Shell>
      </SidebarProvider>
    </AuthProvider>
  );
}
