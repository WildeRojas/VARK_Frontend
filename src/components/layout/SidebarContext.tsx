'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Load persisted state
    const saved = localStorage.getItem('vark_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vark_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    localStorage.setItem('vark_sidebar_collapsed', String(val));
  };

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const setMobileOpen = (val: boolean) => setIsMobileOpen(val);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setCollapsed,
        isMobileOpen,
        toggleMobile,
        setMobileOpen,
        isMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
