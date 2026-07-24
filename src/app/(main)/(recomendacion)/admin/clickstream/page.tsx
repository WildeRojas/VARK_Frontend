'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, Users, Eye, CheckCircle2,
  Play, Pause,
  MousePointerClick, RotateCcw, X as XIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

// ─── Types ───────────────────────────────────────────────────────────────────
type EventKind = 'click' | 'view' | 'complete' | 'return' | 'close';
type VarkStyle = 'V' | 'A' | 'R' | 'K';

interface EventoItem {
  id:      string;
  kind:    EventKind;
  user:    string;
  accion:  string;
  recurso: string;
  ts:      number;
}

interface RecursoTop {
  titulo:  string;
  vark:    VarkStyle;
  visitas: number;
  pct:     number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const KIND_CFG: Record<EventKind, { Icon: LucideIcon; color: string; label: string }> = {
  click:    { Icon: MousePointerClick, color: 'var(--accent-blue)', label: 'abrió' },
  view:     { Icon: Eye,               color: 'var(--vark-r)',       label: 'vio' },
  complete: { Icon: CheckCircle2,      color: 'var(--success)',      label: 'completó' },
  return:   { Icon: RotateCcw,         color: 'var(--warning)',      label: 'retornó a' },
  close:    { Icon: XIcon,             color: 'var(--text-muted)',   label: 'cerró' },
};

const VARK_BADGE: Record<VarkStyle, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};

const VARK_COLOR: Record<VarkStyle, string> = {
  V: 'var(--vark-v)', A: 'var(--vark-a)', R: 'var(--vark-r)', K: 'var(--vark-k)',
};

const HOURLY_DATA = [
  { hora: '00:00', eventos: 5  }, { hora: '01:00', eventos: 3  },
  { hora: '02:00', eventos: 2  }, { hora: '03:00', eventos: 1  },
  { hora: '04:00', eventos: 0  }, { hora: '05:00', eventos: 4  },
  { hora: '06:00', eventos: 12 }, { hora: '07:00', eventos: 28 },
  { hora: '08:00', eventos: 67 }, { hora: '09:00', eventos: 112 },
  { hora: '10:00', eventos: 145 }, { hora: '11:00', eventos: 138 },
  { hora: '12:00', eventos: 89 }, { hora: '13:00', eventos: 95 },
  { hora: '14:00', eventos: 162 }, { hora: '15:00', eventos: 178 },
  { hora: '16:00', eventos: 143 }, { hora: '17:00', eventos: 97 },
  { hora: '18:00', eventos: 54 }, { hora: '19:00', eventos: 38 },
  { hora: '20:00', eventos: 22 }, { hora: '21:00', eventos: 15 },
  { hora: '22:00', eventos: 9  }, { hora: '23:00', eventos: 6  },
];

const TOP_RECURSOS: RecursoTop[] = [
  { titulo: 'Algoritmos de Ordenamiento Visual', vark: 'V', visitas: 342, pct: 100 },
  { titulo: 'Podcast: Estructuras de Datos',     vark: 'A', visitas: 289, pct: 84  },
  { titulo: 'Guía de Matrices en Python',        vark: 'R', visitas: 201, pct: 59  },
  { titulo: 'Ejercicio Interactivo: Recursión',  vark: 'K', visitas: 156, pct: 46  },
  { titulo: 'Video: Fundamentos de POO',         vark: 'V', visitas: 98,  pct: 29  },
];

const NOMBRES       = ['Carlos M.', 'Ana P.', 'Luis R.', 'María T.', 'Pedro L.', 'Sofia G.', 'Diego V.', 'Laura C.'];
const RECURSOS_MOCK = ['Algoritmos de Ordenamiento', 'Podcast de POO', 'Guía de Arrays', 'Ejercicio de Recursión', 'Video de Sorting', 'Artículo: Matrices'];
const KINDS: EventKind[] = ['click', 'view', 'complete', 'return', 'close'];

