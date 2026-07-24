'use client';

import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: number;
}

export default function Spinner({ size = 20 }: SpinnerProps) {
  return (
    <motion.span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid rgba(255,255,255,0.2)`,
        borderTopColor: 'var(--accent-blue)',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      aria-label="Cargando"
    />
  );
}
