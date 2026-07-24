'use client';

import BackgroundPattern from '@/components/layout/BackgroundPattern';

/**
 * Fondo de "figuritas" de la app (todos los roles).
 * Reutiliza el patrón del login pero atenuado y con un velo para garantizar el
 * contraste del contenido. Tema-aware: la opacidad del patrón y del velo se
 * controlan con variables CSS (`--doodle-opacity`, `--doodle-veil`) que cambian
 * entre claro y oscuro.
 */
export default function AppBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {/* Patrón de doodles, atenuado según el tema */}
      <div style={{ position: 'absolute', inset: 0, opacity: 'var(--doodle-opacity)' }}>
        <BackgroundPattern />
      </div>
      {/* Velo para asegurar legibilidad del contenido por encima */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 120% at 70% 10%, transparent 0%, var(--bg-app) 80%)',
          opacity: 'var(--doodle-veil)',
        }}
      />
    </div>
  );
}
