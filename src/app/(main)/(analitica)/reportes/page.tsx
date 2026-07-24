'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Users, Star, CheckCircle2, BookOpen,
  Download, LayoutGrid, BarChart2,
  Video, FileText, Headphones, Code2,
  Eye, Check, Loader2, Table2, CalendarDays,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge    from '@/components/ui/Badge';
import Button   from '@/components/ui/Button';
import Modal    from '@/components/ui/Modal';
import Select   from '@/components/ui/Select';
import RadarChart from '@/components/ui/RadarChart';
import { reporteDocente, exportarReporte } from '@/lib/api/analitica';
import type { ReporteDocente, RecursoEfectivo, EstudianteBajoEngagement, ExportReporteParams } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type VarkKey    = 'v' | 'a' | 'r' | 'k';
type EstiloVark = 'V' | 'A' | 'R' | 'K';
type TipoView   = 'individual' | 'promedio';
type TipoRecurso = 'video' | 'documento' | 'audio' | 'ejercicio';

interface VarkProfile { v: number; a: number; r: number; k: number }

interface Estudiante {
  id: string; nombre: string; avatar: string;
  dominante: EstiloVark; profile: VarkProfile;
  quizzes: number; recursos: number; ultimaActividad: string;
}

interface RecursoTop {
  pos: number; titulo: string; tipo: TipoRecurso;
  vark: EstiloVark; vistas: number; valoracion: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ESTUDIANTES: Estudiante[] = [
  { id: 'e1', nombre: 'Ana García',      avatar: 'AG', dominante: 'V', profile: { v: 85, a: 60, r: 72, k: 45 }, quizzes: 14, recursos: 32, ultimaActividad: 'Hoy, 14:30'   },
  { id: 'e2', nombre: 'Carlos López',    avatar: 'CL', dominante: 'K', profile: { v: 55, a: 80, r: 40, k: 90 }, quizzes: 11, recursos: 27, ultimaActividad: 'Hoy, 12:15'   },
  { id: 'e3', nombre: 'María Torres',    avatar: 'MT', dominante: 'R', profile: { v: 70, a: 50, r: 88, k: 62 }, quizzes: 16, recursos: 41, ultimaActividad: 'Ayer, 18:00'  },
  { id: 'e4', nombre: 'Jhon Ramírez',    avatar: 'JR', dominante: 'A', profile: { v: 40, a: 75, r: 55, k: 78 }, quizzes: 9,  recursos: 19, ultimaActividad: 'Ayer, 10:30'  },
  { id: 'e5', nombre: 'Luisa Mendoza',   avatar: 'LM', dominante: 'V', profile: { v: 92, a: 45, r: 65, k: 38 }, quizzes: 18, recursos: 45, ultimaActividad: 'Hoy, 09:45'   },
  { id: 'e6', nombre: 'Pedro Salazar',   avatar: 'PS', dominante: 'K', profile: { v: 48, a: 62, r: 58, k: 82 }, quizzes: 7,  recursos: 14, ultimaActividad: 'Hace 3 días'  },
  { id: 'e7', nombre: 'Sofía Vargas',    avatar: 'SV', dominante: 'R', profile: { v: 60, a: 55, r: 80, k: 70 }, quizzes: 13, recursos: 30, ultimaActividad: 'Ayer, 15:20'  },
  { id: 'e8', nombre: 'Diego Herrera',   avatar: 'DH', dominante: 'V', profile: { v: 78, a: 68, r: 74, k: 52 }, quizzes: 12, recursos: 28, ultimaActividad: 'Hoy, 11:00'   },
];

const MOCK_RECURSOS: RecursoTop[] = [
  { pos: 1,  titulo: 'Visualización de Algoritmos de Ordenamiento', tipo: 'video',     vark: 'V', vistas: 342, valoracion: 4.8 },
  { pos: 2,  titulo: 'Podcast: Estructuras de Datos',               tipo: 'audio',     vark: 'A', vistas: 289, valoracion: 4.6 },
  { pos: 3,  titulo: 'Guía completa de Matrices en Python',          tipo: 'documento', vark: 'R', vistas: 201, valoracion: 4.5 },
  { pos: 4,  titulo: 'Ejercicio Interactivo: Recursión',             tipo: 'ejercicio', vark: 'K', vistas: 156, valoracion: 4.7 },
  { pos: 5,  titulo: 'Video: Fundamentos de POO',                    tipo: 'video',     vark: 'V', vistas: 134, valoracion: 4.3 },
  { pos: 6,  titulo: 'Artículo: Complejidad Algorítmica',            tipo: 'documento', vark: 'R', vistas: 118, valoracion: 4.4 },
  { pos: 7,  titulo: 'Ejercicios de Cadenas Paso a Paso',            tipo: 'ejercicio', vark: 'K', vistas: 97,  valoracion: 4.2 },
  { pos: 8,  titulo: 'Podcast: Historia de la Programación',         tipo: 'audio',     vark: 'A', vistas: 82,  valoracion: 4.1 },
  { pos: 9,  titulo: 'Tutorial Visual: Árboles Binarios',            tipo: 'video',     vark: 'V', vistas: 74,  valoracion: 4.6 },
  { pos: 10, titulo: 'Lectura: Patrones de Diseño',                  tipo: 'documento', vark: 'R', vistas: 61,  valoracion: 4.0 },
];

// ─── API → UI helpers ────────────────────────────────────────────────────────

function toEstudiante(e: EstudianteBajoEngagement): Estudiante {
  const parts   = e.nombre.trim().split(' ');
  const avatar  = parts.map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'U';
  return {
    id:              String(e.id),
    nombre:          e.nombre,
    avatar,
    dominante:       'V',
    profile:         { v: 50, a: 50, r: 50, k: 50 },
    quizzes:         0,
    recursos:        0,
    ultimaActividad: 'Sin actividad reciente',
  };
}

function toRecursoTop(r: RecursoEfectivo, pos: number): RecursoTop {
  return {
    pos,
    titulo:    r['recurso__titulo'],
    tipo:      'video',
    vark:      r['recurso__categoria_vark'],
    vistas:    r.total_clics,
    valoracion: 4.0,
  };
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const VARK_CFG: Record<VarkKey, { label: string; color: string; badge: 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k' }> = {
  v: { label: 'Visual',      color: '#3b6ef8', badge: 'vark-v' },
  a: { label: 'Auditivo',    color: '#a78bfa', badge: 'vark-a' },
  r: { label: 'Lectura',     color: '#00d4ff', badge: 'vark-r' },
  k: { label: 'Kinestésico', color: '#00e676', badge: 'vark-k' },
};

const ESTILO_BADGE: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};
const ESTILO_LABEL: Record<EstiloVark, string> = {
  V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico',
};

const TIPO_ICON: Record<TipoRecurso, LucideIcon> = {
  video: Video, documento: FileText, audio: Headphones, ejercicio: Code2,
};
const TIPO_LABEL: Record<TipoRecurso, string> = {
  video: 'Video', documento: 'Artículo', audio: 'Audio', ejercicio: 'Ejercicio',
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const PAGE_VARIANTS = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item:      { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32 } } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupDominant(students: Estudiante[]): EstiloVark {
  const cnt = { V: 0, A: 0, R: 0, K: 0 };
  students.forEach((s) => { cnt[s.dominante]++; });
  return (Object.entries(cnt) as [EstiloVark, number][]).reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

function avgQuizzes(students: Estudiante[]): number {
  return Math.round(students.reduce((s, e) => s + e.quizzes, 0) / students.length);
}

function groupAvgProfile(students: Estudiante[]): VarkProfile {
  const len = students.length;
  return {
    v: Math.round(students.reduce((s, e) => s + e.profile.v, 0) / len),
    a: Math.round(students.reduce((s, e) => s + e.profile.a, 0) / len),
    r: Math.round(students.reduce((s, e) => s + e.profile.r, 0) / len),
    k: Math.round(students.reduce((s, e) => s + e.profile.k, 0) / len),
  };
}

// ─── Custom bar tooltip ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(5,11,31,0.97)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0 0 6px' }}>{label}</p>
      {(payload as { name: string; value: number; fill: string }[]).map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', flex: 1 }}>
            {VARK_CFG[p.name as VarkKey]?.label ?? p.name}
          </span>
          <span style={{ color: p.fill, fontWeight: 700, fontSize: '0.88rem' }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini VARK bar stack ──────────────────────────────────────────────────────

function MiniVarkBars({ profile }: { profile: VarkProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 90 }}>
      {(Object.entries(VARK_CFG) as [VarkKey, typeof VARK_CFG[VarkKey]][]).map(([key, cfg]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: cfg.color, width: 8 }}>
            {key.toUpperCase()}
          </span>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile[key]}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 99, background: cfg.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Export Modal (CU-21) ───────────────────────────────────────────────────

type ExportFormat = 'pdf' | 'csv';
type ExportRange  = 'actual' | '30d' | 'personalizado';
type ExportStatus = 'idle' | 'generating' | 'ready';

const CONTENT_OPTIONS = [
  { key: 'estudiantes',       label: 'Tabla de estudiantes',         pdfOnly: false },
  { key: 'grafico',           label: 'Gráfico de distribución VARK', pdfOnly: true  },
  { key: 'historialRecursos', label: 'Historial de recursos',        pdfOnly: false },
  { key: 'quizzes',           label: 'Métricas de quizzes',          pdfOnly: false },
] as const;

type ContentKey = typeof CONTENT_OPTIONS[number]['key'];

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  initialFormat?: ExportFormat;
}

function ExportModal({ open, onClose, initialFormat = 'pdf' }: ExportModalProps) {
  const [format, setFormat]     = useState<ExportFormat>(initialFormat);
  const [status, setStatus]     = useState<ExportStatus>('idle');
  const [range, setRange]       = useState<ExportRange>('actual');
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo, setDateTo]     = useState('2026-05-10');
  const [content, setContent]   = useState<Record<ContentKey, boolean>>(
    { estudiantes: true, grafico: true, historialRecursos: false, quizzes: true }
  );

  useEffect(() => {
    if (open) { setFormat(initialFormat); setStatus('idle'); setRange('actual'); }
  }, [open, initialFormat]);

  const fileName = useMemo(() => {
    const date = '2026-05-10';
    return `reporte_grupo_A_${date}.${format}`;
  }, [format]);

  const allSelected = CONTENT_OPTIONS.every((o) =>
    (format === 'csv' && o.pdfOnly) ? true : content[o.key]
  );

  const toggleAll = () => {
    const next = !allSelected;
    const updates = { ...content } as Record<ContentKey, boolean>;
    CONTENT_OPTIONS.forEach((o) => { if (format === 'pdf' || !o.pdfOnly) updates[o.key] = next; });
    setContent(updates);
  };

  const handleGenerate = async () => {
    setStatus('generating');
    try {
      const params: ExportReporteParams = { formato: format };
      if (range === '30d') {
        const now = new Date();
        params.fecha_fin = now.toISOString().slice(0, 10);
        now.setDate(now.getDate() - 30);
        params.fecha_inicio = now.toISOString().slice(0, 10);
      } else if (range === 'personalizado') {
        if (dateFrom) params.fecha_inicio = dateFrom;
        if (dateTo)   params.fecha_fin   = dateTo;
      }
      await exportarReporte(params);
      setStatus('ready');
    } catch {
      setStatus('idle');
    }
  };

  const handleClose = () => { setStatus('idle'); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Exportar reporte" maxWidth={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Format selector */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: '0 0 10px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
            Formato
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              { key: 'pdf' as ExportFormat, Icon: FileText, color: '#ff5252', label: 'PDF', desc: 'Reporte visual con gráficos' },
              { key: 'csv' as ExportFormat, Icon: Table2,   color: '#00e676', label: 'CSV', desc: 'Datos crudos para análisis'  },
            ]).map(({ key, Icon, color, label, desc }) => {
              const active = format === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => setFormat(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${active ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                    background: active ? 'rgba(59,110,248,0.08)' : 'var(--bg-glass)',
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: active ? '0 0 0 3px rgba(59,110,248,0.15)' : 'none',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={color} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{label}</span>
                    {active && <Check size={14} color="var(--accent-blue)" style={{ marginLeft: 'auto' }} />}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>{desc}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content checkboxes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
              Contenido a incluir
            </p>
            <motion.button
              onClick={toggleAll}
              whileHover={{ opacity: 0.8 }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', fontWeight: 600, padding: 0 }}
            >
              {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </motion.button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CONTENT_OPTIONS.map((opt) => {
              const disabled = format === 'csv' && opt.pdfOnly;
              const checked  = content[opt.key];
              return (
                <motion.div
                  key={opt.key}
                  whileHover={!disabled ? { background: 'var(--bg-glass-hover)' } : {}}
                  onClick={() => !disabled && setContent((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  <motion.div
                    animate={{
                      background: (checked && !disabled) ? 'var(--accent-blue)' : 'transparent',
                      borderColor: (checked && !disabled) ? 'var(--accent-blue)' : 'rgba(255,255,255,0.15)',
                    }}
                    style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AnimatePresence>
                      {checked && !disabled && (
                        <motion.div
                          key="ck"
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check size={11} color="white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', flex: 1 }}>
                    {opt.label}
                  </span>
                  {opt.pdfOnly && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>Solo PDF</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Range selector */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: '0 0 10px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
            Rango de datos
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              { key: 'actual' as ExportRange,       label: 'Datos actuales'      },
              { key: '30d' as ExportRange,           label: 'Últimos 30 días'    },
              { key: 'personalizado' as ExportRange, label: 'Rango personalizado' },
            ]).map(({ key, label }) => {
              const active = range === key;
              return (
                <motion.div
                  key={key}
                  onClick={() => setRange(key)}
                  whileHover={{ scale: 1.03 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                    background: active ? 'rgba(59,110,248,0.08)' : 'var(--bg-glass)',
                    border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: `1.5px solid ${active ? 'var(--accent-blue)' : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-blue)' }} />}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', fontWeight: active ? 600 : 400 }}>
                    {label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Date pickers */}
          <AnimatePresence>
            {range === 'personalizado' && (
              <motion.div
                key="date-pickers"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.22 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflow: 'hidden' }}
              >
                {([
                  { id: 'from', label: 'Desde', value: dateFrom, set: setDateFrom },
                  { id: 'to',   label: 'Hasta', value: dateTo,   set: setDateTo   },
                ] as { id: string; label: string; value: string; set: (v: string) => void }[]).map(({ id, label, value, set }) => (
                  <div key={id}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                      <CalendarDays size={11} />
                      {label}
                    </div>
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', boxSizing: 'border-box',
                        background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                        fontSize: '0.82rem', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                        outline: 'none', colorScheme: 'dark',
                      }}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File name preview */}
        <div style={{ padding: '10px 14px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', flexShrink: 0 }}>Archivo:</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', wordBreak: 'break-all' }}>
            {fileName}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button variant="ghost" onClick={handleClose} disabled={status === 'generating'}>
            Cancelar
          </Button>
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div key="btn-idle" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}>
                <Button variant="primary" onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} />
                  Generar y descargar
                </Button>
              </motion.div>
            )}
            {status === 'generating' && (
              <motion.div key="btn-gen" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}>
                <Button variant="primary" disabled style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={14} />
                  </motion.div>
                  Preparando tu reporte...
                </Button>
              </motion.div>
            )}
            {status === 'ready' && (
              <motion.div key="btn-ready" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}>
                <Button
                  variant="primary"
                  onClick={handleClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--success)', boxShadow: '0 0 16px rgba(0,230,118,0.3)' }}
                >
                  <Check size={14} />
                  Descargar ahora
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status message */}
        <AnimatePresence>
          {status === 'generating' && (
            <motion.p
              key="msg-gen"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ margin: '-12px 0 0', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Esto puede tomar unos segundos...
            </motion.p>
          )}
          {status === 'ready' && (
            <motion.div
              key="msg-ready"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ margin: '-12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,230,118,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Check size={12} color="var(--success)" strokeWidth={3} />
              </motion.div>
              <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', fontWeight: 600 }}>
                ¡Reporte listo! Haz clic en "Descargar ahora"
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const [viewMode, setViewMode]         = useState<TipoView>('individual');
  const [selectedStudent, setSelected]  = useState<Estudiante | null>(null);
  const [curso, setCurso]               = useState('');
  const [grupo, setGrupo]               = useState('');
  const [exportOpen, setExportOpen]     = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [reporte, setReporte]           = useState<ReporteDocente | null>(null);

  // CU-19: Cargar reporte docente al montar
  useEffect(() => {
    let mounted = true;
    reporteDocente()
      .then((data) => { if (mounted) setReporte(data); })
      .catch(() => {}); // Mantener datos mock como fallback
    return () => { mounted = false; };
  }, []);

  const students = useMemo(
    () => reporte?.estudiantes_bajo_engagement.map(toEstudiante) ?? MOCK_ESTUDIANTES,
    [reporte],
  );
  const recursos = useMemo(
    () => reporte?.recursos_mas_efectivos.map((r, i) => toRecursoTop(r, i + 1)) ?? MOCK_RECURSOS,
    [reporte],
  );
  const groupProfile = useMemo((): VarkProfile => {
    if (!reporte) return groupAvgProfile(MOCK_ESTUDIANTES);
    const dist  = reporte.distribucion_vark;
    const total = dist.V + dist.A + dist.R + dist.K;
    if (total === 0) return { v: 25, a: 25, r: 25, k: 25 };
    return {
      v: Math.round((dist.V / total) * 100),
      a: Math.round((dist.A / total) * 100),
      r: Math.round((dist.R / total) * 100),
      k: Math.round((dist.K / total) * 100),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporte]);

  const dominant   = groupDominant(students);
  const avgQ       = reporte
    ? Math.round(reporte.promedio_puntaje_quizzes * 100)
    : avgQuizzes(students);
  const avgProfile = groupProfile;
  const maxVistas  = recursos[0]?.vistas ?? 1;

  // Bar chart data
  const barData = viewMode === 'individual'
    ? students.map((s) => ({ nombre: s.nombre.split(' ')[0], ...s.profile }))
    : [{ nombre: 'Promedio', ...avgProfile }];

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '1.75rem', fontWeight: 800,
            color: 'var(--text-primary)', margin: 0,
          }}>
            Reportes del{' '}
            <span style={{ color: 'var(--accent-blue)' }}>grupo</span>
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            CU-19 · Seguimiento docente — distribución VARK y progreso individual
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setExportFormat('csv'); setExportOpen(true); }}
          >
            <Table2 size={15} />
            Exportar CSV
          </Button>
          <Button
            variant="primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setExportFormat('pdf'); setExportOpen(true); }}
          >
            <Download size={15} />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        style={{ ...CARD, padding: '16px 20px', marginBottom: 22 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          <Select
            label="Curso"
            options={[
              { value: 'prog1', label: 'Programación I' },
              { value: 'prog2', label: 'Programación II' },
              { value: 'est', label: 'Estructuras de Datos' },
            ]}
            value={curso}
            onChange={setCurso}
          />
          <Select
            label="Grupo"
            options={[
              { value: 'a', label: 'Grupo A' },
              { value: 'b', label: 'Grupo B' },
              { value: 'c', label: 'Grupo C' },
            ]}
            value={grupo}
            onChange={setGrupo}
          />
          <Select
            label="Rango de fechas"
            options={[
              { value: '7d',  label: 'Última semana'   },
              { value: '1m',  label: 'Último mes'      },
              { value: '3m',  label: 'Últimos 3 meses' },
            ]}
            value="1m"
            onChange={() => {}}
          />
          <Button variant="primary">Aplicar filtros</Button>
        </div>
      </motion.div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}
      >
        {/* Total estudiantes */}
        <motion.div variants={STAGGER.item} whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(59,110,248,0.18)' }} style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(59,110,248,0.12)', border: '1px solid rgba(59,110,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={17} color="var(--accent-blue)" />
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Estudiantes activos</span>
          </div>
          <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {reporte?.total_estudiantes ?? students.length}
          </div>
        </motion.div>

        {/* Estilo dominante */}
        <motion.div variants={STAGGER.item} whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(59,110,248,0.18)' }} style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={17} color="var(--vark-a)" />
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Estilo dominante del grupo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {ESTILO_LABEL[dominant]}
            </span>
            <Badge variant={ESTILO_BADGE[dominant]} size="md">{dominant}</Badge>
          </div>
        </motion.div>

        {/* Quizzes promedio */}
        <motion.div variants={STAGGER.item} whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(59,110,248,0.18)' }} style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={17} color="var(--success)" />
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Promedio quizzes aprobados</span>
          </div>
          <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {avgQ}
          </div>
        </motion.div>

        {/* Recurso más usado */}
        <motion.div variants={STAGGER.item} whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(59,110,248,0.18)' }} style={{ ...CARD, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={17} color="var(--info)" />
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Recurso más usado (semana)</span>
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
            Visualización de Algoritmos
            <div style={{ marginTop: 6 }}>
              <Badge variant="vark-v" size="sm">342 vistas</Badge>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 20, marginBottom: 22 }}>

        {/* LEFT — Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.18 }}
          style={{ ...CARD, padding: '24px 26px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Distribución VARK del grupo
            </h2>
            {/* Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {([['individual', LayoutGrid], ['promedio', BarChart2]] as [TipoView, LucideIcon][]).map(([mode, Icon]) => {
                const active = viewMode === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px', border: 'none', cursor: 'pointer',
                      background: active ? 'var(--accent-blue)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '0.76rem', fontWeight: 600,
                      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                      transition: 'background 0.18s, color 0.18s',
                      textTransform: 'capitalize',
                    }}
                  >
                    <Icon size={13} />
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="25%">
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-dm-sans)' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <RechartsTooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  {(['v', 'a', 'r', 'k'] as VarkKey[]).map((key) => (
                    <Bar key={key} dataKey={key} fill={VARK_CFG[key].color} radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={700} animationEasing="ease-out">
                      {barData.map((_, i) => (
                        <Cell key={i} fill={VARK_CFG[key].color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 6 }}>
            {(Object.entries(VARK_CFG) as [VarkKey, typeof VARK_CFG[VarkKey]][]).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — Students table */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.24 }}
          style={{ ...CARD, padding: '24px 20px', display: 'flex', flexDirection: 'column' }}
        >
          <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Progreso individual
          </h2>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 56px 60px 90px',
            padding: '6px 10px', gap: 8,
            borderBottom: '1px solid var(--border-glass)', marginBottom: 6,
          }}>
            {['', 'Estudiante', 'Quizzes', 'Recursos', 'Perfil VARK'].map((h, i) => (
              <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            animate="visible"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {students.map((s) => (
              <motion.div
                key={s.id}
                variants={STAGGER.item}
                whileHover={{ background: 'var(--bg-glass-hover)', scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelected(s)}
                style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr 56px 60px 90px',
                  padding: '8px 10px', gap: 8,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  cursor: 'pointer', alignItems: 'center',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${VARK_CFG[s.dominante.toLowerCase() as VarkKey].color}20`,
                  border: `1px solid ${VARK_CFG[s.dominante.toLowerCase() as VarkKey].color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700,
                  color: VARK_CFG[s.dominante.toLowerCase() as VarkKey].color,
                }}>
                  {s.avatar}
                </div>

                {/* Name + dominante */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {s.nombre}
                  </div>
                  <Badge variant={ESTILO_BADGE[s.dominante]} size="sm">{s.dominante}</Badge>
                </div>

                {/* Quizzes */}
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)', textAlign: 'center' }}>
                  {s.quizzes}
                </span>

                {/* Recursos */}
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--info)', textAlign: 'center' }}>
                  {s.recursos}
                </span>

                {/* Mini VARK bars */}
                <MiniVarkBars profile={s.profile} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Top recursos table ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.3 }}
        style={{ ...CARD, padding: '24px 26px' }}
      >
        <h2 style={{ margin: '0 0 18px', fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Recursos más utilizados
        </h2>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 90px 70px 160px 90px',
          padding: '6px 12px', gap: 10,
          borderBottom: '1px solid var(--border-glass)', marginBottom: 6,
        }}>
          {['#', 'Título', 'Tipo', 'VARK', 'Vistas', 'Valoración'].map((h) => (
            <span key={h} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
              {h}
            </span>
          ))}
        </div>

        <motion.div
          variants={STAGGER.container}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {recursos.map((rec) => {
            const Icon = TIPO_ICON[rec.tipo];
            const pct  = Math.round((rec.vistas / maxVistas) * 100);
            return (
              <motion.div
                key={rec.pos}
                variants={STAGGER.item}
                whileHover={{ background: 'var(--bg-glass-hover)' }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 90px 70px 160px 90px',
                  padding: '10px 12px', gap: 10,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  alignItems: 'center',
                }}
              >
                {/* Position */}
                <span style={{
                  fontSize: '0.8rem', fontWeight: 800,
                  color: rec.pos <= 3 ? 'var(--warning)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                }}>
                  {rec.pos}
                </span>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: 'rgba(59,110,248,0.1)', border: '1px solid rgba(59,110,248,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} color="var(--accent-blue)" />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rec.titulo}
                  </span>
                </div>

                {/* Tipo */}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{TIPO_LABEL[rec.tipo]}</span>

                {/* VARK badge */}
                <Badge variant={ESTILO_BADGE[rec.vark]}>{rec.vark}</Badge>

                {/* Views bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 99, background: 'var(--accent-blue)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Eye size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>{rec.vistas}</span>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={12} color="var(--warning)" fill="var(--warning)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)' }}>{rec.valoracion.toFixed(1)}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ── Export modal (CU-21) ─────────────────────────────────────────────── */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        initialFormat={exportFormat}
      />

      {/* ── Student detail modal ────────────────────────────────────────────── */}
      <Modal
        open={!!selectedStudent}
        onClose={() => setSelected(null)}
        title={selectedStudent ? `Perfil VARK — ${selectedStudent.nombre}` : ''}
        maxWidth={560}
      >
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22 }}
          >
            {/* Student header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: `${VARK_CFG[selectedStudent.dominante.toLowerCase() as VarkKey].color}20`,
                border: `1.5px solid ${VARK_CFG[selectedStudent.dominante.toLowerCase() as VarkKey].color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', fontWeight: 700,
                color: VARK_CFG[selectedStudent.dominante.toLowerCase() as VarkKey].color,
              }}>
                {selectedStudent.avatar}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedStudent.nombre}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Badge variant={ESTILO_BADGE[selectedStudent.dominante]}>
                    {ESTILO_LABEL[selectedStudent.dominante]}
                  </Badge>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Última actividad: {selectedStudent.ultimaActividad}
                  </span>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{selectedStudent.quizzes}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quizzes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--info)' }}>{selectedStudent.recursos}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recursos</div>
                </div>
              </div>
            </div>

            {/* Radar chart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <RadarChart data={selectedStudent.profile} size={240} />

              {/* Dimension breakdown */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(Object.entries(VARK_CFG) as [VarkKey, typeof VARK_CFG[VarkKey]][]).map(([key, cfg]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 800, color: cfg.color }}>
                        {selectedStudent.profile[key]}%
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedStudent.profile[key]}%` }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 99, background: cfg.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </Modal>
    </motion.div>
  );
}
