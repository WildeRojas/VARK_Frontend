'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { historialVARKDetalle } from '@/lib/api/analitica';
import type { HistorialVARKDetalle } from '@/lib/api/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  CheckCircle2, Play, RefreshCw, Brain,
  TrendingUp, TrendingDown, Minus, Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';

// ─── Types ────────────────────────────────────────────────────────────────────

type RangeKey = '7d' | '1m' | '3m';
type EventType = 'quiz' | 'recurso' | 'sistema' | 'test';

interface DataPoint { fecha: string; v: number; a: number; r: number; k: number }
interface TimelineEvent {
  id: string; type: EventType; descripcion: string; fecha: string; color: string;
}

// ─── VARK config ─────────────────────────────────────────────────────────────

const VARK_LINES = [
  { key: 'v' as const, label: 'Visual',      color: '#3b6ef8', cssVar: 'var(--vark-v)' },
  { key: 'a' as const, label: 'Auditivo',    color: '#a78bfa', cssVar: 'var(--vark-a)' },
  { key: 'r' as const, label: 'Lectura',     color: '#00d4ff', cssVar: 'var(--vark-r)' },
  { key: 'k' as const, label: 'Kinestésico', color: '#00e676', cssVar: 'var(--vark-k)' },
];

const EVENT_CFG: Record<EventType, { Icon: LucideIcon; color: string; label: string }> = {
  quiz:    { Icon: CheckCircle2, color: 'var(--success)',      label: 'Quiz completado'       },
  recurso: { Icon: Play,         color: 'var(--vark-v)',       label: 'Recurso visto'         },
  sistema: { Icon: RefreshCw,    color: 'var(--warning)',      label: 'Perfil actualizado'    },
  test:    { Icon: Brain,        color: 'var(--vark-a)',       label: 'Test VARK realizado'   },
};

// ─── Mock data generator ──────────────────────────────────────────────────────

function generateHistory(days: number): DataPoint[] {
  const result: DataPoint[] = [];
  const today = new Date(2026, 4, 10); // May 10 2026
  let v = 65, a = 50, r = 58, k = 40;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    // Simulate gradual change with some noise
    v = Math.min(100, Math.max(10, v + (Math.random() * 4 - 1.5)));
    a = Math.min(100, Math.max(10, a + (Math.random() * 3 - 1.2)));
    r = Math.min(100, Math.max(10, r + (Math.random() * 3.5 - 1.0)));
    k = Math.min(100, Math.max(10, k + (Math.random() * 2.5 - 1.3)));

    const label = days <= 7
      ? d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
      : days <= 31
      ? d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
      : d.toLocaleDateString('es', { day: 'numeric', month: 'short' });

    result.push({
      fecha: label,
      v: Math.round(v), a: Math.round(a),
      r: Math.round(r), k: Math.round(k),
    });
  }
  return result;
}

const DATA_BY_RANGE: Record<RangeKey, DataPoint[]> = {
  '7d': generateHistory(7),
  '1m': generateHistory(30),
  '3m': generateHistory(90),
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7d', label: 'Última semana'  },
  { key: '1m', label: 'Último mes'     },
  { key: '3m', label: 'Últimos 3 meses'},
];

// ─── Timeline events (mock) ───────────────────────────────────────────────────

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 't1',  type: 'quiz',    descripcion: 'Completaste Quiz de Vectores con 95%',          fecha: 'Hoy, 14:32',         color: 'var(--success)' },
  { id: 't2',  type: 'sistema', descripcion: 'Perfil VARK recalculado · Visual subió a 85%',  fecha: 'Hoy, 14:30',         color: 'var(--warning)' },
  { id: 't3',  type: 'recurso', descripcion: 'Viste "Algoritmos de Ordenamiento" (23 min)',   fecha: 'Hoy, 13:45',         color: 'var(--vark-v)'  },
  { id: 't4',  type: 'recurso', descripcion: 'Leíste Guía de Matrices en Python',              fecha: 'Ayer, 18:20',        color: 'var(--vark-r)'  },
  { id: 't5',  type: 'quiz',    descripcion: 'Completaste Quiz de Cadenas con 80%',           fecha: 'Ayer, 16:05',        color: 'var(--success)' },
  { id: 't6',  type: 'sistema', descripcion: 'Perfil VARK recalculado · Lectura subió a 72%', fecha: '8 may, 10:15',       color: 'var(--warning)' },
  { id: 't7',  type: 'recurso', descripcion: 'Resolviste ejercicio interactivo de Cadenas',   fecha: '7 may, 20:30',       color: 'var(--vark-k)'  },
  { id: 't8',  type: 'test',    descripcion: 'Realizaste el Test VARK inicial de la plataforma', fecha: '1 may, 09:00',   color: 'var(--vark-a)'  },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card), inset 0 1px 0 var(--glass-highlight)',
};

