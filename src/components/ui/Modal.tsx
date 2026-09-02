'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}

export default function Modal({ open, onClose, title, children, maxWidth = 580 }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.78)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 100,
            }}
          />

          {/* Panel container */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 101,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              style={{
                width: '100%',
                maxWidth,
                maxHeight: 'min(90vh, 780px)',
                pointerEvents: 'all',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'min(90vh, 780px)',
                  borderRadius: 'var(--radius-xl, 24px)',
                  border: '1px solid var(--border-glass)',
                  background: 'var(--bg-card, rgba(10, 20, 55, 0.92))',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                {title && (
                  <div
                    style={{
                      padding: '20px 24px 16px',
                      borderBottom: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-syne), Syne, sans-serif',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {title}
                    </h2>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, background: 'var(--bg-glass-hover)' }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        transition: 'color 0.15s, background 0.15s',
                      }}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                )}

                {/* Scrollable Content Body */}
                <div
                  className="modal-scrollbar"
                  style={{
                    padding: title ? '22px 24px 24px' : '28px 24px 24px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flex: 1,
                  }}
                >
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
