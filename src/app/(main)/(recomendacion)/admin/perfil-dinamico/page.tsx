'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingDown, RefreshCw, Clock,
  Play, Pause, Zap, Activity,
} from 'lucide-react';
import RadarChart from '@/components/ui/RadarChart';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VarkProfile { v: number; a: number; r: number; k: number }
interface Student { id: string; name: string; avatar: string; profile: VarkProfile }
type LogType = 'decay' | 'interaction' | 'manual';
interface LogEntry {
  id: string; student: string; avatar: string;
  change: string; date: string; type: LogType; delta: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Ana García',    avatar: 'AG', profile: { v: 85, a: 60, r: 72, k: 45 } },
  { id: 's2', name: 'Carlos López',  avatar: 'CL', profile: { v: 55, a: 80, r: 40, k: 90 } },
  { id: 's3', name: 'María Torres',  avatar: 'MT', profile: { v: 70, a: 50, r: 88, k: 62 } },
  { id: 's4', name: 'Jhon Ramírez',  avatar: 'JR', profile: { v: 40, a: 75, r: 55, k: 95 } },
  { id: 's5', name: 'Luisa Mendoza', avatar: 'LM', profile: { v: 92, a: 45, r: 65, k: 38 } },
];

const STUDENT_OPTIONS: SelectOption[] = MOCK_STUDENTS.map((s) => ({
  value: s.id, label: s.name,
}));

const MOCK_LOG: LogEntry[] = [
  { id: 'l1', student: 'Ana García',    avatar: 'AG', change: 'Visual: 92% → 85%',       date: 'Hace 2 min',  type: 'decay',       delta: -7 },
  { id: 'l2', student: 'Carlos López',  avatar: 'CL', change: 'Kinestésico: 85% → 90%',  date: 'Hace 8 min',  type: 'interaction', delta: +5 },
  { id: 'l3', student: 'María Torres',  avatar: 'MT', change: 'Lectura: 90% → 88%',       date: 'Hace 15 min', type: 'decay',       delta: -2 },
  { id: 'l4', student: 'Jhon Ramírez',  avatar: 'JR', change: 'Auditivo: 70% → 75%',     date: 'Hace 22 min', type: 'interaction', delta: +5 },
  { id: 'l5', student: 'Luisa Mendoza', avatar: 'LM', change: 'Visual: 95% → 92%',        date: 'Hace 31 min', type: 'manual',      delta: -3 },
  { id: 'l6', student: 'Ana García',    avatar: 'AG', change: 'Auditivo: 65% → 60%',      date: 'Hace 45 min', type: 'decay',       delta: -5 },
  { id: 'l7', student: 'Carlos López',  avatar: 'CL', change: 'Visual: 58% → 55%',        date: 'Hace 1h',     type: 'decay',       delta: -3 },
];

const LOG_TYPE_CFG: Record<LogType, { label: string; badge: 'warning' | 'info' | 'default'; color: string }> = {
  decay:       { label: 'Decaimiento', badge: 'warning', color: 'var(--warning)' },
  interaction: { label: 'Interacción',  badge: 'info',   color: 'var(--info)'    },
  manual:      { label: 'Manual',       badge: 'default', color: 'var(--text-secondary)' },
};

// ─── Decay function ───────────────────────────────────────────────────────────
// Factor de decaimiento temporal: interacciones antiguas pesan menos
const DECAY_RATE = 0.015; // 1.5% por día

function applyDecay(profile: VarkProfile, days: number): VarkProfile {
  const factor = Math.pow(1 - DECAY_RATE, days);
  return {
    v: Math.max(10, Math.round(profile.v * factor)),
    a: Math.max(10, Math.round(profile.a * factor)),
    r: Math.max(10, Math.round(profile.r * factor)),
    k: Math.max(10, Math.round(profile.k * factor)),
  };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const duration = 1200;
    const fps = 60;
    const totalFrames = Math.round((duration / 1000) * fps);
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * to));
      if (frame >= totalFrames) { setVal(to); clearInterval(timer); }
    }, 1000 / fps);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val}{suffix}</>;
}

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

const LIST_CONTAINER = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const LIST_ITEM = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};

// ─── VARK dimensions config ───────────────────────────────────────────────────

const VARK_DIMS = [
  { key: 'v' as const, label: 'Visual',      color: 'var(--vark-v)' },
  { key: 'a' as const, label: 'Auditivo',    color: 'var(--vark-a)' },
  { key: 'r' as const, label: 'Lectura',     color: 'var(--vark-r)' },
  { key: 'k' as const, label: 'Kinestésico', color: 'var(--vark-k)' },
];

// ─── KPI configuration ────────────────────────────────────────────────────────