const CARD = {
  background:           'var(--bg-card)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid var(--border-glass)',
  borderRadius:         'var(--radius-lg)',
  boxShadow:            '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const pageV  = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
const gridV  = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cellV  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `hace ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins}m`;
  return `hace ${Math.floor(mins / 60)}h`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1300;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   'rgba(5,11,31,0.97)',
      border:       '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-md)',
      padding:      '10px 16px',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0, fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
      <p style={{ color: 'var(--accent-blue)', fontWeight: 700, margin: '4px 0 0', fontSize: '1.05rem', fontFamily: 'var(--font-dm-sans)' }}>
        {payload[0].value} eventos
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ClickstreamPage() {
  const [activo, setActivo]   = useState(true);
  const [, setTick]           = useState(0);
  const [eventos, setEventos] = useState<EventoItem[]>(() => [
    { id: 'e01', kind: 'click',    user: 'Carlos M.', accion: 'abrió',     recurso: 'Algoritmos de Ordenamiento', ts: Date.now() - 4_000   },
    { id: 'e02', kind: 'complete', user: 'Ana P.',     accion: 'completó',  recurso: 'Podcast de POO',            ts: Date.now() - 18_000  },
    { id: 'e03', kind: 'view',     user: 'Luis R.',    accion: 'vio',       recurso: 'Guía de Arrays',            ts: Date.now() - 35_000  },
    { id: 'e04', kind: 'return',   user: 'María T.',   accion: 'retornó a', recurso: 'Ejercicio de Recursión',    ts: Date.now() - 52_000  },
    { id: 'e05', kind: 'close',    user: 'Pedro L.',   accion: 'cerró',     recurso: 'Video de Sorting',          ts: Date.now() - 71_000  },
    { id: 'e06', kind: 'click',    user: 'Sofia G.',   accion: 'abrió',     recurso: 'Artículo: Matrices',        ts: Date.now() - 89_000  },
    { id: 'e07', kind: 'view',     user: 'Diego V.',   accion: 'vio',       recurso: 'Algoritmos de Ordenamiento',ts: Date.now() - 105_000 },
    { id: 'e08', kind: 'complete', user: 'Laura C.',   accion: 'completó',  recurso: 'Guía de Arrays',            ts: Date.now() - 128_000 },
    { id: 'e09', kind: 'click',    user: 'Carlos M.',  accion: 'abrió',     recurso: 'Podcast de POO',            ts: Date.now() - 156_000 },
    { id: 'e10', kind: 'return',   user: 'Ana P.',     accion: 'retornó a', recurso: 'Video de Sorting',          ts: Date.now() - 180_000 },
  ]);

  // Re-render every second for live time display
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Live event simulation
  useEffect(() => {
    if (!activo) return;
    const timer = setInterval(() => {
      const kind    = KINDS[Math.floor(Math.random() * KINDS.length)];
      const cfg     = KIND_CFG[kind];
      const user    = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
      const recurso = RECURSOS_MOCK[Math.floor(Math.random() * RECURSOS_MOCK.length)];
      setEventos(prev => [{
        id: `live-${Date.now()}`,
        kind,
        user,
        accion:  cfg.label,
        recurso,
        ts: Date.now(),
      }, ...prev].slice(0, 10));
    }, 2500);
    return () => clearInterval(timer);
  }, [activo]);

  const KPI_DATA: Array<{
    label: string; value: number; suffix: string;
    Icon: LucideIcon; color: string; bg: string;
  }> = [
    { label: 'Eventos hoy',      value: 1847, suffix: '',  Icon: Activity,     color: 'var(--accent-blue)', bg: 'rgba(59,110,248,0.12)'  },
    { label: 'Usuarios activos', value: 34,   suffix: '',  Icon: Users,        color: 'var(--vark-a)',      bg: 'rgba(167,139,250,0.12)' },
    { label: 'Recursos vistos',  value: 89,   suffix: '',  Icon: Eye,          color: 'var(--vark-r)',      bg: 'rgba(0,212,255,0.12)'   },
    { label: 'Tasa completitud', value: 73,   suffix: '%', Icon: CheckCircle2, color: 'var(--success)',     bg: 'rgba(0,230,118,0.12)'   },
  ];

  return (
    <motion.div
      variants={pageV}
      initial="hidden"
      animate="visible"
      style={{
        minHeight:       '100vh',
        background:      'var(--bg-primary)',
        padding:         '28px',
        boxSizing:       'border-box',
        display:         'flex',
        flexDirection:   'column',
        gap:             20,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{
            fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.6rem',
            color: 'var(--text-primary)', margin: 0,
          }}>
            Monitor de <span style={{ color: 'var(--accent-blue)' }}>Clickstream</span>
          </h1>

          <AnimatePresence mode="wait">
            {activo ? (
              <motion.div
                key="live"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(0,230,118,0.08)',
                  border: '1px solid rgba(0,230,118,0.28)',
                  borderRadius: 999, padding: '5px 13px',
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display: 'inline-block', width: 7, height: 7,
                    borderRadius: '50%', background: 'var(--success)',
                    boxShadow: '0 0 8px var(--success)',
                  }}
                />
                <span style={{
                  color: 'var(--success)', fontFamily: 'var(--font-dm-sans)',
                  fontWeight: 700, fontSize: '0.7rem',
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>
                  En vivo
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="paused"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Badge variant="warning">Pausado</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant={activo ? 'ghost' : 'primary'}
          onClick={() => setActivo(a => !a)}
        >
          {activo ? <Pause size={15} /> : <Play size={15} />}
          {activo ? 'Pausar seguimiento' : 'Reanudar seguimiento'}
        </Button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <motion.div
        variants={gridV}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
      >
        {KPI_DATA.map(kpi => {
          const Icon = kpi.Icon;
          return (
            <motion.div
              key={kpi.label}
              variants={cellV}
              whileHover={{ y: -3, boxShadow: '0 14px 40px rgba(0,0,0,0.5)' }}
              style={{ ...CARD, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem', fontWeight: 600,
                  color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                  background: kpi.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '2.1rem',
                color: kpi.color, lineHeight: 1,
              }}>
                <Counter target={kpi.value} suffix={kpi.suffix} />
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Area Chart ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.38 }}
        style={{ ...CARD, padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1rem',
              color: 'var(--text-primary)', margin: 0,
            }}>
              Eventos por hora
            </h2>
            <p style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
              color: 'var(--text-secondary)', margin: '4px 0 0',
            }}>
              Distribución de interacciones durante el día de hoy
            </p>
          </div>
          <Badge variant="info">Hoy</Badge>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={HOURLY_DATA} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b6ef8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b6ef8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="hora"
              tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'rgba(59,110,248,0.2)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="eventos"
              stroke="#3b6ef8"
              strokeWidth={2.5}
              fill="url(#gradBlue)"
              dot={false}
              activeDot={{ r: 5, fill: '#3b6ef8', stroke: '#050b1f', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Bottom row ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Left — Eventos recientes */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.46 }}
          style={{ ...CARD, padding: '22px', flex: '3 1 0', minWidth: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1rem',
              color: 'var(--text-primary)', margin: 0,
            }}>
              Eventos recientes
            </h2>
            <span style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
              color: 'var(--text-muted)', fontWeight: 500,
            }}>
              Últimos {eventos.length}
            </span>
          </div>

          {eventos.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '32px 0',
            }}>
              <Activity size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <span style={{
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}>
                Sin eventos registrados hoy
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
              <AnimatePresence initial={false}>
                {eventos.map(ev => {
                  const cfg    = KIND_CFG[ev.kind];
                  const EvIcon = cfg.Icon;
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: -20, scaleY: 0.85 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      {/* Kind icon */}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: `${cfg.color}18`,
                        border: `1px solid ${cfg.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <EvIcon size={13} color={cfg.color} />
                      </div>

                      {/* Description */}
                      <p style={{
                        flex: 1, margin: 0,
                        fontFamily: 'var(--font-dm-sans)', fontSize: '0.81rem',
                        color: 'var(--text-primary)', fontWeight: 400,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        <span style={{ color: cfg.color, fontWeight: 600 }}>{ev.user}</span>
                        {' '}{ev.accion}{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{ev.recurso}</span>
                      </p>

                      {/* Timestamp */}
                      <span style={{
                        fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
                        color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {formatTime(ev.ts)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Right — Recursos más vistos */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.54 }}
          style={{ ...CARD, padding: '22px', flex: '2 1 0', minWidth: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1rem',
              color: 'var(--text-primary)', margin: 0,
            }}>
              Recursos más vistos hoy
            </h2>
            <Badge variant="ghost">Top 5</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {TOP_RECURSOS.map((rec, i) => (
              <motion.div
                key={rec.titulo}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.58 + i * 0.07, duration: 0.3 }}
              >
                {/* Row header */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 10, marginBottom: 7,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{
                      fontFamily: 'var(--font-dm-sans)', fontWeight: 700, fontSize: '0.72rem',
                      color: 'var(--text-muted)', width: 14, textAlign: 'right', flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-dm-sans)', fontSize: '0.79rem', fontWeight: 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {rec.titulo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <Badge variant={VARK_BADGE[rec.vark]}>{rec.vark}</Badge>
                    <span style={{
                      fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                      fontWeight: 600, color: 'var(--text-muted)',
                    }}>
                      {rec.visitas}
                    </span>
                  </div>
                </div>

                {/* Animated horizontal bar */}
                <div style={{
                  height: 5, borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rec.pct}%` }}
                    transition={{ duration: 0.85, delay: 0.62 + i * 0.07, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 999,
                      background: VARK_COLOR[rec.vark],
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