const PAGE_VARIANTS = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item:      { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32 } } },
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 18px',
      boxShadow: 'var(--shadow-card)',
      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0 0 8px' }}>{label}</p>
      {VARK_LINES.map((vl) => {
        const entry = payload.find((p: { dataKey: string }) => p.dataKey === vl.key);
        if (!entry) return null;
        return (
          <div key={vl.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: vl.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', flex: 1 }}>{vl.label}</span>
            <span style={{ color: vl.color, fontWeight: 700, fontSize: '0.9rem' }}>{entry.value}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Custom legend ────────────────────────────────────────────────────────────

function CustomLegend({
  hiddenLines, onToggle,
}: { hiddenLines: Set<string>; onToggle: (key: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
      {VARK_LINES.map((vl) => {
        const hidden = hiddenLines.has(vl.key);
        return (
          <motion.button
            key={vl.key}
            onClick={() => onToggle(vl.key)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: hidden ? 'transparent' : `${vl.color}15`,
              border: `1px solid ${hidden ? 'var(--border-glass)' : vl.color}60`,
              borderRadius: 99, padding: '5px 14px',
              cursor: 'pointer', opacity: hidden ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 10, height: 3, borderRadius: 99,
              background: hidden ? 'var(--text-muted)' : vl.color,
            }} />
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em',
              color: hidden ? 'var(--text-muted)' : vl.color,
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              textTransform: 'uppercase',
            }}>
              {vl.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Summary table ────────────────────────────────────────────────────────────

function SummaryTable({ data }: { data: DataPoint[] }) {
  const first = data[0];
  const last  = data[data.length - 1];

  const rows = VARK_LINES.map((vl) => {
    const ini = first[vl.key];
    const cur = last[vl.key];
    const delta = cur - ini;
    return { ...vl, ini, cur, delta };
  });

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 90px 90px 110px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-glass)',
        marginBottom: 4,
      }}>
        {['Dimensión', 'Inicial', 'Actual', 'Cambio'].map((h) => (
          <span key={h} style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="visible"
      >
        {rows.map((row, i) => (
          <motion.div
            key={row.key}
            variants={STAGGER.item}
            whileHover={{ background: 'var(--bg-glass-hover)' }}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 90px 110px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border-glass)' : 'none',
            }}
          >
            {/* Dimension */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: row.color, flexShrink: 0,
                boxShadow: `0 0 6px ${row.color}80`,
              }} />
              <span style={{
                fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              }}>
                {row.label}
              </span>
            </div>

            {/* Inicial */}
            <span style={{
              fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500,
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}>
              {row.ini}%
            </span>

            {/* Actual */}
            <span style={{
              fontSize: '0.88rem', fontWeight: 700, color: row.color,
              fontFamily: 'var(--font-syne), Syne, sans-serif',
            }}>
              {row.cur}%
            </span>

            {/* Delta badge */}
            <div>
              {row.delta > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendingUp size={13} color="var(--success)" />
                  <Badge variant="success">+{row.delta}%</Badge>
                </div>
              ) : row.delta < 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendingDown size={13} color="var(--danger)" />
                  <Badge variant="danger">{row.delta}%</Badge>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Minus size={13} color="var(--text-muted)" />
                  <Badge variant="ghost">Sin cambio</Badge>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function origenToTipo(origen: string): EventType {
  const o = origen.toLowerCase();
  if (o.includes('test')) return 'test';
  if (o.includes('quiz')) return 'quiz';
  if (o.includes('clickstream')) return 'sistema';
  return 'sistema';
}

export default function HistorialPage() {
  const [range, setRange]           = useState<RangeKey>('1m');
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [chartKey, setChartKey]     = useState(0); // forces chart remount on range change

  // ── Datos reales del historial VARK (CU-18) ─────────────────────────────────
  const [apiData, setApiData]         = useState<DataPoint[] | null>(null);
  const [apiTimeline, setApiTimeline] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    let mounted = true;
    historialVARKDetalle()
      .then((entries: HistorialVARKDetalle[]) => {
        if (!mounted || entries.length === 0) return;
        // El endpoint llega ordenado desc; lo invertimos para la línea temporal del gráfico.
        const asc = [...entries].reverse();
        setApiData(asc.map((e) => ({
          fecha: new Date(e.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
          v: Math.round((e.vector_nuevo.V ?? 0) * 100),
          a: Math.round((e.vector_nuevo.A ?? 0) * 100),
          r: Math.round((e.vector_nuevo.R ?? 0) * 100),
          k: Math.round((e.vector_nuevo.K ?? 0) * 100),
        })));
        setApiTimeline(entries.map((e) => {
          const tipo = origenToTipo(e.origen);
          return {
            id: String(e.id),
            type: tipo,
            descripcion: `${e.origen} · Perfil VARK actualizado`,
            fecha: new Date(e.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            color: EVENT_CFG[tipo].color,
          };
        }));
      })
      .catch(() => { /* se mantienen los datos de respaldo */ });
    return () => { mounted = false; };
  }, []);

  const data = useMemo(() => apiData ?? DATA_BY_RANGE[range], [apiData, range]);
  const timeline = apiTimeline ?? TIMELINE_EVENTS;

  const handleRangeChange = (key: RangeKey) => {
    setRange(key);
    setChartKey((k) => k + 1); // triggers chart re-animation
  };

  const toggleLine = (key: string) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Tick interval for X axis — fewer ticks for larger ranges
  const tickInterval = range === '7d' ? 0 : range === '1m' ? 4 : 11;

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '1.75rem', fontWeight: 800,
            color: 'var(--text-primary)', margin: 0,
          }}>
            Evolución de tu{' '}
            <span style={{ color: 'var(--accent-blue)' }}>perfil VARK</span>
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            CU-18 · Historial de cambios en el vector [V, A, R, K]
          </p>
        </div>

        {/* Range selector pills */}
        <div style={{
          display: 'flex', gap: 6, padding: '5px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
        }}>
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.key;
            return (
              <motion.button
                key={opt.key}
                onClick={() => handleRangeChange(opt.key)}
                whileHover={{ filter: 'brightness(1.12)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: active ? 'var(--accent-blue)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.18s, color 0.18s',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Calendar size={12} />
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Line chart ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`chart-${chartKey}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          whileHover={{ boxShadow: 'var(--shadow-card), 0 0 32px rgba(59,110,248,0.1)' }}
          style={{ ...CARD, padding: '28px 28px 20px', marginBottom: 20 }}
        >
          {/* Chart header */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{
              margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
            }}>
              Gráfico de evolución temporal
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click en la leyenda para mostrar u ocultar cada dimensión
            </p>
          </div>

          {/* Recharts LineChart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="var(--border-glass)" strokeDasharray="4 4" />
              <XAxis
                dataKey="fecha"
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
                axisLine={{ stroke: 'var(--border-glass)' }}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-sans)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend content={() => null} /> {/* hidden — using custom legend */}
              {VARK_LINES.map((vl) => (
                <Line
                  key={vl.key}
                  type="monotone"
                  dataKey={vl.key}
                  stroke={vl.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: vl.color, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
                  hide={hiddenLines.has(vl.key)}
                  strokeOpacity={hiddenLines.size > 0 && !hiddenLines.has(vl.key) ? 1 : hiddenLines.has(vl.key) ? 0 : 1}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Custom interactive legend */}
          <CustomLegend hiddenLines={hiddenLines} onToggle={toggleLine} />
        </motion.div>
      </AnimatePresence>

      {/* ── Summary table + Timeline ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* LEFT — Summary */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.15 }}
          style={{ ...CARD, padding: '24px 0 16px' }}
        >
          <h3 style={{
            margin: '0 16px 16px',
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
          }}>
            Resumen de cambios
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={range}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <SummaryTable data={data} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* RIGHT — Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.22 }}
          style={{ ...CARD, padding: '24px 26px' }}
        >
          <h3 style={{
            margin: '0 0 20px',
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
          }}>
            Eventos clave
          </h3>

          <div style={{ position: 'relative' }}>
            {/* Vertical connector line */}
            <div style={{
              position: 'absolute',
              left: 15, top: 16, bottom: 16,
              width: 1,
              background: 'linear-gradient(to bottom, var(--accent-blue)50, transparent)',
            }} />

            <motion.div
              variants={STAGGER.container}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            >
              {timeline.map((ev) => {
                const cfg  = EVENT_CFG[ev.type];
                const Icon = cfg.Icon;
                return (
                  <motion.div
                    key={ev.id}
                    variants={STAGGER.item}
                    style={{ display: 'flex', gap: 16, paddingBottom: 20 }}
                  >
                    {/* Dot + icon */}
                    <div style={{ position: 'relative', flexShrink: 0, width: 30 }}>
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        style={{
                          width: 30, height: 30,
                          borderRadius: '50%',
                          background: `${ev.color}18`,
                          border: `1.5px solid ${ev.color}60`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative', zIndex: 1,
                        }}
                      >
                        <Icon size={13} color={ev.color} />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <motion.div
                      whileHover={{ background: 'var(--bg-glass-hover)', x: 2 }}
                      style={{
                        flex: 1, padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: ev.color, display: 'block', marginBottom: 3,
                          }}>
                            {cfg.label}
                          </span>
                          <span style={{
                            fontSize: '0.82rem', fontWeight: 500,
                            color: 'var(--text-primary)', lineHeight: 1.4,
                          }}>
                            {ev.descripcion}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.68rem', color: 'var(--text-muted)',
                          whiteSpace: 'nowrap', flexShrink: 0,
                          marginTop: 2,
                        }}>
                          {ev.fecha}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