const KPI_ITEMS = [
  { Icon: Users,        label: 'Perfiles actualizados hoy',       value: 47,   suffix: '',  color: 'var(--accent-blue)', isTime: false },
  { Icon: TrendingDown, label: 'Decaimiento promedio aplicado',   value: 6,    suffix: '%', color: 'var(--warning)',      isTime: false },
  { Icon: RefreshCw,    label: 'Estudiantes cambiados (semana)',  value: 183,  suffix: '',  color: 'var(--vark-k)',       isTime: false },
  { Icon: Clock,        label: 'Último ciclo de actualización',   value: 0,    suffix: '',  color: 'var(--vark-r)',       isTime: true  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PerfilDinamicoPage() {
  const [motorActivo, setMotorActivo] = useState(true);
  const [studentId, setStudentId]     = useState('s1');
  const [days, setDays]               = useState(0);
  const [applying, setApplying]       = useState(false);
  const [applied, setApplied]         = useState(false);

  const selectedStudent = MOCK_STUDENTS.find((s) => s.id === studentId) ?? MOCK_STUDENTS[0];
  const simulatedProfile = applyDecay(selectedStudent.profile, days);
  const sliderPct = (days / 30) * 100;

  const handleApply = async () => {
    setApplying(true);
    await new Promise((r) => setTimeout(r, 1400));
    setApplying(false);
    setApplied(true);
    setTimeout(() => setApplied(false), 2800);
  };

  return (
    <>
      {/* Slider track + thumb styles */}
      <style>{`
        .vark-slider { -webkit-appearance: none; appearance: none; outline: none; }
        .vark-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--warning); cursor: pointer;
          border: 2px solid rgba(0,0,0,0.4);
          box-shadow: 0 0 8px rgba(255,215,64,0.5);
        }
        .vark-slider::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--warning); cursor: pointer;
          border: 2px solid rgba(0,0,0,0.4);
        }
      `}</style>

      <motion.div
        variants={PAGE_VARIANTS}
        initial="hidden"
        animate="visible"
        style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0,
            }}>
              Motor de{' '}
              <span style={{ color: 'var(--accent-blue)' }}>Perfil Dinámico</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              CU-16 · Actualización dinámica del vector [V, A, R, K] con decaimiento temporal
            </p>
          </div>

          {/* Motor status badge */}
          <motion.div
            animate={motorActivo
              ? { boxShadow: ['0 0 0px rgba(0,230,118,0)', '0 0 18px rgba(0,230,118,0.35)', '0 0 0px rgba(0,230,118,0)'] }
              : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 'var(--radius-md)',
              background: motorActivo ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)',
              border: `1px solid ${motorActivo ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.3)'}`,
            }}
          >
            <motion.div
              animate={motorActivo
                ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }
                : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: motorActivo ? 'var(--success)' : 'var(--danger)',
              }}
            />
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: motorActivo ? 'var(--success)' : 'var(--danger)',
            }}>
              Motor {motorActivo ? 'Activo' : 'Pausado'}
            </span>
          </motion.div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <motion.div
          variants={LIST_CONTAINER}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
        >
          {KPI_ITEMS.map((kpi, i) => {
            const Icon = kpi.Icon;
            return (
              <motion.div
                key={i}
                variants={LIST_ITEM}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 22px rgba(59,110,248,0.12)' }}
                style={{ ...CARD, padding: '20px 22px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: `${kpi.color}18`, border: `1px solid ${kpi.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} color={kpi.color} />
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {kpi.label}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                  fontSize: kpi.isTime ? '1rem' : '2rem',
                  fontWeight: 800, color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {kpi.isTime
                    ? <span style={{ color: kpi.color, fontSize: '0.95rem' }}>12:47 PM</span>
                    : <AnimatedCounter to={kpi.value} suffix={kpi.suffix} />
                  }
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Main Content — Simulator + Log ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 22 }}>

          {/* LEFT — Simulator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.15 }}
            style={{ ...CARD, padding: '26px 28px' }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                background: 'rgba(59,110,248,0.12)', border: '1px solid rgba(59,110,248,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={16} color="var(--accent-blue)" />
              </div>
              <h2 style={{
                margin: 0, fontSize: '1rem', fontWeight: 700,
                fontFamily: 'var(--font-syne), Syne, sans-serif', color: 'var(--text-primary)',
              }}>
                Simulador de actualización de perfil
              </h2>
            </div>

            {/* Student selector */}
            <div style={{ marginBottom: 22 }}>
              <Select
                label="Seleccionar estudiante"
                options={STUDENT_OPTIONS}
                value={studentId}
                onChange={(v) => { setStudentId(v); setDays(0); setApplied(false); }}
              />
            </div>

            {/* Radar + VARK bars */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
              {/* Radar chart */}
              <div style={{ flex: 1 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${studentId}-${days}`}
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.28 }}
                  >
                    <RadarChart data={simulatedProfile} size={250} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* VARK dimension bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 165 }}>
                {VARK_DIMS.map((dim) => {
                  const orig = selectedStudent.profile[dim.key];
                  const sim  = simulatedProfile[dim.key];
                  const delta = sim - orig;
                  return (
                    <div key={dim.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: dim.color,
                        }}>
                          {dim.label}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sim}%
                          {delta !== 0 && (
                            <span style={{
                              fontSize: '0.68rem', marginLeft: 4,
                              color: delta < 0 ? 'var(--danger)' : 'var(--success)',
                            }}>
                              ({delta > 0 ? '+' : ''}{delta}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div style={{
                        height: 5, borderRadius: 99,
                        background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
                      }}>
                        <motion.div
                          animate={{ width: `${sim}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          style={{ height: '100%', borderRadius: 99, background: dim.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Days slider */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Simular días transcurridos
                </span>
                <motion.span
                  animate={{ color: days > 0 ? 'var(--warning)' : 'var(--text-muted)' }}
                  style={{ fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {days === 0 ? 'Perfil actual' : `+${days} día${days !== 1 ? 's' : ''}`}
                </motion.span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="vark-slider"
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 99,
                  background: `linear-gradient(to right, var(--warning) ${sliderPct}%, rgba(255,255,255,0.1) ${sliderPct}%)`,
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)',
              }}>
                <span>Hoy</span>
                <span>+15 días</span>
                <span>+30 días</span>
              </div>
            </div>

            {/* Apply button */}
            <AnimatePresence mode="wait">
              {applied ? (
                <motion.div
                  key="applied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.35)',
                    color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem',
                  }}
                >
                  ✓ Actualización aplicada correctamente
                </motion.div>
              ) : (
                <motion.div
                  key="btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    fullWidth
                    variant="outline"
                    style={{
                      borderColor: days === 0 ? 'var(--border-glass)' : 'var(--warning)',
                      color: days === 0 ? 'var(--text-muted)' : 'var(--warning)',
                    }}
                    loading={applying}
                    disabled={days === 0}
                    onClick={handleApply}
                  >
                    <Zap size={16} />
                    Aplicar actualización real
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT — Update log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.22 }}
            style={{ ...CARD, padding: '26px 22px', display: 'flex', flexDirection: 'column' }}
          >
            <h2 style={{
              margin: '0 0 18px', fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-syne), Syne, sans-serif', color: 'var(--text-primary)',
            }}>
              Log de actualizaciones recientes
            </h2>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {MOCK_LOG.map((entry, i) => {
                const cfg = LOG_TYPE_CFG[entry.type];
                const positive = entry.delta > 0;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055, duration: 0.28 }}
                    whileHover={{ background: 'var(--bg-glass-hover)' }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                      cursor: 'default',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 700, color: cfg.color,
                    }}>
                      {entry.avatar}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
                        marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {entry.student}
                      </div>
                      <div style={{
                        fontSize: '0.73rem', fontWeight: 500,
                        color: positive ? 'var(--success)' : 'var(--warning)',
                      }}>
                        {entry.change}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
                        {entry.date}
                      </div>
                    </div>

                    {/* Type badge */}
                    <div style={{ flexShrink: 0 }}>
                      <Badge variant={cfg.badge}>{cfg.label}</Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Motor Toggle ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.3 }}
          whileHover={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(59,110,248,0.1)' }}
          style={{ ...CARD, padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 32 }}
        >
          {/* Big status orb */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <motion.div
              animate={motorActivo
                ? { boxShadow: ['0 0 0px rgba(0,230,118,0)', '0 0 32px rgba(0,230,118,0.5)', '0 0 0px rgba(0,230,118,0)'] }
                : { boxShadow: ['0 0 0px rgba(255,82,82,0)', '0 0 20px rgba(255,82,82,0.3)', '0 0 0px rgba(255,82,82,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: motorActivo ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.08)',
                border: `2px solid ${motorActivo ? 'var(--success)' : 'var(--danger)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={motorActivo ? 'play' : 'pause'}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {motorActivo
                    ? <Play  size={28} color="var(--success)" style={{ marginLeft: 3 }} />
                    : <Pause size={28} color="var(--danger)" />
                  }
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: motorActivo ? 'var(--success)' : 'var(--danger)',
            }}>
              {motorActivo ? 'Activo' : 'Pausado'}
            </span>
          </div>

          {/* Description */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700,
              fontFamily: 'var(--font-syne), Syne, sans-serif', color: 'var(--text-primary)',
            }}>
              Motor de actualización automática
            </h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={motorActivo ? 'on' : 'off'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ margin: 0, fontSize: '0.865rem', color: 'var(--text-secondary)', maxWidth: 580, lineHeight: 1.6 }}
              >
                {motorActivo
                  ? 'El motor procesa los eventos de Clickstream acumulados y recalcula el vector [V, A, R, K] de cada estudiante aplicando una función de decaimiento temporal. Las interacciones recientes tienen mayor peso. Ciclos automáticos cada 30 minutos.'
                  : 'El motor está pausado. No se aplicarán actualizaciones automáticas al perfil VARK de los estudiantes hasta que sea reactivado. Los eventos de Clickstream seguirán acumulándose.'}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Toggle action */}
          <div style={{ flexShrink: 0 }}>
            <Button
              variant={motorActivo ? 'danger' : 'primary'}
              style={!motorActivo ? { background: 'var(--success)', border: 'none' } : {}}
              onClick={() => setMotorActivo((v) => !v)}
            >
              {motorActivo
                ? <><Pause size={15} /> Pausar motor</>
                : <><Play  size={15} /> Activar motor</>
              }
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
