'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AppBackground from '@/components/layout/AppBackground';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import Spinner from '@/components/ui/Spinner';

function Shell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  // Mientras resolvemos sesión/rol, evitamos mostrar la UID equivocada
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
          zIndex: 1,
          marginLeft: 'var(--sidebar-width)',
          marginTop: 'var(--topbar-height)',
          padding: '28px',
          minHeight: 'calc(100vh - var(--topbar-height))',
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
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
