'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, User, ExternalLink, Check, X, AlertTriangle,
  ChevronRight, Clock, Edit2, BookOpen, Inbox,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge  from '@/components/ui/Badge';
import Modal  from '@/components/ui/Modal';
import { listarSugerencias, aprobarSugerencia, rechazarSugerencia } from '@/lib/api/contenido';
import type { SugerenciaIA } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type EstiloVark  = 'V' | 'A' | 'R' | 'K';
type Dificultad  = 1 | 2 | 3;
type Origen      = 'IA' | 'Manual';
type EstadoRec   = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Corrección';
type TabId       = 'Pendiente' | 'Aprobado' | 'Rechazado';

interface HistorialItem {
  fecha:   string;
  usuario: string;
  accion:  string;
}

interface RecursoRevision {
  id:          string;
  titulo:      string;
  url:         string;
  urlCorta:    string;
  descripcion: string;
  vark:        EstiloVark;
  dificultad:  Dificultad;
  tema:        string;
  origen:      Origen;
  autor:       string;
  hace:        string;
  estado:      EstadoRec;
  motivo?:     string;
  historial:   HistorialItem[];
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK: RecursoRevision[] = [
  {
    id: '1',
    titulo: 'Python para principiantes – Curso completo en video',
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    urlCorta: 'youtube.com/watch?v=kqtD5…',
    descripcion:
      'Curso introductorio de Python con más de 4 horas de contenido audiovisual. Cubre variables, tipos de datos, estructuras de control y funciones con ejemplos prácticos y ejercicios resueltos en pantalla.',
    vark: 'V', dificultad: 1, tema: 'python',
    origen: 'IA', autor: 'Sistema IA', hace: 'Hace 2 horas',
    estado: 'Pendiente',
    historial: [],
  },
  {
    id: '2',
    titulo: 'Real Python – Guía de comprensión de listas',
    url: 'https://realpython.com/list-comprehension-python/',
    urlCorta: 'realpython.com/list-compre…',
    descripcion:
      'Artículo técnico detallado con múltiples ejemplos de código, tablas comparativas y referencias a la documentación oficial de Python sobre comprensión de listas.',
    vark: 'R', dificultad: 2, tema: 'cadenas',
    origen: 'IA', autor: 'Sistema IA', hace: 'Hace 5 horas',
    estado: 'Pendiente',
    historial: [],
  },
  {
    id: '3',
    titulo: 'Podcast: Fundamentos de algoritmos – CS50',
    url: 'https://podcast.example.com/cs50-algorithms',
    urlCorta: 'podcast.example.com/cs50…',
    descripcion:
      'Serie de episodios de audio basados en el curso CS50 de Harvard que explican recursividad, búsqueda binaria y ordenamiento de forma auditiva con ejemplos narrados.',
    vark: 'A', dificultad: 2, tema: 'algoritmos',
    origen: 'Manual', autor: 'Prof. García', hace: 'Hace 1 día',
    estado: 'Pendiente',
    historial: [
      { fecha: '09 may 2026', usuario: 'Prof. García', accion: 'Recurso enviado para revisión.' },
    ],
  },
  {
    id: '4',
    titulo: 'Exercism – Track de Python: ejercicios prácticos',
    url: 'https://exercism.org/tracks/python',
    urlCorta: 'exercism.org/tracks/python',
    descripcion:
      'Plataforma de ejercicios progresivos con retroalimentación de mentores. Incluye más de 130 ejercicios con casos de prueba automatizados.',
    vark: 'K', dificultad: 2, tema: 'estructuras',
    origen: 'IA', autor: 'Sistema IA', hace: 'Hace 2 días',
    estado: 'Aprobado',
    historial: [
      { fecha: '08 may 2026', usuario: 'Sistema IA',    accion: 'Recurso sugerido automáticamente.' },
      { fecha: '08 may 2026', usuario: 'Prof. Martínez', accion: 'Aprobado y publicado en repositorio.' },
    ],
  },
  {
    id: '5',
    titulo: 'Visualgo – Visualización de estructuras de datos',
    url: 'https://visualgo.net/en',
    urlCorta: 'visualgo.net/en',
    descripcion:
      'Herramienta interactiva que anima visualmente algoritmos de ordenamiento, árboles y grafos. Permite controlar la velocidad y ver el paso a paso de cada operación.',
    vark: 'V', dificultad: 3, tema: 'algoritmos',
    origen: 'Manual', autor: 'Prof. Ruiz', hace: 'Hace 3 días',
    estado: 'Rechazado',
    motivo: 'El nivel de dificultad no corresponde al perfil actual del grupo. Agregar en ciclo 3.',
    historial: [
      { fecha: '07 may 2026', usuario: 'Prof. Ruiz',     accion: 'Recurso enviado para revisión.' },
      { fecha: '07 may 2026', usuario: 'Prof. Martínez', accion: 'Rechazado con motivo especificado.' },
    ],
  },
  {
    id: '6',
    titulo: 'Automate the Boring Stuff – Capítulo sobre archivos',
    url: 'https://automatetheboringstuff.com/2e/chapter9/',
    urlCorta: 'automatetheboringstuff.com…',
    descripcion:
      'Capítulo gratuito del libro que cubre lectura y escritura de archivos, rutas, manejo de CSV y PDF en Python.',
    vark: 'R', dificultad: 1, tema: 'python',
    origen: 'IA', autor: 'Sistema IA', hace: 'Hace 4 horas',
    estado: 'Pendiente',
    historial: [],
  },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'Pendiente',  label: 'Pendientes'  },
  { id: 'Aprobado',   label: 'Aprobados'   },
  { id: 'Rechazado',  label: 'Rechazados'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const VARK_BADGE: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};
const VARK_LABEL: Record<EstiloVark, string> = {
  V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico',
};
const DIFICULTAD_LABEL: Record<Dificultad, string> = {
  1: '★ Básico', 2: '★★ Intermedio', 3: '★★★ Avanzado',
};
const TEMA_LABEL: Record<string, string> = {
  python:      'Python Básico',
  cadenas:     'Cadenas',
  estructuras: 'Estructuras de datos',
  funciones:   'Funciones',
  poo:         'POO',
  algoritmos:  'Algoritmos',
};

// ─── Inline editable select ────────────────────────────────────────────────────
function InlineSelect<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '0.8rem',
        fontWeight: 600,
        padding: '4px 8px',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#0a1535' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 10px',
        fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.09em',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {children}
    </p>
  );
}

