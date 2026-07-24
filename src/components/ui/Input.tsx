'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { InputHTMLAttributes, useState, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  rightElement,
  id,
  value,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';
  const floatLabel = focused || hasValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Label flotante */}
      <motion.label
        htmlFor={id}
        animate={{
          top: floatLabel ? 8 : '50%',
          fontSize: floatLabel ? '0.7rem' : '0.875rem',
          color: focused
            ? 'var(--accent-blue)'
            : error
            ? 'var(--danger)'
            : 'var(--text-muted)',
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          left: icon ? 40 : 16,
          transform: floatLabel ? 'translateY(0)' : 'translateY(-50%)',
          pointerEvents: 'none',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          fontWeight: 500,
          letterSpacing: floatLabel ? '0.08em' : undefined,
          textTransform: floatLabel ? 'uppercase' : undefined,
          zIndex: 1,
        }}
      >
        {label}
      </motion.label>

      {/* Ícono izquierdo */}
      {icon && (
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? 'var(--accent-blue)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s',
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}

      {/* Input */}
      <input
        id={id}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          width: '100%',
          paddingTop: 24,
          paddingBottom: 8,
          paddingLeft: icon ? 40 : 16,
          paddingRight: rightElement ? 48 : 16,
          background: 'var(--bg-glass)',
          border: `1px solid ${
            error
              ? 'var(--danger)'
              : focused
              ? 'var(--border-active)'
              : 'var(--border-glass)'
          }`,
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 500,
          outline: 'none',
          boxShadow: focused
            ? error
              ? '0 0 0 3px rgba(255,82,82,0.15)'
              : '0 0 0 3px rgba(59,110,248,0.2)'
            : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        {...rest}
      />

      {/* Elemento derecho (ej: toggle password) */}
      {rightElement && (
        <span
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          {rightElement}
        </span>
      )}

      {/* Mensaje de error */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              margin: '4px 0 0 4px',
              fontSize: '0.75rem',
              color: 'var(--danger)',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
