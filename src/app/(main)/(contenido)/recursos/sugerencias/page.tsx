'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Check, X, Edit2, ExternalLink,
  Brain, CalendarDays, Inbox, ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge  from '@/components/ui/Badge';
import Modal  from '@/components/ui/Modal';
import {
  listarTemas,
  listarSugerencias,
  sugerirRecursosIA,
  aprobarSugerencia,
  rechazarSugerencia,
} from '@/lib/api/contenido';
import type { TemaSimple, SugerenciaIA } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type EstiloVark = 'V' | 'A' | 'R' | 'K';
type EstadoSug  = 'Pendiente' | 'Aprobado' | 'Rechazado';

interface Sugerencia {
  id:          string;
  titulo:      string;
  url:         string;
  urlCorta:    string;
  descripcion: string;
  vark:        EstiloVark;
  dificultad:  1 | 2 | 3;
  razon:       string;
  estado:      EstadoSug;
  fecha:       string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SUGERENCIAS: Sugerencia[] = [
  {
    id: '1',
    titulo: 'Python para principiantes – Curso completo en video',
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    urlCorta: 'youtube.com/watch?v=kqtD5…',
    descripcion:
      'Curso introductorio de Python con más de 4 horas de contenido audiovisual. Cubre variables, tipos de datos, estructuras de control y funciones con ejemplos prácticos y ejercicios resueltos.',
    vark: 'V',
    dificultad: 1,
    razon:
      'El estudiante obtuvo puntuación alta en el estilo Visual (V=82%). Se recomienda este recurso porque combina explicaciones con demostraciones visuales en pantalla y animaciones que refuerzan conceptos abstractos.',
    estado: 'Pendiente',
    fecha: '10 may 2026',
  },
  {
    id: '2',
    titulo: 'Podcast: Fundamentos de algoritmos – CS50 Audio',
    url: 'https://podcast.example.com/cs50-algorithms',
    urlCorta: 'podcast.example.com/cs50…',
    descripcion:
      'Serie de episodios de audio basados en el curso CS50 de Harvard, que explica recursividad, búsqueda binaria y ordenamiento de forma auditiva con ejemplos narrados.',
    vark: 'A',
    dificultad: 2,
    razon:
      'El perfil VARK muestra alta afinidad auditiva (A=74%). Los recursos en formato podcast permiten al estudiante absorber conceptos mientras realiza otras actividades, maximizando su modalidad preferida.',
    estado: 'Pendiente',
    fecha: '10 may 2026',
  },
  {
    id: '3',
    titulo: 'Real Python – Guía de comprensión de listas',
    url: 'https://realpython.com/list-comprehension-python/',
    urlCorta: 'realpython.com/list-compre…',
    descripcion:
      'Artículo técnico detallado que explica la comprensión de listas en Python con múltiples ejemplos de código, tablas comparativas y referencias a la documentación oficial.',
    vark: 'R',
    dificultad: 2,
    razon:
      'Puntuación de lectura/escritura elevada (R=78%). Este recurso favorece el aprendizaje mediante texto estructurado y referencias concretas, ideal para estudiantes que prefieren leer y anotar.',
    estado: 'Pendiente',
    fecha: '09 may 2026',
  },
  {
    id: '4',
    titulo: 'Exercism – Track de Python: ejercicios prácticos',
    url: 'https://exercism.org/tracks/python',
    urlCorta: 'exercism.org/tracks/python',
    descripcion:
      'Plataforma de ejercicios progresivos con retroalimentación de mentores. Incluye más de 130 ejercicios que van desde "Hello World" hasta algoritmos complejos, con casos de prueba automatizados.',
    vark: 'K',
    dificultad: 2,
    razon:
      'Perfil Kinestésico dominante (K=88%). La práctica hands-on con retroalimentación inmediata es el mecanismo de aprendizaje más efectivo para este estudiante.',
    estado: 'Aprobado',
    fecha: '08 may 2026',
  },
  {
    id: '5',
    titulo: 'Visualgo – Visualización de estructuras de datos',
    url: 'https://visualgo.net/en',
    urlCorta: 'visualgo.net/en',
    descripcion:
      'Herramienta interactiva que anima visualmente algoritmos de ordenamiento, árboles, grafos y más. Permite controlar la velocidad y paso a paso de cada operación.',
    vark: 'V',
    dificultad: 3,
    razon:
      'Dado el estilo Visual alto y dificultad objetivo avanzada, esta herramienta permite construir intuición sobre estructuras de datos complejas mediante representaciones gráficas animadas.',
    estado: 'Rechazado',
    fecha: '07 may 2026',
  },
  {
    id: '6',
    titulo: 'Automate the Boring Stuff – Capítulo sobre archivos',
    url: 'https://automatetheboringstuff.com/2e/chapter9/',
    urlCorta: 'automatetheboringstuff.com…',
    descripcion:
      'Capítulo gratuito del libro que cubre lectura/escritura de archivos, rutas, manejo de CSV y PDF en Python. Orientado a aplicaciones prácticas del mundo real.',
    vark: 'R',
    dificultad: 1,
    razon:
      'El historial de interacciones muestra preferencia por recursos textuales. Este capítulo conecta directamente con el módulo de archivos pendiente en el plan de estudio del estudiante.',
    estado: 'Pendiente',
    fecha: '10 may 2026',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const VARK_BADGE: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};
const VARK_LABEL: Record<EstiloVark, string> = {
  V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico',
};
const ESTADO_BADGE: Record<EstadoSug, 'warning' | 'success' | 'danger'> = {
  Pendiente: 'warning', Aprobado: 'success', Rechazado: 'danger',
};

const DIFICULTAD_LABEL: Record<1 | 2 | 3, string> = {
  1: '★ Básico', 2: '★★ Intermedio', 3: '★★★ Avanzado',
};

const ESTADO_OPTS: Array<{ value: string; label: string }> = [
  { value: '',          label: 'Todos'     },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Aprobado',  label: 'Aprobado'  },
  { value: 'Rechazado', label: 'Rechazado' },
];

// ─── Animation variants ────────────────────────────────────────────────────────
const listItemVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

const detailVariants = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// ─── Helpers API → UI ────────────────────────────────────────────────────────
const NIVEL_TO_DIF: Record<string, 1 | 2 | 3> = {
  basico: 1, intermedio: 2, avanzado: 3,
};

function toSugerencia(s: SugerenciaIA): Sugerencia {
  const nivelLower = s.nivel_complejidad.toLowerCase();
  return {
    id:          String(s.id),
    titulo:      s.titulo,
    url:         s.url,
    urlCorta:    s.url.replace(/^https?:\/\//, '').slice(0, 30) + (s.url.length > 36 ? '…' : ''),
    descripcion: s.descripcion,
    vark:        s.categoria_vark,
    dificultad:  NIVEL_TO_DIF[nivelLower] ?? 1,
    razon:       s.justificacion_pedagogica,
    estado:      s.estado === 'pendiente' ? 'Pendiente'
                 : s.estado === 'aprobado' ? 'Aprobado'
                 : 'Rechazado',
    fecha:       new Date(s.fecha_sugerencia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SugerenciasPage() {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [filtroEst,   setFiltroEst]   = useState('');
  const [solicitando, setSolicitando] = useState(false);
  const [actionId,    setActionId]    = useState<string | null>(null); // id en proceso
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  // Solicitar modal state (CU-09)
  const [modalOpen,   setModalOpen]   = useState(false);
  const [temas,       setTemas]       = useState<TemaSimple[]>([]);
  const [formTemaId,  setFormTemaId]  = useState<number | ''>('');
  const [formVark,    setFormVark]    = useState<'V' | 'A' | 'R' | 'K'>('V');
  const [formNivel,   setFormNivel]   = useState<'basico' | 'intermedio' | 'avanzado'>('basico');
  const [formCantidad,setFormCantidad]= useState(8);

  const pendientes = useMemo(
    () => sugerencias.filter((s) => s.estado === 'Pendiente').length,
    [sugerencias],
  );

  const filtered = useMemo(
    () => sugerencias.filter((s) => !filtroEst || s.estado === filtroEst),
    [sugerencias, filtroEst],
  );

  const selected = useMemo(
    () => sugerencias.find((s) => s.id === selectedId) ?? null,
    [sugerencias, selectedId],
  );

  // ── Cargar datos al montar ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    Promise.all([
      listarSugerencias(),
      listarTemas(),
    ])
      .then(([sug, temasData]) => {
        if (!mounted) return;
        setSugerencias(sug.map(toSugerencia));
        setTemas(temasData);
        if (temasData.length > 0) setFormTemaId(temasData[0].id);
      })
      .catch((err: Error) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  // CU-09: Abrir modal de solicitud
  const handleSolicitar = () => setModalOpen(true);

  // CU-09: Enviar solicitud a la IA
  const handleModalSubmit = async () => {
    if (formTemaId === '') return;
    setSolicitando(true);
    try {
      const nuevas = await sugerirRecursosIA({
        tema_id: formTemaId as number,
        categoria_vark: formVark,
        nivel_complejidad: formNivel,
        cantidad: formCantidad,
      });
      setSugerencias((prev) => [...nuevas.map(toSugerencia), ...prev]);
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al solicitar sugerencias');
    } finally {
      setSolicitando(false);
    }
  };

  // CU-10: Aprobar / Rechazar sugerencia
  const changeEstado = async (id: string, nuevoEstado: EstadoSug) => {
    setActionId(id);
    try {
      const pk = Number(id);
      if (nuevoEstado === 'Aprobado') {
        await aprobarSugerencia(pk);
      } else if (nuevoEstado === 'Rechazado') {
        await rechazarSugerencia(pk);
      }
      setSugerencias((prev) =>
        prev.map((s) => s.id === id ? { ...s, estado: nuevoEstado } : s),
      );
      if (selectedId === id) setSelectedId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar sugerencia');
    } finally {
      setActionId(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>
        Cargando sugerencias…
      </div>
    );
  }

  return (
    <>
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--topbar-height, 70px))',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL — 60%
      ════════════════════════════════════════════════════════════════════════ */}
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
        <div
          style={{
            padding: '28px 28px 0',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1
                style={{
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                  fontWeight: 800, fontSize: '1.45rem',
                  color: 'var(--text-primary)', margin: 0,
                }}
              >
                Sugerencias de IA
              </h1>
              {pendientes > 0 && (
                <Badge variant="warning">{pendientes} pendientes</Badge>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleSolicitar}
              loading={solicitando}
              disabled={solicitando}
            >
              <Sparkles size={15} />
              {solicitando ? 'Generando…' : 'Solicitar nuevas sugerencias'}
            </Button>
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: 'flex', gap: 4,
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: 0,
            }}
          >
            {ESTADO_OPTS.map((opt) => {
              const active = filtroEst === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFiltroEst(opt.value)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.82rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                    borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    transition: 'color 0.18s, border-color 0.18s',
                    marginBottom: -1,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 28px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                key="empty-list"
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
                    background: 'rgba(59,110,248,0.07)',
                    border: '1px solid rgba(59,110,248,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(59,110,248,0.45)',
                  }}
                >
                  <Inbox size={26} />
                </div>
                <p
                  style={{
                    margin: 0, fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.85rem', color: 'var(--text-muted)',
                  }}
                >
                  No hay sugerencias en este estado.
                </p>
              </motion.div>
            ) : (
              filtered.map((s) => (
                <SuggestionCard
                  key={s.id}
                  sugerencia={s}
                  selected={selectedId === s.id}
                  acting={actionId === s.id}
                  onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — 40%  (sticky)
      ════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '40%',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100%',
          overflowY: 'auto',
          padding: '28px 28px 36px',
        }}
      >
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              variants={detailVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Title */}
              <div>
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--accent-blue)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  Detalle del recurso
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    fontWeight: 800, fontSize: '1.15rem',
                    color: 'var(--text-primary)',
                    margin: '0 0 12px', lineHeight: 1.35,
                  }}
                >
                  {selected.titulo}
                </h2>

                {/* URL */}
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
                    color: 'var(--accent-blue)',
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                  }}
                >
                  <ExternalLink size={12} style={{ flexShrink: 0 }} />
                  {selected.url}
                </a>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge variant={VARK_BADGE[selected.vark]}>
                  {selected.vark} — {VARK_LABEL[selected.vark]}
                </Badge>
                <Badge variant="ghost">
                  {DIFICULTAD_LABEL[selected.dificultad]}
                </Badge>
                <Badge variant={ESTADO_BADGE[selected.estado]}>
                  {selected.estado}
                </Badge>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border-glass)' }} />

