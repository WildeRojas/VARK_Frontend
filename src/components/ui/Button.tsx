'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent-blue)',
    color: 'var(--text-primary)',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-glass)',
  },
  danger: {
    background: 'var(--danger)',
    color: 'var(--text-primary)',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: 'var(--accent-blue)',
    border: '1px solid var(--accent-blue)',
  },
  icon: {
    background: 'var(--bg-glass)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-glass)',
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
  },
};

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ filter: 'brightness(1.12)' }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: variant === 'icon' ? '8px' : '12px 24px',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'background 0.2s, border-color 0.2s',
        ...variantStyles[variant],
        ...style,
      }}
      {...(rest as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {loading ? <Spinner size={18} /> : children}
    </motion.button>
  );
}
