'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MousePointerClick, Clock, FileText, Award,
  ThumbsUp, ThumbsDown, Sparkles, CheckCircle2, BarChart2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import RadarChart from '@/components/ui/RadarChart';
import { perfil360Estudiante } from '@/lib/api/analitica';
import type { Perfil360 } from '@/lib/api/types';

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};
const PAGE = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const VARK_LABEL: Record<string, string> = { V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico' };
const VARK_BADGE: Record<string, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = { V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k' };

function fmtTiempo(seg: number) {
  if (seg < 60) return `${seg}s`;
  const m = Math.floor(seg / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function Perfil360Page() {
  const params = useParams();
  const router = useRouter();
  const id = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);
  const [data, setData] = useState<Perfil360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    perfil360Estudiante(id)
      .then((d) => { if (mounted) setData(d); })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : 'Error al cargar.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>;
  if (error || !data) return <div style={{ ...CARD, padding: 32, textAlign: 'center', color: 'var(--danger)' }}>{error ?? 'Sin datos'}</div>;

  const pv = data.perfil_vark;
  const radar = { v: Math.round(pv.V * 100), a: Math.round(pv.A * 100), r: Math.round(pv.R * 100), k: Math.round(pv.K * 100) };
  const cs = data.clickstream;
  const kpis: { Icon: LucideIcon; label: string; value: string; color: string }[] = [
    { Icon: MousePointerClick, label: 'Clics totales', value: String(cs.total_clics), color: 'var(--accent-blue)' },
    { Icon: Clock, label: 'Tiempo de estudio', value: fmtTiempo(cs.tiempo_total_segundos), color: 'var(--accent-cyan)' },
    { Icon: FileText, label: 'Recursos visitados', value: String(cs.recursos_unicos), color: 'var(--vark-a)' },
    { Icon: Award, label: 'Quizzes resueltos', value: String(data.quizzes.length), color: 'var(--success)' },
  ];

  return (
    <motion.div variants={PAGE} initial="hidden" animate="visible" style={{ maxWidth: 1180 }}>
      {/* Header */}
      <button onClick={() => router.back()} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem', marginBottom: 16, padding: 0,
      }}>
        <ArrowLeft size={15} /> Volver
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-syne), Syne, sans-serif',
        }}>
          {data.usuario.nombre_completo.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            {data.usuario.nombre_completo}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{data.usuario.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {data.estilo_dominante !== 'N/A' && (
            <Badge variant={VARK_BADGE[data.estilo_dominante] ?? 'info'} size="md">Dominante: {VARK_LABEL[data.estilo_dominante] ?? data.estilo_dominante}</Badge>
          )}
          <Badge variant={data.engagement === 'activo' ? 'success' : 'warning'} size="md">
            {data.engagement === 'activo' ? 'Activo' : 'En riesgo'}
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {kpis.map((k, i) => {
          const Icon = k.Icon;
          return (
            <div key={i} style={{ ...CARD, padding: '18px 20px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)', marginBottom: 12,
                background: `${k.color}18`, border: `1px solid ${k.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon size={16} color={k.color} /></div>
              <div style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Radar */}
        <div style={{ ...CARD, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <BarChart2 size={18} color="var(--accent-blue)" />
            <h2 style={ttl}>Perfil VARK actual</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <RadarChart data={radar} size={190} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['V', 'A', 'R', 'K'] as const).map((k) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant={VARK_BADGE[k]} size="sm">{VARK_LABEL[k]}</Badge>
                  <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '0.95rem' }}>{Math.round(pv[k] * 100)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top recursos por clics */}
        <div style={{ ...CARD, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <MousePointerClick size={18} color="var(--accent-cyan)" />
            <h2 style={ttl}>Recursos más visitados</h2>
          </div>
          {cs.top_recursos.length === 0 ? <Empty texto="Sin clics registrados." /> : cs.top_recursos.map((r, i) => (
            <div key={i} style={rowBetween(i < cs.top_recursos.length - 1)}>
              <span style={cellText}>{r['recurso__titulo']}</span>
              <Badge variant="info" size="sm">{r.clics} clics</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Evolución VARK */}
      <div style={{ ...CARD, padding: '24px 26px', marginBottom: 20 }}>
        <h2 style={{ ...ttl, marginBottom: 16 }}>Evolución del perfil VARK</h2>
        {data.evolucion.length === 0 ? <Empty texto="Aún sin historial de cambios." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.evolucion.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)', width: 90, flexShrink: 0 }}>{e.fecha}</span>
                <Badge variant="ghost" size="sm">{e.origen}</Badge>
                <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                  {(['V', 'A', 'R', 'K'] as const).map((k) => (
                    <span key={k} style={{ fontSize: '0.74rem', fontFamily: 'var(--font-dm-sans)', color: `var(--vark-${k.toLowerCase()})`, fontWeight: 700 }}>
                      {k} {Math.round(e[k] * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Quizzes */}
        <div style={{ ...CARD, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Award size={18} color="var(--success)" />
            <h2 style={ttl}>Quizzes</h2>
          </div>
          {data.quizzes.length === 0 ? <Empty texto="Sin quizzes resueltos." /> : data.quizzes.map((q, i) => (
            <div key={i} style={rowBetween(i < data.quizzes.length - 1)}>
              <span style={cellText}>{q.tema}</span>
              <Badge variant={q.puntaje >= 0.7 ? 'success' : q.puntaje >= 0.4 ? 'warning' : 'danger'} size="sm">
                {Math.round(q.puntaje * 100)}% ({q.respuestas_correctas}/{q.total_preguntas})
              </Badge>
            </div>
          ))}
        </div>

        {/* Recomendaciones + valoraciones */}
        <div style={{ ...CARD, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h2 style={ttl}>Recomendaciones recientes</h2>
          </div>
          {data.recomendaciones.length === 0 ? <Empty texto="Sin recomendaciones." /> : data.recomendaciones.slice(0, 5).map((r, i) => (
            <div key={i} style={rowBetween(i < Math.min(5, data.recomendaciones.length) - 1)}>
              <span style={cellText}>{r.recurso_titulo}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.vista && <CheckCircle2 size={13} color="var(--success)" />}
                <Badge variant="vark-r" size="sm">{Math.round(r.puntuacion * 100)}%</Badge>
              </span>
            </div>
          ))}
          {data.valoraciones.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-glass)' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-dm-sans)' }}>Valoraciones</p>
              {data.valoraciones.slice(0, 4).map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  {v.valoracion === 'util' ? <ThumbsUp size={13} color="var(--success)" /> : <ThumbsDown size={13} color="var(--danger)" />}
                  <span style={cellText}>{v.recurso_titulo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const ttl: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' };
const cellText: React.CSSProperties = { fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 };
function rowBetween(border: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: border ? '1px solid var(--border-glass)' : 'none' };
}
function Empty({ texto }: { texto: string }) {
  return <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)', margin: 0 }}>{texto}</p>;
}
