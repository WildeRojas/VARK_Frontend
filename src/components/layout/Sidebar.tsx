'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Brain,
  BookOpen,
  HelpCircle,
  FileText,
  Sparkles,
  Clock,
  BarChart3,
  Settings,
  Activity,
  FlaskConical,
  LogOut,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useAuth, type Rol } from '@/lib/auth/AuthContext';
import { useSidebar } from '@/components/layout/SidebarContext';
import { useState } from 'react';

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV_GENERAL: Record<Rol, NavItem[]> = {
  estudiante: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/test-vark', label: 'Test VARK', icon: Brain },
    { href: '/temas', label: 'Temas', icon: BookOpen },
    { href: '/recursos', label: 'Recursos', icon: FileText },
    { href: '/recomendaciones', label: 'Recomendaciones', icon: Sparkles },
    { href: '/historial', label: 'Historial', icon: Clock },
  ],
  docente: [
    { href: '/temas', label: 'Temas', icon: BookOpen },
    { href: '/preguntas', label: 'Preguntas', icon: HelpCircle },
    { href: '/recursos', label: 'Recursos', icon: FileText },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  ],
  administrador: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/estudiantes', label: 'Estudiantes', icon: GraduationCap },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/temas', label: 'Temas', icon: BookOpen },
    { href: '/preguntas', label: 'Preguntas', icon: HelpCircle },
    { href: '/recursos', label: 'Recursos', icon: FileText },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  ],
};

const NAV_ADMIN: NavItem[] = [
  { href: '/admin/test-vark', label: 'Test VARK', icon: Brain },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  { href: '/admin/clickstream', label: 'Clickstream', icon: Activity },
  { href: '/admin/experimento', label: 'Experimento A/B', icon: FlaskConical },
];

const ROL_LABEL: Record<Rol, string> = {
  administrador: 'Administrador',
  docente: 'Docente',
  estudiante: 'Estudiante',
};

function NavItemComponent({
  item,
  active,
  isCollapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative', marginBottom: 3 }}>
      <Link
        href={item.href}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <motion.div
          whileHover={{ x: isCollapsed ? 0 : 3, scale: isCollapsed ? 1.05 : 1 }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 12,
            padding: isCollapsed ? '10px 0' : '9px 12px',
            borderRadius: 'var(--radius-md, 12px)',
            background: active
              ? 'rgba(59,110,248,0.15)'
              : hovered
                ? 'var(--bg-glass-hover, rgba(255,255,255,0.06))'
                : 'transparent',
            border: `1px solid ${active ? 'rgba(59,110,248,0.35)' : 'transparent'}`,
            boxShadow: active ? '0 0 14px rgba(59,110,248,0.16)' : 'none',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
            position: 'relative',
          }}
        >
          <item.icon
            size={18}
            color={active ? 'var(--accent-blue)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
            strokeWidth={active ? 2.2 : 1.8}
            style={{ flexShrink: 0 }}
          />

          {!isCollapsed && (
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.label}
            </span>
          )}

          {active && !isCollapsed && (
            <motion.span
              layoutId="nav-active-dot"
              style={{
                marginLeft: 'auto',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent-blue)',
                boxShadow: '0 0 8px var(--accent-blue)',
                flexShrink: 0,
              }}
            />
          )}

          {active && isCollapsed && (
            <span
              style={{
                position: 'absolute',
                right: 3,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 4,
                height: 16,
                borderRadius: 4,
                background: 'var(--accent-blue)',
                boxShadow: '0 0 8px var(--accent-blue)',
              }}
            />
          )}
        </motion.div>
      </Link>

      {/* Tooltip on Collapsed Mode */}
      <AnimatePresence>
        {isCollapsed && hovered && (
          <motion.div
            initial={{ opacity: 0, x: 6, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, scale: 0.92 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute',
              left: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(8, 16, 45, 0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm, 8px)',
              fontSize: '0.78rem',
              fontWeight: 600,
              fontFamily: 'var(--font-dm-sans)',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen, isMobile } = useSidebar();
  const rol = (user?.rol ?? 'estudiante') as Rol;
  const generalNav = NAV_GENERAL[rol] ?? NAV_GENERAL.estudiante;

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const sidebarWidth = isCollapsed ? 'var(--sidebar-collapsed-width, 72px)' : 'var(--sidebar-width, 240px)';

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 49,
            }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: isMobile ? (isMobileOpen ? 0 : -280) : 0,
        }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: isMobile && isMobileOpen ? '0 0 32px rgba(0,0,0,0.6)' : 'none',
        }}
        className="modal-scrollbar"
      >
        {/* Header / Brand */}
        <div
          style={{
            padding: isCollapsed ? '16px 8px' : '16px 14px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            flexShrink: 0,
            minHeight: 'var(--topbar-height)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(59,110,248,0.18)',
                border: '1px solid rgba(59,110,248,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 3L4 8.5V19.5L14 25L24 19.5V8.5L14 3Z"
                  stroke="#3b6ef8"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 3V25M4 8.5L14 14L24 8.5"
                  stroke="#00d4ff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  opacity="0.75"
                />
              </svg>
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  VARK
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-dm-sans)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Aprendizaje adaptativo
                </p>
              </motion.div>
            )}
          </div>

          {/* Collapse/Expand Toggle Button */}
          {!isMobile ? (
            <motion.button
              onClick={toggleCollapse}
              whileHover={{ scale: 1.1, background: 'var(--bg-glass-hover)' }}
              whileTap={{ scale: 0.92 }}
              title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                marginLeft: isCollapsed ? 0 : 6,
                flexShrink: 0,
              }}
            >
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </motion.button>
          ) : (
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, padding: isCollapsed ? '14px 8px' : '14px 10px', display: 'flex', flexDirection: 'column' }}>
          {!isCollapsed && (
            <p
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-dm-sans)',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                margin: '0 0 8px 6px',
              }}
            >
              General
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {generalNav.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                active={isActive(item.href)}
                isCollapsed={isCollapsed}
                onClick={isMobile ? () => setMobileOpen(false) : undefined}
              />
            ))}
          </div>

          {rol === 'administrador' && (
            <>
              <div
                style={{
                  height: 1,
                  background: 'var(--border-glass)',
                  margin: '14px 6px',
                }}
              />
              {!isCollapsed && (
                <p
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-dm-sans)',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px 6px',
                  }}
                >
                  Admin
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NAV_ADMIN.map((item) => (
                  <NavItemComponent
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    isCollapsed={isCollapsed}
                    onClick={isMobile ? () => setMobileOpen(false) : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Footer */}
        <div
          style={{
            padding: isCollapsed ? '12px 6px' : '12px 10px',
            borderTop: '1px solid var(--border-glass)',
            flexShrink: 0,
            background: 'rgba(5,11,31,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(59,110,248,0.2)',
                  border: '1px solid rgba(59,110,248,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--accent-blue)',
                  fontFamily: 'var(--font-dm-sans)',
                  flexShrink: 0,
                }}
              >
                {user ? ((user.nombre?.[0] ?? '') + (user.apellido?.[0] ?? '')).toUpperCase() || 'U' : 'U'}
              </div>

              {!isCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-dm-sans)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user ? `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || user.email : 'Usuario'}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-dm-sans)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {ROL_LABEL[rol] ?? rol}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.1, color: 'var(--danger)' }}
                whileTap={{ scale: 0.92 }}
                title="Cerrar sesión"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 6,
                  borderRadius: 6,
                }}
              >
                <LogOut size={15} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
