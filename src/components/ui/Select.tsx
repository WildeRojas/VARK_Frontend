'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  nullable?: boolean;
  nullLabel?: string;
}

export default function Select({
  label,
  options,
  value = '',
  onChange,
  error,
  nullable = false,
  nullLabel = 'Ninguno',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const hasValue = value !== '';
  const isActive = open || hasValue;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange?.(val);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          padding: '22px 40px 8px 14px',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--danger)' : open ? 'var(--border-active)' : 'var(--border-glass)'}`,
          background: 'var(--bg-glass)',
          cursor: 'pointer',
          boxShadow: open
            ? `0 0 0 3px ${error ? 'rgba(255,82,82,0.15)' : 'rgba(59,110,248,0.2)'}`
            : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          minHeight: 52,
          userSelect: 'none',
        }}
      >
        {/* Floating label */}
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: isActive ? 8 : '50%',
            transform: isActive ? 'none' : 'translateY(-50%)',
            fontSize: isActive ? '0.68rem' : '0.875rem',
            fontWeight: isActive ? 600 : 400,
            color: error ? 'var(--danger)' : open ? 'var(--accent-blue)' : 'var(--text-muted)',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            pointerEvents: 'none',
            transition: 'all 0.15s ease',
            letterSpacing: isActive ? '0.05em' : '0',
            textTransform: isActive ? 'uppercase' : 'none',
          }}
        >
          {label}
        </span>

        {/* Selected value */}
        {hasValue && (
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            {selectedOption?.label ?? value}
          </span>
        )}

        {/* Chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'rgba(8,16,45,0.97)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 50,
              overflow: 'hidden',
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {nullable && (
              <DropdownItem
                label={nullLabel}
                isSelected={!hasValue}
                onClick={handleClear}
                muted
              />
            )}
            {options.map((opt) => (
              <DropdownItem
                key={opt.value}
                label={opt.label}
                isSelected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              margin: '5px 0 0 4px',
              fontSize: '0.72rem',
              color: 'var(--danger)',
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({
  label,
  isSelected,
  onClick,
  muted = false,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  muted?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        color: muted
          ? 'var(--text-muted)'
          : isSelected
            ? 'var(--accent-blue)'
            : 'var(--text-secondary)',
        fontWeight: isSelected ? 600 : 400,
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        background: isSelected
          ? 'rgba(59,110,248,0.1)'
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {label}
      {isSelected && !muted && <Check size={13} />}
    </div>
  );
}
