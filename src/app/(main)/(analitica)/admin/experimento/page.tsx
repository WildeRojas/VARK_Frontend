'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Play, Pause, RotateCcw, Star,
  Clock, CheckSquare, BookOpen, Calendar,
  FlaskConical, AlertTriangle,
} from 'lucide-react';
import Badge  from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal  from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { listarExperimentos, resultadosExperimento, actualizarExperimento } from '@/lib/api/analitica';
import type { GrupoResultados } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status     = 'activo' | 'pausado' | 'finalizado';
type MetricKey  = 'completitud' | 'satisfaccion' | 'tiempo' | 'recursos';
type ConfirmOp  = 'toggle' | 'reset' | null;

interface GroupMetrics {
  estudiantes: number;
  recursos: number;
  completitud: number; // %
  satisfaccion: number; // 1-5
  tiempo: number; // mins
}

interface WeekPoint {
  semana: string;
  a: number;
  b: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_GROUP_A: GroupMetrics = { estudiantes: 142, recursos: 18.4, completitud: 74, satisfaccion: 4.1, tiempo: 38 };
const INIT_GROUP_B: GroupMetrics = { estudiantes: 58,  recursos: 22.7, completitud: 83, satisfaccion: 4.6, tiempo: 47 };

function fromGrupoResultados(g: GrupoResultados): GroupMetrics {
  return {
    estudiantes:  g.total,
    recursos:     g.total_clics,
    completitud:  0,
    satisfaccion: g.promedio_puntaje ?? 0,
    tiempo:       0,
  };
}

const CHART_DATA: Record<MetricKey, WeekPoint[]> = {
  completitud: [
    { semana: 'S1', a: 61, b: 63 }, { semana: 'S2', a: 64, b: 67 },
    { semana: 'S3', a: 67, b: 71 }, { semana: 'S4', a: 69, b: 75 },
    { semana: 'S5', a: 71, b: 78 }, { semana: 'S6', a: 73, b: 80 },
    { semana: 'S7', a: 73, b: 82 }, { semana: 'S8', a: 74, b: 83 },
  ],
  satisfaccion: [
    { semana: 'S1', a: 3.8, b: 3.9 }, { semana: 'S2', a: 3.9, b: 4.0 },
    { semana: 'S3', a: 3.9, b: 4.1 }, { semana: 'S4', a: 4.0, b: 4.2 },
    { semana: 'S5', a: 4.0, b: 4.3 }, { semana: 'S6', a: 4.1, b: 4.4 },
    { semana: 'S7', a: 4.1, b: 4.5 }, { semana: 'S8', a: 4.1, b: 4.6 },
  ],
  tiempo: [
    { semana: 'S1', a: 31, b: 33 }, { semana: 'S2', a: 33, b: 36 },
    { semana: 'S3', a: 34, b: 38 }, { semana: 'S4', a: 35, b: 40 },
    { semana: 'S5', a: 36, b: 42 }, { semana: 'S6', a: 37, b: 44 },
    { semana: 'S7', a: 38, b: 46 }, { semana: 'S8', a: 38, b: 47 },
  ],
  recursos: [
    { semana: 'S1', a: 14, b: 15 }, { semana: 'S2', a: 15, b: 16 },
    { semana: 'S3', a: 16, b: 18 }, { semana: 'S4', a: 16, b: 19 },
    { semana: 'S5', a: 17, b: 20 }, { semana: 'S6', a: 18, b: 21 },
    { semana: 'S7', a: 18, b: 22 }, { semana: 'S8', a: 18, b: 22 },
  ],
};

// ─── Config ───────────────────────────────────────────────────────────────────

const COLOR_A = '#3b6ef8';
const COLOR_B = '#a78bfa';

const STATUS_CFG: Record<Status, { label: string; badge: 'success' | 'warning' | 'ghost'; Icon: typeof Play }> = {
  activo:     { label: 'Activo',     badge: 'success', Icon: Play    },
  pausado:    { label: 'Pausado',    badge: 'warning', Icon: Pause   },
  finalizado: { label: 'Finalizado', badge: 'ghost',   Icon: FlaskConical },
};

const METRIC_OPTIONS = [
  { value: 'completitud',  label: 'Tasa de completitud de quizzes (%)' },
  { value: 'satisfaccion', label: 'Satisfacción promedio (1-5)'        },
  { value: 'tiempo',       label: 'Tiempo promedio en plataforma (min)'},
  { value: 'recursos',     label: 'Promedio de recursos vistos'        },
];

const METRIC_UNIT: Record<MetricKey, string> = {
  completitud: '%', satisfaccion: '/5', tiempo: ' min', recursos: '',
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
  item:      { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, unit }: any) {
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
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0 0 8px' }}>{label}</p>
      {[{ key: 'a', color: COLOR_A, label: 'Grupo A' }, { key: 'b', color: COLOR_B, label: 'Grupo B' }].map(({ key, color, label: lbl }) => {
        const entry = payload.find((p: { dataKey: string }) => p.dataKey === key);
        if (!entry) return null;
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', flex: 1 }}>{lbl}</span>
            <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{entry.value}{unit}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode; label: string;
  valueA: string; valueB: string;
  highlight?: 'a' | 'b' | null;
}

function MetricCard({ icon, label, valueA, valueB, highlight }: MetricCardProps) {
  return (
    <motion.div
      variants={STAGGER.item}
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr 1fr',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 3, fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
          {label} — A
        </div>
        <div style={{
          fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem',
          color: highlight === 'a' ? COLOR_A : 'var(--text-primary)',
          textShadow: highlight === 'a' ? `0 0 18px ${COLOR_A}60` : 'none',
        }}>
          {valueA}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 3, fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
          {label} — B
        </div>
        <div style={{
          fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem',
          color: highlight === 'b' ? COLOR_B : 'var(--text-primary)',
          textShadow: highlight === 'b' ? `0 0 18px ${COLOR_B}60` : 'none',
        }}>
          {valueB}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExperimentoPage() {
  const [status, setStatus]         = useState<Status>('activo');
  const [groupBPct, setGroupBPct]   = useState(30);
  const [metric, setMetric]         = useState<MetricKey>('completitud');
  const [confirmOp, setConfirmOp]   = useState<ConfirmOp>(null);
  const [chartKey, setChartKey]     = useState(0);
  const [grupoA, setGrupoA]         = useState<GroupMetrics>(INIT_GROUP_A);
  const [grupoB, setGrupoB]         = useState<GroupMetrics>(INIT_GROUP_B);
  const [expId, setExpId]           = useState<number | null>(null);

  // CU-20: Cargar experimento y resultados al montar
  useEffect(() => {
    let mounted = true;
    listarExperimentos()
      .then((exps) => {
        if (!mounted || exps.length === 0) return;
        const exp = exps[0];
        setExpId(exp.id);
        setStatus(exp.estado === 'activo' ? 'activo' : 'finalizado');
        return resultadosExperimento(exp.id);
      })
      .then((data) => {
        if (!mounted || !data) return;
        setGrupoA(fromGrupoResultados(data.resultados.control));
        setGrupoB(fromGrupoResultados(data.resultados.experimental));
      })
      .catch(() => {}); // Mantener datos mock como fallback
    return () => { mounted = false; };
  }, []);

  const groupAPct = 100 - groupBPct;
  const chartData = useMemo(() => CHART_DATA[metric], [metric]);
  const unit      = METRIC_UNIT[metric];

  // Determine which group is "winning" per metric
  const highlight = (a: number, b: number): 'a' | 'b' => a >= b ? 'a' : 'b';

  const handleToggleConfirm = async () => {
    const nuevoEstado: 'activo' | 'finalizado' = status === 'activo' ? 'finalizado' : 'activo';
    if (expId != null) {
      try { await actualizarExperimento(expId, { estado: nuevoEstado }); } catch { /* keep local */ }
    }
    setStatus(nuevoEstado);
    setConfirmOp(null);
  };

  const handleResetConfirm = () => {
    setStatus('activo');
    setGroupBPct(30);
    setConfirmOp(null);
  };

  const handleMetricChange = (val: string) => {
    setMetric(val as MetricKey);
    setChartKey((k) => k + 1);
  };

  const toggleLabel = status === 'activo' ? 'Pausar experimento' : 'Activar experimento';
  const toggleIcon  = status === 'activo' ? <Pause size={15} /> : <Play size={15} />;
  const toggleVar   = status === 'activo' ? 'danger' as const : 'primary' as const;

  const confirmTitle = confirmOp === 'reset'
    ? 'Restablecer experimento'
    : status === 'activo'
    ? 'Pausar experimento'
    : 'Activar experimento';

  const confirmMsg = confirmOp === 'reset'
    ? 'Esta acción restablecerá todos los datos del experimento a sus valores iniciales. Los datos históricos se perderán. ¿Deseas continuar?'
    : status === 'activo'
    ? 'Pausar el experimento detendrá la asignación de nuevos estudiantes a los grupos y congelará las métricas actuales.'
    : 'Activar el experimento reanudará la asignación aleatoria de estudiantes a los grupos A y B según la distribución configurada.';

  const { badge: statusBadge, label: statusLabel } = STATUS_CFG[status];

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-md)',
            background: 'rgba(59,110,248,0.12)', border: '1px solid rgba(59,110,248,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlaskConical size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontSize: '1.75rem', fontWeight: 800,
              color: 'var(--text-primary)', margin: 0,
            }}>
              Experimento{' '}
              <span style={{ color: 'var(--accent-blue)' }}>A/B</span>
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              CU-20 · Personalización adaptativa — RF13
            </p>
          </div>
          <Badge variant={statusBadge} size="md" style={{ marginLeft: 8 }}>
            {statusLabel}
          </Badge>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)' }}
            onClick={() => setConfirmOp('reset')}
            disabled={status === 'finalizado'}
          >
            <RotateCcw size={14} />
            Restablecer
          </Button>
          <Button
            variant={toggleVar}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setConfirmOp('toggle')}
            disabled={status === 'finalizado'}
          >
            {toggleIcon}
            {toggleLabel}
          </Button>
        </div>
      </div>

      {/* ── Config card ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.08 }}
        style={{ ...CARD, padding: '24px 28px', marginBottom: 20 }}
      >
        <h2 style={{ margin: '0 0 20px', fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Configuración del experimento
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}>
          {/* Slider section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Distribución de grupos
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Grupo B: <strong style={{ color: COLOR_B }}>{groupBPct}%</strong>
              </span>
            </div>

            {/* Divided bar */}
            <div style={{ height: 28, borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', marginBottom: 8, border: '1px solid var(--border-glass)' }}>
              <motion.div
                animate={{ width: `${groupAPct}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  background: `linear-gradient(90deg, ${COLOR_A}cc, ${COLOR_A}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', padding: '0 8px' }}>
                  A {groupAPct}%
                </span>
              </motion.div>
              <motion.div
                animate={{ width: `${groupBPct}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  background: `linear-gradient(90deg, ${COLOR_B}88, ${COLOR_B}cc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {groupBPct >= 10 && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', padding: '0 8px' }}>
                    B {groupBPct}%
                  </span>
                )}
              </motion.div>
            </div>

            {/* Slider */}
            <div style={{ position: 'relative', padding: '6px 0' }}>
              <input
                type="range" min={5} max={50} step={5}
                value={groupBPct}
                onChange={(e) => setGroupBPct(Number(e.target.value))}
                disabled={status !== 'activo'}
                style={{
                  width: '100%', height: 4, borderRadius: 99,
                  appearance: 'none', WebkitAppearance: 'none',
                  background: `linear-gradient(to right, ${COLOR_B} ${(groupBPct / 50) * 100}%, rgba(255,255,255,0.12) ${(groupBPct / 50) * 100}%)`,
                  cursor: status !== 'activo' ? 'not-allowed' : 'pointer',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>5%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>50%</span>
              </div>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Grupo B recibe recomendaciones personalizadas por VARK. Grupo A: motor clásico.
            </p>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 200 }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <Calendar size={13} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Inicio</span>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>1 de mayo, 2026</span>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <Clock size={13} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Duración</span>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>8 semanas</span>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', marginTop: 8, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '12.5%' }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                  style={{ height: '100%', borderRadius: 99, background: 'var(--accent-blue)' }}
                />
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Semana 1 de 8</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Comparative grid ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, delay: 0.16 }}
        style={{ ...CARD, padding: '24px 28px', marginBottom: 20 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
          {/* Column A */}
          <div style={{ paddingRight: 28 }}>
            {/* Header */}
            <div style={{
              padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: 18,
              background: `${COLOR_A}10`, border: `1px solid ${COLOR_A}25`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${COLOR_A}20`, border: `1.5px solid ${COLOR_A}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800,
                fontSize: '0.95rem', color: COLOR_A,
              }}>A</div>
              <div>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Grupo A</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Motor de recomendación clásico</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: COLOR_A }}>{groupAPct}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>del total</div>
              </div>
            </div>

            <motion.div variants={STAGGER.container} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={16} color={COLOR_A} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Estudiantes</div>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{grupoA.estudiantes}</div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <BookOpen size={16} color={COLOR_A} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Recursos vistos (promedio)</div>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoA.recursos, grupoB.recursos) === 'a' ? COLOR_A : 'var(--text-primary)' }}>{grupoA.recursos}</div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckSquare size={16} color={COLOR_A} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Completitud quizzes</div>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoA.completitud, grupoB.completitud) === 'a' ? COLOR_A : 'var(--text-primary)' }}>{grupoA.completitud}%</div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Star size={16} color={COLOR_A} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Satisfacción promedio</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoA.satisfaccion, grupoB.satisfaccion) === 'a' ? COLOR_A : 'var(--text-primary)' }}>{grupoA.satisfaccion}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/5</span>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Clock size={16} color={COLOR_A} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Tiempo en plataforma</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoA.tiempo, grupoB.tiempo) === 'a' ? COLOR_A : 'var(--text-primary)' }}>{grupoA.tiempo}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Divider */}
          <div style={{ background: 'var(--border-glass)', margin: '0 0' }} />

          {/* Column B */}
          <div style={{ paddingLeft: 28 }}>
            {/* Header */}
            <div style={{
              padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: 18,
              background: `${COLOR_B}10`, border: `1px solid ${COLOR_B}25`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${COLOR_B}20`, border: `1.5px solid ${COLOR_B}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800,
                fontSize: '0.95rem', color: COLOR_B,
              }}>B</div>
              <div>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Grupo B</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recomendación personalizada VARK</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: COLOR_B }}>{groupBPct}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>del total</div>
              </div>
            </div>

            <motion.div variants={STAGGER.container} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={16} color={COLOR_B} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Estudiantes</div>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{grupoB.estudiantes}</div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <BookOpen size={16} color={COLOR_B} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Recursos vistos (promedio)</div>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoB.recursos, grupoA.recursos) === 'a' ? COLOR_B : 'var(--text-primary)' }}>{grupoB.recursos}</div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckSquare size={16} color={COLOR_B} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Completitud quizzes</div>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoB.completitud, grupoA.completitud) === 'a' ? COLOR_B : 'var(--text-primary)' }}>{grupoB.completitud}%</div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Star size={16} color={COLOR_B} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Satisfacción promedio</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoB.satisfaccion, grupoA.satisfaccion) === 'a' ? COLOR_B : 'var(--text-primary)' }}>{grupoB.satisfaccion}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/5</span>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={STAGGER.item} style={{ ...CARD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Clock size={16} color={COLOR_B} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Tiempo en plataforma</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: highlight(grupoB.tiempo, grupoA.tiempo) === 'a' ? COLOR_B : 'var(--text-primary)' }}>{grupoB.tiempo}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Winner indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 20, padding: '10px 18px',
            background: `${COLOR_B}10`, border: `1px solid ${COLOR_B}25`,
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <Star size={14} color={COLOR_B} fill={COLOR_B} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: COLOR_B }}>Grupo B</strong> supera a Grupo A en todas las métricas — la personalización VARK muestra resultados positivos.
          </span>
        </motion.div>
      </motion.div>

      {/* ── Comparative chart ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, delay: 0.24 }}
        style={{ ...CARD, padding: '24px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Evolución comparativa
          </h2>
          <div style={{ width: 340 }}>
            <Select
              label="Métrica"
              options={METRIC_OPTIONS}
              value={metric}
              onChange={handleMetricChange}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`chart-${chartKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="semana"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
                  axisLine={{ stroke: 'var(--border-glass)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v}${unit}`}
                />
                <RechartsTooltip content={<ChartTooltip unit={unit} />} />
                <Line
                  type="monotone" dataKey="a" stroke={COLOR_A} strokeWidth={2.5}
                  dot={{ r: 4, fill: COLOR_A, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  animationDuration={700} animationEasing="ease-out"
                />
                <Line
                  type="monotone" dataKey="b" stroke={COLOR_B} strokeWidth={2.5}
                  dot={{ r: 4, fill: COLOR_B, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  animationDuration={700} animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 10 }}>
          {[{ color: COLOR_A, label: 'Grupo A — Motor clásico' }, { color: COLOR_B, label: 'Grupo B — Motor VARK' }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 24, height: 3, borderRadius: 99, background: color }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Confirmation modal ───────────────────────────────────────────────── */}
      <Modal
        open={!!confirmOp}
        onClose={() => setConfirmOp(null)}
        title={confirmTitle}
        maxWidth={440}
      >
        <div>
          {/* Warning icon */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%', margin: '0 auto 18px',
            background: confirmOp === 'reset' ? 'rgba(255,82,82,0.12)' : 'rgba(255,179,0,0.12)',
            border: `1.5px solid ${confirmOp === 'reset' ? 'rgba(255,82,82,0.3)' : 'rgba(255,179,0,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color={confirmOp === 'reset' ? 'var(--danger)' : 'var(--warning)'} />
          </div>

          <p style={{
            fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6,
            textAlign: 'center', margin: '0 0 24px',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          }}>
            {confirmMsg}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setConfirmOp(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmOp === 'reset' ? 'danger' : toggleVar}
              onClick={confirmOp === 'reset' ? handleResetConfirm : handleToggleConfirm}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {confirmOp === 'reset' ? <RotateCcw size={14} /> : toggleIcon}
              {confirmOp === 'reset' ? 'Restablecer' : toggleLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
