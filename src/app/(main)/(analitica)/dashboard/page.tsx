'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, CheckCircle2, Flame, Star,
  TrendingUp, TrendingDown, Video, FileText,
  Headphones, Code2, ChevronRight, Clock,
  Award, Zap, BarChart2, ArrowUpRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import RadarChart from '@/components/ui/RadarChart';
import Badge      from '@/components/ui/Badge';
import Button     from '@/components/ui/Button';
import { dashboardEstudiante } from '@/lib/api/analitica';
import { me as fetchMe } from '@/lib/api/accounts';
import { misRecomendaciones } from '@/lib/api/recomendacion';

// ─── Types ────────────────────────────────────────────────────────────────────

type VarkKey = 'v' | 'a' | 'r' | 'k';
interface VarkProfile { v: number; a: number; r: number; k: number }
type TipoRecurso = 'video' | 'documento' | 'audio' | 'ejercicio';
type EstiloVark  = 'V' | 'A' | 'R' | 'K';

interface RecursoCard {
  id: string; titulo: string; tipo: TipoRecurso;
  vark: EstiloVark; compatibilidad: number; tema: string;
}

interface ActividadItem {
  id: string; Icon: LucideIcon; descripcion: string;
  tiempo: string; color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STUDENT = { nombre: 'Ana García', avatar: 'AG' };

const MOCK_PROFILE: VarkProfile = { v: 85, a: 60, r: 72, k: 45 };

const VARK_DIMS: { key: VarkKey; label: string; color: string; badge: 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k' }[] = [
  { key: 'v', label: 'Visual',      color: 'var(--vark-v)', badge: 'vark-v' },
  { key: 'a', label: 'Auditivo',    color: 'var(--vark-a)', badge: 'vark-a' },
  { key: 'r', label: 'Lectura',     color: 'var(--vark-r)', badge: 'vark-r' },
  { key: 'k', label: 'Kinestésico', color: 'var(--vark-k)', badge: 'vark-k' },
];

const MOCK_ACTIVIDAD: ActividadItem[] = [
  { id: 'a1', Icon: CheckCircle2, descripcion: 'Completaste Quiz de Vectores',         tiempo: 'hace 2h',  color: 'var(--success)'     },
  { id: 'a2', Icon: Video,        descripcion: 'Viste "Intro a Matrices" (video)',      tiempo: 'hace 3h',  color: 'var(--vark-v)'      },
  { id: 'a3', Icon: CheckCircle2, descripcion: 'Completaste Quiz de Cadenas',           tiempo: 'ayer',     color: 'var(--success)'     },
  { id: 'a4', Icon: FileText,     descripcion: 'Leíste artículo sobre Recursividad',   tiempo: 'ayer',     color: 'var(--vark-r)'      },
  { id: 'a5', Icon: Code2,        descripcion: 'Resolviste ejercicio de Búsqueda',     tiempo: 'hace 2d',  color: 'var(--vark-k)'      },
];

const TIPO_ICON: Record<TipoRecurso, LucideIcon> = {
  video:     Video,
  documento: FileText,
  audio:     Headphones,
  ejercicio: Code2,
};

const TIPO_LABEL: Record<TipoRecurso, string> = {
  video: 'Video', documento: 'Artículo', audio: 'Audio', ejercicio: 'Ejercicio',
};

const VARK_BADGE_VAR: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};

const MOCK_RECOMENDADOS: RecursoCard[] = [
  { id: 'r1', titulo: 'Visualización de Algoritmos de Ordenamiento', tipo: 'video',     vark: 'V', compatibilidad: 96, tema: 'Vectores'  },
  { id: 'r2', titulo: 'Guía completa de Matrices en Python',          tipo: 'documento', vark: 'R', compatibilidad: 88, tema: 'Matrices'  },
  { id: 'r3', titulo: 'Ejercicios interactivos: Cadenas de texto',    tipo: 'ejercicio', vark: 'K', compatibilidad: 81, tema: 'Cadenas'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDominant(profile: VarkProfile): { key: VarkKey; label: string; badge: 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k' } {
  const max = (Object.entries(profile) as [VarkKey, number][]).reduce((a, b) => (b[1] > a[1] ? b : a));
  return VARK_DIMS.find((d) => d.key === max[0])!;
}

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días',   emoji: '☀️' };
  if (h < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
  return              { text: 'Buenas noches', emoji: '🌙' };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.round((1200 / 1000) * 60);
    const timer = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setVal(Math.round(eased * to));
      if (frame >= totalFrames) { setVal(to); clearInterval(timer); }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val}{suffix}</>;
}

// ─── Inline Progress Bar ──────────────────────────────────────────────────────

function ProgressBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-glass-hover)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 99, background: color }}
      />
    </div>
  );
}

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

