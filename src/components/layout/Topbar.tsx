'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, BookOpen, CheckCircle2, Brain, Info,
  CheckCheck, ChevronRight, BellOff, User, LogOut, ChevronDown, Sun, Moon,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from '@/lib/api/analitica';
import type { NotificacionAPI } from '@/lib/api/types';
import { useAuth, type Rol } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';

const ROL_LABEL: Record<Rol, string> = {
  administrador: 'Administrador', docente: 'Docente', estudiante: 'Estudiante',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'recurso' | 'quiz' | 'perfil' | 'sistema';
type TabId = 'todas' | 'sinleer' | 'recursos' | 'sistema';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_NOTIFS: Notif[] = [
  {
    id: 'n1',
    type: 'recurso',
    title: 'Nuevo recurso recomendado',
    description: 'Se añadió "Algoritmos Visuales" basado en tu perfil Visual.',
    time: 'hace 5 min',
    read: false,
    href: '/recursos',
  },
  {
    id: 'n2',
    type: 'quiz',
    title: 'Quiz disponible',
    description: 'Tienes un nuevo cuestionario VARK adaptado a tu nivel.',
    time: 'hace 23 min',
    read: false,
    href: '/vark-test',
  },
  {
    id: 'n3',
    type: 'perfil',
    title: 'Perfil VARK actualizado',
    description: 'Tu dimensión Kinestésica aumentó +8 puntos esta semana.',
    time: 'hace 1 h',
    read: false,
    href: '/historial',
  },
  {
    id: 'n4',
    type: 'recurso',
    title: 'Recurso completado detectado',
    description: '"Estructuras de Datos en C++" fue marcado como completado.',
    time: 'hace 3 h',
    read: false,
    href: '/recursos',
  },
  {
    id: 'n5',
    type: 'sistema',
    title: 'Mantenimiento programado',
    description: 'El sistema estará en mantenimiento el 12 de mayo de 2:00–4:00 AM.',
    time: 'ayer',
    read: true,
  },
  {
    id: 'n6',
    type: 'quiz',
    title: 'Resultado de quiz registrado',
    description: 'Obtuviste 87/100 en el cuestionario de Programación II.',
    time: 'ayer',
    read: true,
    href: '/vark-test',
  },
  {
    id: 'n7',
    type: 'recurso',
    title: '3 recursos nuevos en tu área',
    description: 'Se agregaron recursos de Auditivo que coinciden con tu perfil.',
    time: 'hace 2 días',
    read: true,
    href: '/recursos',
  },
  {
    id: 'n8',
    type: 'sistema',
    title: 'Actualización de política',
    description: 'Los términos de uso del sistema han sido actualizados.',
    time: 'hace 3 días',
    read: true,
  },
];

// ─── API → UI helper ───────────────────────────────────────────────────────────────

function toNotif(n: NotificacionAPI): Notif {
  const TIPO_MAP: Record<string, NotifType> = {
    nuevo_recurso: 'recurso',
    nuevo_quiz:    'quiz',
    sistema:       'sistema',
  };
  const HREF_MAP: Record<string, string> = {
    nuevo_recurso: '/recursos',
    nuevo_quiz:    '/quiz',
  };
  return {
    id:          String(n.id),
    type:        TIPO_MAP[n.tipo] ?? 'sistema',
    title:       n.titulo,
    description: n.mensaje,
    time:        new Date(n.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }),
    read:        n.leida,
    href:        HREF_MAP[n.tipo],
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<NotifType, { Icon: typeof Bell; color: string; bg: string }> = {
  recurso: { Icon: BookOpen,      color: 'var(--accent-blue)',   bg: 'rgba(59,110,248,0.14)' },
  quiz:    { Icon: CheckCircle2,  color: 'var(--accent-cyan)',   bg: 'rgba(6,182,212,0.14)'  },
  perfil:  { Icon: Brain,         color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.14)' },
  sistema: { Icon: Info,          color: 'var(--text-muted)',    bg: 'rgba(255,255,255,0.06)'},
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'todas',   label: 'Todas'    },
  { id: 'sinleer', label: 'Sin leer' },
  { id: 'recursos',label: 'Recursos' },
  { id: 'sistema', label: 'Sistema'  },
];

// ─── Topbar ───────────────────────────────────────────────────────────────────

function MenuItem({ onClick, icon, label, danger }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2, background: 'var(--bg-glass-hover)' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', fontSize: '0.82rem', fontWeight: 500,
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

export default function Topbar() {
  const router                  = useRouter();
  const { user, logout }        = useAuth();
  const { theme, toggleTheme }  = useTheme();
  const [open, setOpen]         = useState(false);
  const [tab, setTab]           = useState<TabId>('todas');
  const [notifs, setNotifs]     = useState<Notif[]>(INITIAL_NOTIFS);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const loadedRef               = useRef(false);

  const iniciales = user
    ? (user.nombre?.[0] ?? '') + (user.apellido?.[0] ?? '')
    : 'U';

  // CU-22: Cargar notificaciones la primera vez que se abre el panel
  useEffect(() => {
    if (!open || loadedRef.current) return;
    listarNotificaciones()
      .then((data) => {
        // Mockups: si el backend no devuelve nada, conservamos las demo para
        // que el panel nunca se vea vacío (notificaciones pendientes de Firebase).
        if (data.length > 0) setNotifs(data.map(toNotif));
        loadedRef.current = true;
      })
      .catch(() => {}); // Mantener INITIAL_NOTIFS como fallback
  }, [open]);

  const unread = notifs.filter((n) => !n.read).length;

  const filtered = notifs.filter((n) => {
    if (tab === 'sinleer')  return !n.read;
    if (tab === 'recursos') return n.type === 'recurso';
    if (tab === 'sistema')  return n.type === 'sistema';
    return true;
  });

  const tabCount = (id: TabId) => {
    if (id === 'todas')    return notifs.length;
    if (id === 'sinleer')  return notifs.filter((n) => !n.read).length;
    if (id === 'recursos') return notifs.filter((n) => n.type === 'recurso').length;
    if (id === 'sistema')  return notifs.filter((n) => n.type === 'sistema').length;
    return 0;
  };

  const markRead = useCallback((id: string) => {
    marcarNotificacionLeida(Number(id)).catch(() => {});
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    marcarTodasLeidas().catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotif = useCallback((id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const openDrawer = () => {
    setOpen(true);
  };

  return (
    <>
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 'var(--sidebar-width)',
          right: 0,
          height: 'var(--topbar-height)',
          background: 'var(--bg-topbar)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          gap: 10,
          zIndex: 30,
        }}
      >
        {/* Theme toggle (claro/oscuro) */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          aria-label="Cambiar tema"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'background 0.18s, border-color 0.18s, color 0.18s',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              {theme === 'dark'
                ? <Moon size={15} color="var(--accent-cyan)" />
                : <Sun size={15} color="var(--warning)" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Notification bell */}
        <motion.button
          onClick={openDrawer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: open ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
            border: `1px solid ${open ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: open ? 'var(--accent-blue)' : 'var(--text-muted)',
            flexShrink: 0,
            transition: 'background 0.18s, border-color 0.18s, color 0.18s',
          }}
        >
          <Bell size={15} />

          {/* Unread badge */}
          <AnimatePresence>
            {unread > 0 && (
              <motion.div
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 99,
                  background: 'var(--danger)',
                  border: '2px solid var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  padding: '0 3px',
                }}
              >
                {unread > 9 ? '9+' : unread}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User avatar + menú */}
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={() => setMenuOpen((v) => !v)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              background: menuOpen ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
              border: `1px solid ${menuOpen ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
              cursor: 'pointer',
              transition: 'background 0.18s, border-color 0.18s',
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: user?.foto
                  ? `url(${user.foto}) center/cover`
                  : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'var(--font-syne), Syne, sans-serif',
                flexShrink: 0,
              }}
            >
              {!user?.foto && iniciales}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', lineHeight: 1.2 }}>
                {user?.nombre_completo ?? 'Usuario'}
              </p>
              <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                {user ? ROL_LABEL[user.rol as Rol] : ''}
              </p>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 35 }} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 190,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 36,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  <MenuItem onClick={() => { setMenuOpen(false); router.push('/perfil'); }} icon={<User size={15} />} label="Mi perfil" />
                  <div style={{ height: 1, background: 'var(--border-glass)' }} />
                  <MenuItem onClick={() => { setMenuOpen(false); logout(); }} icon={<LogOut size={15} />} label="Cerrar sesión" danger />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* ── Overlay ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#000',
              zIndex: 48,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="notif-drawer"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 380,
              height: '100dvh',
              background: 'rgba(7,14,36,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid var(--border-glass)',
              boxShadow: '-12px 0 48px rgba(0,0,0,0.6)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px 14px',
              borderBottom: '1px solid var(--border-glass)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell size={16} color="var(--accent-blue)" />
                <span style={{
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                  fontWeight: 700, fontSize: '1rem',
                  color: 'var(--text-primary)',
                }}>
                  Notificaciones
                </span>
                {unread > 0 && (
                  <Badge variant="default" size="sm">{unread} sin leer</Badge>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {unread > 0 && (
                  <motion.button
                    onClick={markAllRead}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    title="Marcar todas como leídas"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600,
                      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                      padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <CheckCheck size={13} />
                    Marcar todas
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setOpen(false)}
                  whileHover={{ scale: 1.08, background: 'var(--bg-glass-hover)' }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-glass)',
              padding: '0 12px',
              gap: 2,
              flexShrink: 0,
            }}>
              {TABS.map((t) => {
                const active = tab === t.id;
                const cnt = tabCount(t.id);
                return (
                  <motion.button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    whileHover={{ color: 'var(--text-primary)' }}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '11px 10px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                      fontSize: '0.78rem', fontWeight: active ? 700 : 400,
                      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                      transition: 'color 0.15s',
                    }}
                  >
                    {t.label}
                    <span style={{
                      fontSize: '0.64rem', fontWeight: 700,
                      background: active ? 'rgba(59,110,248,0.18)' : 'rgba(255,255,255,0.06)',
                      color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                      padding: '1px 5px', borderRadius: 99,
                      transition: 'background 0.15s, color 0.15s',
                    }}>
                      {cnt}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="notif-tab-indicator"
                        style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: 2, background: 'var(--accent-blue)', borderRadius: '2px 2px 0 0',
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 14, padding: '60px 20px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BellOff size={22} color="var(--text-muted)" />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', textAlign: 'center', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                      No tienes notificaciones
                    </p>
                  </motion.div>
                ) : (
                  filtered.map((n, i) => {
                    const cfg = TYPE_CFG[n.type];
                    const Icon = cfg.Icon;
                    const isHovered = hoveredId === n.id;

                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.22, delay: i * 0.03 }}
                        onHoverStart={() => setHovered(n.id)}
                        onHoverEnd={() => setHovered(null)}
                        onClick={() => markRead(n.id)}
                        style={{
                          position: 'relative',
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                          padding: '13px 18px',
                          margin: '0 8px 4px',
                          borderRadius: 'var(--radius-md)',
                          background: n.read ? 'transparent' : 'rgba(59,110,248,0.06)',
                          border: `1px solid ${n.read ? 'transparent' : 'rgba(59,110,248,0.12)'}`,
                          cursor: 'pointer',
                          transition: 'background 0.25s, border-color 0.25s',
                        }}
                      >
                        {/* Unread dot */}
                        {!n.read && (
                          <div style={{
                            position: 'absolute', top: 14, left: 6,
                            width: 5, height: 5, borderRadius: '50%',
                            background: 'var(--accent-blue)',
                            flexShrink: 0,
                          }} />
                        )}

                        {/* Icon */}
                        <div style={{
                          width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                          background: cfg.bg, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: 1,
                        }}>
                          <Icon size={15} color={cfg.color} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: n.read ? 500 : 700,
                              color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                              lineHeight: 1.3,
                              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                            }}>
                              {n.title}
                            </span>
                          </div>
                          <p style={{
                            margin: '0 0 5px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.4,
                            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                          }}>
                            {n.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {n.time}
                            </span>
                            {n.href && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: 'var(--accent-blue)' }}>
                                Ver <ChevronRight size={10} />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete button — appears on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.button
                              key="del"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.14 }}
                              onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                              style={{
                                position: 'absolute', top: 10, right: 10,
                                width: 22, height: 22, borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid var(--border-glass)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                                flexShrink: 0,
                              }}
                            >
                              <X size={11} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-glass)',
              flexShrink: 0,
            }}>
              <Button
                variant="ghost"
                fullWidth
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem' }}
              >
                Ver todas las notificaciones
                <ChevronRight size={13} />
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

