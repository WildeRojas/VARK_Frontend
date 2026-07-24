'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, FileText, Award,
  AlertTriangle, Sparkles, ArrowUpRight, BarChart2, BrainCircuit,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import RadarChart from '@/components/ui/RadarChart';
import { dashboardAdmin } from '@/lib/api/analitica';
import { estadoML } from '@/lib/api/recomendacion';
import type { DashboardAdmin, MLEstado } from '@/lib/api/types';

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const PAGE = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const ITEM = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const VARK_LABEL: Record<string, string> = { V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico' };
const VARK_BADGE: Record<string, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardAdmin | null>(null);
  const [ml, setMl] = useState<MLEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    dashboardAdmin()
      .then((d) => { if (mounted) setData(d); })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : 'Error al cargar.'); })
      .finally(() => { if (mounted) setLoading(false); });
    estadoML()
      .then((m) => { if (mounted) setMl(m); })
      .catch(() => { /* tarjeta ML opcional */ });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>
    );
  }
  if (error || !data) {
    return (
      <div style={{ ...CARD, padding: 32, textAlign: 'center', color: 'var(--danger)' }}>
        {error ?? 'Sin datos'}
      </div>
    );
  }

  const kpis: { Icon: LucideIcon; label: string; value: number; color: string }[] = [
    { Icon: Users, label: 'Estudiantes activos', value: data.totales.estudiantes, color: 'var(--accent-blue)' },
    { Icon: GraduationCap, label: 'Docentes activos', value: data.totales.docentes, color: 'var(--accent-purple)' },
    { Icon: FileText, label: 'Recursos', value: data.totales.recursos, color: 'var(--vark-r)' },
    { Icon: Award, label: 'Quizzes resueltos', value: data.totales.quizzes_realizados, color: 'var(--success)' },
  ];

  const dist = data.distribucion_vark;
  const radarData = { v: dist.V, a: dist.A, r: dist.R, k: dist.K };
  const totalDist = dist.V + dist.A + dist.R + dist.K || 1;

  return (
    <motion.div variants={PAGE} initial="hidden" animate="visible" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <h1 style={{
          fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: 'var(--text-primary)', margin: 0,
        }}>
          Panel del <span style={{ color: 'var(--accent-blue)' }}>administrador</span>
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Visión global de la plataforma
        </p>
      </div>

      {/* KPIs */}
      <motion.div variants={STAGGER} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
        {kpis.map((k, i) => {
          const Icon = k.Icon;
          return (
            <motion.div key={i} variants={ITEM} whileHover={{ scale: 1.025 }} style={{ ...CARD, padding: '20px 22px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)', marginBottom: 14,
                background: `${k.color}18`, border: `1px solid ${k.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={k.color} />
              </div>
              <div style={{
                fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '2rem',
                fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1,
              }}>
                {k.value}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>{k.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Distribución VARK */}
        <motion.div variants={ITEM} initial="hidden" animate="visible" style={{ ...CARD, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <BarChart2 size={18} color="var(--accent-blue)" />
            <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Distribución VARK de la población
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <RadarChart data={radarData} size={200} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['V', 'A', 'R', 'K'] as const).map((k) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant={VARK_BADGE[k]} size="sm">{VARK_LABEL[k]}</Badge>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{dist[k]}</strong>{' '}
                    ({Math.round((dist[k] / totalDist) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tasa aceptación IA + recursos efectivos */}
        <motion.div variants={ITEM} initial="hidden" animate="visible" style={{ ...CARD, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recursos más efectivos
            </h2>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tasa de aceptación de recursos sugeridos por IA:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>
              {data.tasa_aceptacion_ia != null ? `${Math.round(data.tasa_aceptacion_ia * 100)}%` : '—'}
            </strong>
          </div>
          {data.recursos_mas_efectivos.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Aún no hay datos de clics.</p>
          ) : data.recursos_mas_efectivos.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: i < data.recursos_mas_efectivos.length - 1 ? '1px solid var(--border-glass)' : 'none',
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                {r['recurso__titulo']}
              </span>
              <Badge variant="info" size="sm">{r.total_clics} clics</Badge>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Modelo de Machine Learning (Fase 5) */}
      <motion.div variants={ITEM} initial="hidden" animate="visible" style={{ ...CARD, padding: '24px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <BrainCircuit size={18} color="var(--accent-purple)" />
          <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Modelo de Machine Learning
          </h2>
          {ml && (
            <Badge variant={ml.modelo_disponible ? 'success' : 'warning'} size="sm">
              {ml.modelo_disponible ? 'Entrenado' : 'Sin entrenar'}
            </Badge>
          )}
          {ml?.modelo_disponible && (
            <Badge variant={ml.usar_ml ? 'info' : 'default'} size="sm">
              {ml.usar_ml ? `Activo · CBF ${ml.peso_cbf} / ML ${ml.peso_ml}` : 'Inactivo (solo CBF)'}
            </Badge>
          )}
        </div>

        {!ml || !ml.modelo_disponible || !ml.metricas ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            No hay un modelo entrenado. Ejecuta <code style={{ color: 'var(--accent-purple)' }}>python manage.py seed_ml</code> y luego{' '}
            <code style={{ color: 'var(--accent-purple)' }}>python manage.py entrenar_ml</code>.
          </p>
        ) : (
          <>
            {/* Clasificador supervisado */}
            <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Clasificador de utilidad (supervisado)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              {([
                ['Accuracy', ml.metricas.clasificador.accuracy],
                ['Precision', ml.metricas.clasificador.precision],
                ['Recall', ml.metricas.clasificador.recall],
                ['F1-score', ml.metricas.clasificador.f1],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: label === 'F1-score' ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
                    {Math.round(val * 100)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Entrenado con <strong style={{ color: 'var(--text-primary)' }}>{ml.metricas.clasificador.n_muestras}</strong> interacciones ·
              baseline (clase mayoritaria) <strong style={{ color: 'var(--text-primary)' }}>{Math.round(ml.metricas.clasificador.baseline_mayoria * 100)}%</strong>
            </p>

            {/* Clustering no supervisado */}
            <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Segmentación de estudiantes (K-Means, no supervisado)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant="vark-a" size="sm">{ml.metricas.clustering.n_clusters} clusters</Badge>
                {ml.metricas.clustering.silhouette != null && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    silhouette <strong style={{ color: 'var(--text-primary)' }}>{ml.metricas.clustering.silhouette}</strong>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ml.metricas.clustering.tamanos.map((t, i) => (
                  <span key={i} style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: 99, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                    C{i + 1}: {t}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Bajo engagement */}
      <motion.div variants={ITEM} initial="hidden" animate="visible" style={{ ...CARD, padding: '24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={18} color="var(--warning)" />
          <h2 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Estudiantes con bajo engagement
          </h2>
          <Badge variant="warning" size="sm">{data.estudiantes_bajo_engagement.length}</Badge>
        </div>
        {data.estudiantes_bajo_engagement.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Todos los estudiantes están activos. 🎉</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {data.estudiantes_bajo_engagement.map((e) => (
              <motion.div key={e.id} whileHover={{ x: 2 }}
                onClick={() => router.push(`/admin/estudiantes/${e.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.nombre}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.email}</p>
                </div>
                <ArrowUpRight size={14} color="var(--text-muted)" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
