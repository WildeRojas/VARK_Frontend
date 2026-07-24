'use client';

import { ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'vark-v'
  | 'vark-a'
  | 'vark-r'
  | 'vark-k'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ghost';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  default:  { color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.06)', border: 'var(--border-glass)' },
  'vark-v': { color: 'var(--vark-v)',         bg: 'rgba(59,110,248,0.12)',  border: 'rgba(59,110,248,0.3)' },
  'vark-a': { color: 'var(--vark-a)',         bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'vark-r': { color: 'var(--vark-r)',         bg: 'rgba(0,212,255,0.12)',   border: 'rgba(0,212,255,0.3)' },
  'vark-k': { color: 'var(--vark-k)',         bg: 'rgba(0,230,118,0.12)',   border: 'rgba(0,230,118,0.3)' },
  success:  { color: 'var(--success)',        bg: 'rgba(0,230,118,0.1)',    border: 'rgba(0,230,118,0.3)' },
  warning:  { color: 'var(--warning)',        bg: 'rgba(255,215,64,0.1)',   border: 'rgba(255,215,64,0.3)' },
  danger:   { color: 'var(--danger)',         bg: 'rgba(255,82,82,0.1)',    border: 'rgba(255,82,82,0.3)' },
  info:     { color: 'var(--info)',           bg: 'rgba(0,212,255,0.1)',    border: 'rgba(0,212,255,0.3)' },
  ghost:    { color: 'var(--text-muted)',     bg: 'transparent',            border: 'var(--border-glass)' },
};

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
        fontWeight: 700,
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