              {/* Description */}
              <div>
                <SectionLabel>Descripción generada por IA</SectionLabel>
                <p style={bodyText}>{selected.descripcion}</p>
              </div>

              {/* Razon */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59,110,248,0.06)',
                  border: '1px solid rgba(59,110,248,0.18)',
                }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    marginBottom: 8,
                  }}
                >
                  <Brain size={14} color="var(--accent-blue)" />
                  <SectionLabel>Razón de la sugerencia</SectionLabel>
                </div>
                <p style={{ ...bodyText, margin: 0 }}>{selected.razon}</p>
              </div>

              {/* Fecha */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <CalendarDays size={13} color="var(--text-muted)" />
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Sugerido el {selected.fecha}
                </span>
              </div>

              {/* Actions — solo si está pendiente */}
              {selected.estado === 'Pendiente' && (
                <div
                  style={{
                    display: 'flex', gap: 10,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border-glass)',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => changeEstado(selected.id, 'Aprobado')}
                    loading={actionId === selected.id}
                    style={{
                      flex: 1,
                      border: '1px solid rgba(0,230,118,0.35)',
                      color: 'var(--success)',
                    }}
                  >
                    <Check size={15} />
                    Aprobar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => changeEstado(selected.id, 'Rechazado')}
                    disabled={actionId !== null}
                    style={{
                      flex: 1,
                      border: '1px solid rgba(255,82,82,0.3)',
                      color: 'var(--danger)',
                    }}
                  >
                    <X size={15} />
                    Rechazar
                  </Button>
                  <Button
                    variant="outline"
                    disabled={actionId !== null}
                    style={{ flex: 1 }}
                  >
                    <Edit2 size={14} />
                    Editar y aprobar
                  </Button>
                </div>
              )}

              {/* Already resolved note */}
              {selected.estado !== 'Pendiente' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background:
                      selected.estado === 'Aprobado'
                        ? 'rgba(0,230,118,0.06)'
                        : 'rgba(255,82,82,0.06)',
                    border: `1px solid ${selected.estado === 'Aprobado' ? 'rgba(0,230,118,0.25)' : 'rgba(255,82,82,0.2)'}`,
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.8rem',
                    color: selected.estado === 'Aprobado' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {selected.estado === 'Aprobado'
                    ? '✓ Este recurso fue aprobado y está disponible en el repositorio.'
                    : '✗ Este recurso fue rechazado.'}
                </div>
              )}
            </motion.div>
          ) : (
            /* Empty detail panel */
            <motion.div
              key="no-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', minHeight: 360,
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
                  fontSize: '0.875rem', maxWidth: 220,
                  lineHeight: 1.55,
                }}
              >
                Selecciona una sugerencia para ver el detalle
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* ── CU-09: Modal para solicitar nuevas sugerencias ─────────────────── */}
    <Modal open={modalOpen} onClose={() => !solicitando && setModalOpen(false)} title="Solicitar sugerencias a la IA">
      {error && (
        <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem', color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Tema
          </label>
          <select
            value={formTemaId}
            onChange={(e) => setFormTemaId(Number(e.target.value))}
            style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem', padding: '8px 10px' }}
          >
            {temas.map((t) => (
              <option key={t.id} value={t.id} style={{ background: '#0a1535' }}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Estilo VARK
          </label>
          <select
            value={formVark}
            onChange={(e) => setFormVark(e.target.value as 'V' | 'A' | 'R' | 'K')}
            style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem', padding: '8px 10px' }}
          >
            <option value="V" style={{ background: '#0a1535' }}>V — Visual</option>
            <option value="A" style={{ background: '#0a1535' }}>A — Auditivo</option>
            <option value="R" style={{ background: '#0a1535' }}>R — Lectura</option>
            <option value="K" style={{ background: '#0a1535' }}>K — Kinestésico</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Nivel
          </label>
          <select
            value={formNivel}
            onChange={(e) => setFormNivel(e.target.value as 'basico' | 'intermedio' | 'avanzado')}
            style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem', padding: '8px 10px' }}
          >
            <option value="basico" style={{ background: '#0a1535' }}>Básico</option>
            <option value="intermedio" style={{ background: '#0a1535' }}>Intermedio</option>
            <option value="avanzado" style={{ background: '#0a1535' }}>Avanzado</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Cantidad (5–10)
          </label>
          <input
            type="number"
            min={5} max={10}
            value={formCantidad}
            onChange={(e) => setFormCantidad(Math.min(10, Math.max(5, Number(e.target.value))))}
            style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem', padding: '8px 10px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={solicitando} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleModalSubmit} loading={solicitando} disabled={solicitando || formTemaId === ''} style={{ flex: 1 }}>
            <Sparkles size={14} />
            {solicitando ? 'Generando…' : 'Generar'}
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionCard({
  sugerencia: s,
  selected,
  acting,
  onClick,
}: {
  sugerencia: Sugerencia;
  selected:   boolean;
  acting:     boolean;
  onClick:    () => void;
}) {
  return (
    <motion.div
      layout
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
      whileHover={{ x: 3 }}
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
        background: selected
          ? 'rgba(59,110,248,0.07)'
          : 'var(--bg-glass)',
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 1px rgba(59,110,248,0.25), 0 4px 16px rgba(59,110,248,0.1)'
          : 'none',
        transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
        opacity: acting ? 0.5 : 1,
      }}
    >
      {/* Row 1: title */}
      <p
        style={{
          margin: '0 0 6px',
          fontFamily: 'var(--font-syne), Syne, sans-serif',
          fontWeight: 700, fontSize: '0.88rem',
          color: 'var(--text-primary)',
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {s.titulo}
      </p>

      {/* Row 2: URL short */}
      <p
        style={{
          margin: '0 0 10px',
          fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
          color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {s.urlCorta}
      </p>

      {/* Row 3: badges + date */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge variant={VARK_BADGE[s.vark]} size="sm">
            {s.vark} — {VARK_LABEL[s.vark]}
          </Badge>
          <Badge variant={ESTADO_BADGE[s.estado]} size="sm">
            {s.estado}
          </Badge>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
            color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}
        >
          {s.fecha}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 6px',
        fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {children}
    </p>
  );
}

const bodyText: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.86rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.65,
};