const STAGGER_CONTAINER = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const STAGGER_ITEM = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── KPI config ───────────────────────────────────────────────────────────────

const KPI_ITEMS = [
  { Icon: BookOpen,    label: 'Recursos completados', value: 24,  suffix: '',  trend: +3,  color: 'var(--accent-blue)'  },
  { Icon: Award,       label: 'Quizzes aprobados',    value: 18,  suffix: '',  trend: +2,  color: 'var(--success)'      },
  { Icon: Flame,       label: 'Racha de días activos',value: 7,   suffix: 'd', trend: +1,  color: 'var(--warning)'      },
  { Icon: Star,        label: 'Puntuación general',   value: 892, suffix: '',  trend: -12, color: 'var(--vark-a)'       },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const TIPO_MAP_API: Record<string, TipoRecurso> = {
  video: 'video', articulo: 'documento', documento: 'documento', ejercicio: 'ejercicio',
};

export default function DashboardPage() {
  const router   = useRouter();
  const greeting = getGreeting();

  // ── Estado conectado al backend (CU-17) ─────────────────────────────────────
  const [profile, setProfile]         = useState<VarkProfile>(MOCK_PROFILE);
  const [studentName, setStudentName] = useState<string>(MOCK_STUDENT.nombre);
  const [kpis, setKpis]               = useState(KPI_ITEMS);
  const [recomendados, setRecomendados] = useState<RecursoCard[]>(MOCK_RECOMENDADOS);

  useEffect(() => {
    let mounted = true;
    fetchMe()
      .then((u) => { if (mounted) setStudentName(u.nombre_completo || u.nombre); })
      .catch(() => {});
    dashboardEstudiante()
      .then((d) => {
        if (!mounted) return;
        const pv = d.perfil_vark;
        setProfile({
          v: Math.round((pv.V ?? 0) * 100),
          a: Math.round((pv.A ?? 0) * 100),
          r: Math.round((pv.R ?? 0) * 100),
          k: Math.round((pv.K ?? 0) * 100),
        });
        setKpis((prev) => prev.map((kpi) => {
          if (kpi.label === 'Recursos completados') return { ...kpi, value: d.total_recursos_vistos, trend: 0 };
          if (kpi.label === 'Quizzes aprobados')    return { ...kpi, value: d.total_quizzes_realizados, trend: 0 };
          return kpi;
        }));
      })
      .catch(() => {});
    misRecomendaciones()
      .then((recs) => {
        if (!mounted || recs.length === 0) return;
        setRecomendados(recs.slice(0, 3).map((r) => ({
          id: String(r.id),
          titulo: r.recurso_titulo,
          tipo: TIPO_MAP_API[r.recurso_tipo] ?? 'documento',
          vark: r.recurso_categoria_vark,
          compatibilidad: Math.round(r.puntuacion * 100),
          tema: r.tema_nombre,
        })));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const dominant = getDominant(profile);

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', maxWidth: 1200 }}
    >
      {/* ── Hero greeting ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '2rem', fontWeight: 800,
            color: 'var(--text-primary)', margin: 0, lineHeight: 1.2,
          }}
        >
          {greeting.emoji} {greeting.text},{' '}
          <span style={{ color: 'var(--accent-blue)' }}>{studentName}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tu estilo dominante hoy es
          </span>
          <Badge variant={dominant.badge} size="md">{dominant.label}</Badge>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            · {profile[dominant.key]}% de afinidad
          </span>
        </motion.div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
      >
        {kpis.map((kpi, i) => {
          const Icon  = kpi.Icon;
          const up    = kpi.trend >= 0;
          const TrendIcon = up ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={i}
              variants={STAGGER_ITEM}
              whileHover={{ scale: 1.025, boxShadow: 'var(--shadow-card), 0 0 22px rgba(59,110,248,0.14)' }}
              style={{ ...CARD, padding: '20px 22px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: `${kpi.color}18`, border: `1px solid ${kpi.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={17} color={kpi.color} />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: '0.72rem', fontWeight: 600,
                  color: up ? 'var(--success)' : 'var(--danger)',
                }}>
                  <TrendIcon size={12} />
                  {up ? '+' : ''}{kpi.trend}
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-syne), Syne, sans-serif',
                fontSize: '2rem', fontWeight: 800,
                color: 'var(--text-primary)', lineHeight: 1,
                marginBottom: 4,
              }}>
                <AnimatedCounter to={kpi.value} suffix={kpi.suffix} />
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {kpi.label}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main: Radar Card (full width) ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.18 }}
        whileHover={{ boxShadow: 'var(--shadow-card), 0 0 40px rgba(59,110,248,0.12)' }}
        style={{ ...CARD, padding: '30px 36px', marginBottom: 22 }}
      >
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-sm)',
              background: 'rgba(59,110,248,0.12)', border: '1px solid rgba(59,110,248,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart2 size={18} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{
                margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif',
                fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)',
              }}>
                Tu perfil de aprendizaje actual
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Vector [V, A, R, K] calculado con tus últimas sesiones
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/historial')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            Ver historial completo
            <ChevronRight size={15} />
          </Button>
        </div>

        {/* Radar + dimension breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          {/* Radar chart — prominent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.25, ease: 'easeOut' }}
            style={{ flex: '0 0 auto' }}
          >
            <RadarChart data={profile} size={340} />
          </motion.div>

          {/* VARK dimension breakdown */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {VARK_DIMS.map((dim, i) => (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.38, delay: 0.3 + i * 0.08 }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: dim.color, flexShrink: 0,
                      boxShadow: `0 0 6px ${dim.color}80`,
                    }} />
                    <span style={{
                      fontSize: '0.82rem', fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}>
                      {dim.label}
                    </span>
                    {dim.key === dominant.key && (
                      <Badge variant={dim.badge} size="sm">Dominante</Badge>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    fontSize: '1.05rem', fontWeight: 800, color: dim.color,
                  }}>
                    {profile[dim.key]}%
                  </span>
                </div>
                <ProgressBar value={profile[dim.key]} color={dim.color} delay={0.35 + i * 0.08} />
              </motion.div>
            ))}

            {/* Tip contextual */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(59,110,248,0.07)', border: '1px solid rgba(59,110,248,0.18)',
                fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55,
              }}
            >
              <Zap size={13} color="var(--accent-blue)" style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Como aprendiz <strong style={{ color: 'var(--vark-v)' }}>Visual</strong>, los videos y
              diagramas te ayudan a comprender conceptos complejos más rápido.
              Hoy tenemos{' '}
              <strong style={{ color: 'var(--text-primary)' }}>8 recursos visuales</strong> nuevos para ti.
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Grid inferior ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* LEFT — Actividad reciente */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          style={{ ...CARD, padding: '24px 26px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
            }}>
              Actividad reciente
            </h3>
            <Clock size={15} color="var(--text-muted)" />
          </div>

          <AnimatePresence>
            <motion.div
              variants={STAGGER_CONTAINER}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {MOCK_ACTIVIDAD.map((item) => {
                const Icon = item.Icon;
                return (
                  <motion.div
                    key={item.id}
                    variants={STAGGER_ITEM}
                    whileHover={{ background: 'var(--bg-glass-hover)', x: 2 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      background: `${item.color}18`, border: `1px solid ${item.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} color={item.color} />
                    </div>
                    <span style={{
                      flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)',
                      fontWeight: 500, lineHeight: 1.3,
                    }}>
                      {item.descripcion}
                    </span>
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--text-muted)',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {item.tiempo}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* RIGHT — Recomendados para ti */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.34 }}
          style={{ ...CARD, padding: '24px 26px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
            }}>
              Recomendados para ti hoy
            </h3>
            <Button
              variant="ghost"
              onClick={() => router.push('/recomendaciones')}
              style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Ver todos <ArrowUpRight size={13} />
            </Button>
          </div>

          <motion.div
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {recomendados.map((rec, i) => {
              const Icon = TIPO_ICON[rec.tipo];
              const pct  = rec.compatibilidad;
              return (
                <motion.div
                  key={rec.id}
                  variants={STAGGER_ITEM}
                  whileHover={{ scale: 1.015, boxShadow: 'var(--shadow-card), 0 0 16px rgba(59,110,248,0.1)' }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                      background: 'rgba(59,110,248,0.1)', border: '1px solid rgba(59,110,248,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color="var(--accent-blue)" />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.82rem', fontWeight: 600,
                        color: 'var(--text-primary)', marginBottom: 5,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {rec.titulo}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Badge variant={VARK_BADGE_VAR[rec.vark]} size="sm">{rec.vark}</Badge>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {TIPO_LABEL[rec.tipo]} · {rec.tema}
                        </span>
                      </div>

                      {/* Compatibility bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 4, borderRadius: 99,
                          background: 'var(--bg-glass-hover)', overflow: 'hidden',
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.65, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                            style={{
                              height: '100%', borderRadius: 99,
                              background: `linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))`,
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700,
                          color: pct >= 90 ? 'var(--success)' : pct >= 80 ? 'var(--warning)' : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}>
                          {pct}% afinidad
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