// ─── List item card ────────────────────────────────────────────────────────────
function RevisionCard({
  recurso: r, selected, acting, onClick,
}: {
  recurso:  RecursoRevision;
  selected: boolean;
  acting:   boolean;
  onClick:  () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: acting ? 0.45 : 1, x: 0 }}
      exit={{ opacity: 0, x: -48, transition: { duration: 0.26 } }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
      onClick={onClick}
      whileHover={{ x: 3 }}
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
        background: selected ? 'rgba(59,110,248,0.07)' : 'var(--bg-glass)',
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 1px rgba(59,110,248,0.22), 0 4px 16px rgba(59,110,248,0.1)'
          : 'none',
        transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      {/* Row 1: origen avatar + title */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            flexShrink: 0, width: 30, height: 30,
            borderRadius: '50%',
            background: r.origen === 'IA'
              ? 'rgba(59,110,248,0.15)'
              : 'rgba(167,139,250,0.13)',
            border: `1px solid ${r.origen === 'IA' ? 'rgba(59,110,248,0.3)' : 'rgba(167,139,250,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: r.origen === 'IA' ? 'var(--accent-blue)' : 'var(--vark-a)',
          }}
        >
          {r.origen === 'IA' ? <Bot size={14} /> : <User size={14} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontWeight: 700, fontSize: '0.86rem',
              color: 'var(--text-primary)', lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {r.titulo}
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
              color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {r.urlCorta}
          </p>
        </div>
      </div>

      {/* Row 2: badges + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Badge variant={VARK_BADGE[r.vark]} size="sm">
            {r.vark}
          </Badge>
          <Badge variant="ghost" size="sm">
            {DIFICULTAD_LABEL[r.dificultad]}
          </Badge>
          <Badge variant={r.origen === 'IA' ? 'info' : 'default'} size="sm">
            {r.origen}
          </Badge>
        </div>
        <span
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
            color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}
        >
          <Clock size={10} />
          {r.hace}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Helpers API → UI ─────────────────────────────────────────────────────────
const NIVEL_TO_DIF: Record<string, 1 | 2 | 3> = {
  basico: 1, intermedio: 2, avanzado: 3,
};

function toRecursoRevision(s: SugerenciaIA): RecursoRevision {
  const nivelLower = s.nivel_complejidad.toLowerCase();
  return {
    id:          String(s.id),
    titulo:      s.titulo,
    url:         s.url,
    urlCorta:    s.url.replace(/^https?:\/\//, '').slice(0, 30) + (s.url.length > 36 ? '…' : ''),
    descripcion: s.descripcion,
    vark:        s.categoria_vark,
    dificultad:  NIVEL_TO_DIF[nivelLower] ?? 1,
    tema:        s.tema_nombre,
    origen:      s.revisado_por ? 'Manual' : 'IA',
    autor:       s.revisado_por_email ?? 'Sistema IA',
    hace:        s.fecha_sugerencia
      ? new Date(s.fecha_sugerencia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    estado:      s.estado === 'pendiente' ? 'Pendiente'
                 : s.estado === 'aprobado' ? 'Aprobado'
                 : 'Rechazado',
    historial:   [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AprobacionPage() {
  const [recursos,    setRecursos]    = useState<RecursoRevision[]>([]);
  const [tab,         setTab]         = useState<TabId>('Pendiente');
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [rechazando,  setRechazando]  = useState(false);
  const [motivo,      setMotivo]      = useState('');
  const [motivoErr,   setMotivoErr]   = useState('');
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Metadatos editables inline del recurso seleccionado
  const [editVark,  setEditVark]  = useState<EstiloVark>('V');
  const [editDif,   setEditDif]   = useState<Dificultad>(1);
  const [editTema,  setEditTema]  = useState('python');

  const counts = useMemo(() => ({
    Pendiente:  recursos.filter((r) => r.estado === 'Pendiente').length,
    Aprobado:   recursos.filter((r) => r.estado === 'Aprobado').length,
    Rechazado:  recursos.filter((r) => r.estado === 'Rechazado').length,
  }), [recursos]);

  const filtered = useMemo(
    () => recursos.filter((r) => r.estado === tab),
    [recursos, tab],
  );

  const selected = useMemo(
    () => recursos.find((r) => r.id === selectedId) ?? null,
    [recursos, selectedId],
  );

  // ── Cargar datos al montar ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    // Cargamos todas las sugerencias (todos los estados)
    Promise.all([
      listarSugerencias('pendiente'),
      listarSugerencias('aprobado'),
      listarSugerencias('rechazado'),
    ])
      .then(([pend, apro, rech]) => {
        if (!mounted) return;
        setRecursos([
          ...pend.map(toRecursoRevision),
          ...apro.map(toRecursoRevision),
          ...rech.map(toRecursoRevision),
        ]);
      })
      .catch((err: Error) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Sync editable fields when selection changes
  const handleSelect = (r: RecursoRevision) => {
    setSelectedId(r.id === selectedId ? null : r.id);
    setRechazando(false);
    setMotivo('');
    setMotivoErr('');
    setEditVark(r.vark);
    setEditDif(r.dificultad);
    setEditTema(r.tema);
  };

  const applyAction = async (id: string, nuevoEstado: 'Aprobado' | 'Rechazado') => {
    setActionId(id);
    try {
      const pk = Number(id);
      if (nuevoEstado === 'Aprobado') {
        await aprobarSugerencia(pk);
      } else {
        await rechazarSugerencia(pk);
      }
      setRecursos((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, estado: nuevoEstado, vark: editVark, dificultad: editDif, tema: editTema }
            : r,
        ),
      );
      setSelectedId(null);
      setRechazando(false);
      setMotivo('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar sugerencia');
    } finally {
      setActionId(null);
    }
  };

  const handleRechazar = () => {
    if (!motivo.trim()) { setMotivoErr('Debes indicar el motivo del rechazo'); return; }
    applyAction(selectedId!, 'Rechazado');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>
        Cargando sugerencias…
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--topbar-height, 70px))',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {error && (
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'rgba(255,82,82,0.12)', border: '1px solid rgba(255,82,82,0.4)', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem', color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {/* ════════════════════════════════════════════════════════════════════
          LEFT — 60%
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '60%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-glass)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '28px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h1
              style={{
                fontFamily: 'var(--font-syne), Syne, sans-serif',
                fontWeight: 800, fontSize: '1.45rem',
                color: 'var(--text-primary)', margin: 0,
              }}
            >
              Pendientes de{' '}
              <span style={{ color: 'var(--accent-blue)' }}>revisión</span>
            </h1>
            {counts.Pendiente > 0 && (
              <Badge variant="warning">{counts.Pendiente} pendientes</Badge>
            )}
          </div>

          {/* Tabs with sliding indicator */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-glass)',
              position: 'relative',
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTab(t.id); setSelectedId(null); setRechazando(false); }}
                  style={{
                    position: 'relative',
                    padding: '10px 18px',
                    border: 'none', background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.82rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                    transition: 'color 0.18s',
                    display: 'flex', alignItems: 'center', gap: 7,
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                  {/* Count pill */}
                  <span
                    style={{
                      padding: '1px 7px',
                      borderRadius: 999,
                      background: active ? 'rgba(59,110,248,0.15)' : 'var(--bg-glass)',
                      border: `1px solid ${active ? 'rgba(59,110,248,0.3)' : 'var(--border-glass)'}`,
                      fontSize: '0.68rem', fontWeight: 700,
                      color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                      transition: 'all 0.18s',
                    }}
                  >
                    {counts[t.id]}
                  </span>

                  {/* Sliding indicator */}
                  {active && (
                    <motion.div
                      layoutId="tab-indicator-aprobacion"
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 2, background: 'var(--accent-blue)',
                        borderRadius: '2px 2px 0 0',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div
          style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 28px 28px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, padding: '60px 24px', textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 56, height: 56,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(59,110,248,0.06)',
                    border: '1px solid rgba(59,110,248,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(59,110,248,0.4)',
                  }}
                >
                  <Inbox size={26} />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  No hay recursos en este estado.
                </p>
              </motion.div>
            ) : (
              filtered.map((r) => (
                <RevisionCard
                  key={r.id}
                  recurso={r}
                  selected={selectedId === r.id}
                  acting={actionId === r.id}
                  onClick={() => handleSelect(r)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT — 40%  sticky
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '40%',
          position: 'sticky', top: 0, alignSelf: 'flex-start',
          height: '100%', overflowY: 'auto',
          padding: '28px 28px 36px',
        }}
      >
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Title block */}
              <div>
                <p style={labelStyle}>Recurso seleccionado</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    fontWeight: 800, fontSize: '1.1rem',
                    color: 'var(--text-primary)',
                    margin: '0 0 12px', lineHeight: 1.35,
                  }}
                >
                  {selected.titulo}
                </h2>

                {/* URL + open link */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-glass)',
                  }}
                >
                  <span
                    style={{
                      flex: 1, fontFamily: 'var(--font-dm-sans)',
                      fontSize: '0.75rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {selected.url}
                  </span>
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(59,110,248,0.12)',
                      border: '1px solid rgba(59,110,248,0.25)',
                      color: 'var(--accent-blue)',
                      fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                      fontWeight: 700, textDecoration: 'none', flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <ExternalLink size={11} />
                    Abrir enlace
                  </a>
                </div>
              </div>

              {/* Description */}
              <div>
                <SectionLabel>Descripción</SectionLabel>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.86rem',
                    color: 'var(--text-secondary)', lineHeight: 1.65,
                  }}
                >
                  {selected.descripcion}
                </p>
              </div>

              <div style={{ height: 1, background: 'var(--border-glass)' }} />

              {/* Editable metadata */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Edit2 size={13} color="var(--text-muted)" />
                  <SectionLabel>Metadatos sugeridos (editables)</SectionLabel>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <MetaRow label="Estilo VARK">
                    <InlineSelect<EstiloVark>
                      value={editVark}
                      options={[
                        { value: 'V', label: 'V — Visual' },
                        { value: 'A', label: 'A — Auditivo' },
                        { value: 'R', label: 'R — Lectura' },
                        { value: 'K', label: 'K — Kinestésico' },
                      ]}
                      onChange={setEditVark}
                    />
                  </MetaRow>
                  <MetaRow label="Dificultad">
                    <InlineSelect<string>
                      value={String(editDif)}
                      options={[
                        { value: '1', label: '★ Básico' },
                        { value: '2', label: '★★ Intermedio' },
                        { value: '3', label: '★★★ Avanzado' },
                      ]}
                      onChange={(v) => setEditDif(Number(v) as Dificultad)}
                    />
                  </MetaRow>
                  <MetaRow label="Tema">
                    <InlineSelect<string>
                      value={editTema}
                      options={Object.entries(TEMA_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                      onChange={setEditTema}
                    />
                  </MetaRow>
                </div>
              </div>

              {/* Historial */}
              {selected.historial.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--border-glass)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <BookOpen size={13} color="var(--text-muted)" />
                      <SectionLabel>Historial de revisión</SectionLabel>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selected.historial.map((h, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', gap: 10,
                            padding: '9px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-glass)',
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0, width: 6, height: 6,
                              borderRadius: '50%',
                              background: 'var(--accent-blue)',
                              marginTop: 6,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                margin: '0 0 2px',
                                fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
                                color: 'var(--text-secondary)', lineHeight: 1.4,
                              }}
                            >
                              {h.accion}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {h.usuario} · {h.fecha}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Motivo rechazado (readonly when already rejected) */}
              {selected.estado === 'Rechazado' && selected.motivo && (
                <>
                  <div style={{ height: 1, background: 'var(--border-glass)' }} />
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,82,82,0.06)',
                      border: '1px solid rgba(255,82,82,0.2)',
                    }}
                  >
                    <SectionLabel>Motivo del rechazo</SectionLabel>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-dm-sans)', fontSize: '0.84rem',
                        color: 'var(--text-secondary)', lineHeight: 1.6,
                      }}
                    >
                      {selected.motivo}
                    </p>
                  </div>
                </>
              )}

              {/* Actions — only for pending */}
              {selected.estado === 'Pendiente' && (
                <>
                  <div style={{ height: 1, background: 'var(--border-glass)' }} />

                  {/* Textarea de motivo — aparece con AnimatePresence */}
                  <AnimatePresence>
                    {rechazando && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label
                            style={{
                              fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                              fontWeight: 700, color: motivoErr ? 'var(--danger)' : 'var(--text-muted)',
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}
                          >
                            Motivo del rechazo *
                          </label>
                          <textarea
                            value={motivo}
                            onChange={(e) => { setMotivo(e.target.value); if (motivoErr) setMotivoErr(''); }}
                            rows={3}
                            placeholder="Explica brevemente por qué se rechaza este recurso…"
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: `1px solid ${motivoErr ? 'var(--danger)' : 'var(--border-glass)'}`,
                              background: 'var(--bg-glass)',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                              resize: 'vertical', outline: 'none',
                            }}
                          />
                          {motivoErr && (
                            <p
                              style={{
                                margin: 0, fontSize: '0.72rem',
                                color: 'var(--danger)',
                                fontFamily: 'var(--font-dm-sans)',
                              }}
                            >
                              {motivoErr}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Approve */}
                    <Button
                      variant="ghost"
                      loading={actionId === selected.id && !rechazando}
                      disabled={actionId !== null}
                      onClick={() => applyAction(selected.id, 'Aprobado')}
                      style={{
                        width: '100%', justifyContent: 'center',
                        border: '1px solid rgba(0,230,118,0.35)',
                        color: 'var(--success)',
                      }}
                    >
                      <Check size={15} />
                      Aprobar y publicar
                    </Button>

                    {/* Reject */}
                    {!rechazando ? (
                      <Button
                        variant="ghost"
                        disabled={actionId !== null}
                        onClick={() => setRechazando(true)}
                        style={{
                          width: '100%', justifyContent: 'center',
                          border: '1px solid rgba(255,82,82,0.3)',
                          color: 'var(--danger)',
                        }}
                      >
                        <X size={15} />
                        Rechazar
                      </Button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          variant="ghost"
                          onClick={() => { setRechazando(false); setMotivo(''); setMotivoErr(''); }}
                          style={{ flex: 1 }}
                          disabled={actionId !== null}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="ghost"
                          loading={actionId === selected.id && rechazando}
                          disabled={actionId !== null}
                          onClick={handleRechazar}
                          style={{
                            flex: 1,
                            border: '1px solid rgba(255,82,82,0.3)',
                            color: 'var(--danger)',
                          }}
                        >
                          <X size={14} />
                          Confirmar rechazo
                        </Button>
                      </div>
                    )}

                    {/* Request correction */}
                    <Button
                      variant="ghost"
                      disabled={actionId !== null}
                      onClick={() => {
                        // "Corrección" no tiene endpoint en el backend; marcamos localmente
                        setRecursos((prev) =>
                          prev.map((r) => r.id === selected.id ? { ...r, estado: 'Corrección' as EstadoRec } : r),
                        );
                        setSelectedId(null);
                      }}
                      style={{
                        width: '100%', justifyContent: 'center',
                        border: '1px solid rgba(255,215,64,0.3)',
                        color: 'var(--warning)',
                      }}
                    >
                      <AlertTriangle size={14} />
                      Solicitar corrección
                    </Button>
                  </div>
                </>
              )}

              {/* Resolved state */}
              {selected.estado !== 'Pendiente' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background:
                      selected.estado === 'Aprobado'
                        ? 'rgba(0,230,118,0.06)'
                        : selected.estado === 'Corrección'
                        ? 'rgba(255,215,64,0.06)'
                        : 'rgba(255,82,82,0.06)',
                    border: `1px solid ${
                      selected.estado === 'Aprobado'
                        ? 'rgba(0,230,118,0.25)'
                        : selected.estado === 'Corrección'
                        ? 'rgba(255,215,64,0.25)'
                        : 'rgba(255,82,82,0.2)'
                    }`,
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
                    color:
                      selected.estado === 'Aprobado'
                        ? 'var(--success)'
                        : selected.estado === 'Corrección'
                        ? 'var(--warning)'
                        : 'var(--danger)',
                  }}
                >
                  {selected.estado === 'Aprobado'
                    ? '✓ Publicado en el repositorio de recursos.'
                    : selected.estado === 'Corrección'
                    ? '⚠ Corrección solicitada al autor del recurso.'
                    : '✗ Recurso rechazado.'}
                </div>
              )}
            </motion.div>
          ) : (
            /* Empty state */
            <motion.div
              key="no-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', minHeight: 380,
                gap: 14, textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <div
                style={{
                  width: 64, height: 64,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={28} style={{ opacity: 0.3 }} />
              </div>
              <p
                style={{
                  margin: 0, fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.875rem', maxWidth: 220, lineHeight: 1.55,
                }}
              >
                Selecciona una sugerencia para ver el detalle y tomar acción
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
          fontWeight: 500, color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--accent-blue)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  fontFamily: 'var(--font-dm-sans)',
};
