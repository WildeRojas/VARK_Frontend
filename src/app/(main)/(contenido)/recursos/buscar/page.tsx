'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Play, FileText, Headphones, Code2,
  ExternalLink, Star, X, Filter, PackageOpen,
} from 'lucide-react';
import Badge  from '@/components/ui/Badge';
import { listarRecursos } from '@/lib/api/contenido';
import type { Recurso as RecursoAPI, TipoFormato, NivelComplejidad } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TipoRecurso = 'video' | 'documento' | 'audio' | 'ejercicio';
type EstiloVark  = 'V' | 'A' | 'R' | 'K';
type Dificultad  = 1 | 2 | 3;

interface Recurso {
  id:          string;
  titulo:      string;
  url:         string;
  urlCorta:    string;
  descripcion: string;
  tema:        string;
  tipo:        TipoRecurso;
  vark:        EstiloVark;
  dificultad:  Dificultad;
  rating:      number;   // 1-5
}

// ─── Mock (12 recursos) ───────────────────────────────────────────────────────
const MOCK: Recurso[] = [
  {
    id: '1',
    titulo: 'Introducción a Python – Variables y Tipos de datos',
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    urlCorta: 'youtube.com',
    descripcion: 'Video tutorial que cubre los fundamentos de variables, tipos de datos y operadores en Python con ejemplos visuales animados.',
    tema: 'Python Básico', tipo: 'video', vark: 'V', dificultad: 1, rating: 5,
  },
  {
    id: '2',
    titulo: 'Guía completa de cadenas en Python',
    url: 'https://docs.python.org/3/library/stdtypes.html',
    urlCorta: 'docs.python.org',
    descripcion: 'Documentación oficial con todos los métodos de cadenas, slicing y formateo disponibles en Python 3.',
    tema: 'Cadenas', tipo: 'documento', vark: 'R', dificultad: 2, rating: 4,
  },
  {
    id: '3',
    titulo: 'Podcast: Estructuras de datos explicadas con analogías',
    url: 'https://podcast.example.com/ep12',
    urlCorta: 'podcast.example.com',
    descripcion: 'Episodio de podcast que explica listas, tuplas y diccionarios usando analogías del mundo real de forma auditiva.',
    tema: 'Estructuras', tipo: 'audio', vark: 'A', dificultad: 1, rating: 4,
  },
  {
    id: '4',
    titulo: 'Ejercicios prácticos: Listas y comprensión de listas',
    url: 'https://exercism.org/tracks/python',
    urlCorta: 'exercism.org',
    descripcion: 'Set de ejercicios progresivos con casos de prueba para dominar la creación y manipulación de listas en Python.',
    tema: 'Estructuras', tipo: 'ejercicio', vark: 'K', dificultad: 2, rating: 5,
  },
  {
    id: '5',
    titulo: 'Funciones en Python – Guía visual con animaciones',
    url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
    urlCorta: 'youtube.com',
    descripcion: 'Video con animaciones que explica scope, parámetros por defecto, *args, **kwargs y retorno de valores.',
    tema: 'Funciones', tipo: 'video', vark: 'V', dificultad: 2, rating: 4,
  },
  {
    id: '6',
    titulo: 'Real Python: Programación orientada a objetos',
    url: 'https://realpython.com/python3-object-oriented-programming/',
    urlCorta: 'realpython.com',
    descripcion: 'Artículo detallado sobre clases, herencia, polimorfismo y encapsulamiento con múltiples ejemplos de código.',
    tema: 'POO', tipo: 'documento', vark: 'R', dificultad: 3, rating: 5,
  },
  {
    id: '7',
    titulo: 'Laboratorio interactivo: Algoritmos de ordenamiento',
    url: 'https://visualgo.net/en/sorting',
    urlCorta: 'visualgo.net',
    descripcion: 'Implementa bubble sort, merge sort y quick sort con visualización paso a paso y validación automática.',
    tema: 'Algoritmos', tipo: 'ejercicio', vark: 'K', dificultad: 3, rating: 5,
  },
  {
    id: '8',
    titulo: 'Audio explicativo: Recursividad paso a paso',
    url: 'https://podcast.example.com/recursion',
    urlCorta: 'podcast.example.com',
    descripcion: 'Explicación auditiva de la recursividad con analogías del mundo real, casos base y ejemplos con factorial y Fibonacci.',
    tema: 'Funciones', tipo: 'audio', vark: 'A', dificultad: 3, rating: 3,
  },
  {
    id: '9',
    titulo: 'Visualgo: Árboles binarios de búsqueda',
    url: 'https://visualgo.net/en/bst',
    urlCorta: 'visualgo.net',
    descripcion: 'Herramienta visual interactiva que anima inserción, eliminación y búsqueda en árboles binarios con control de velocidad.',
    tema: 'Estructuras', tipo: 'video', vark: 'V', dificultad: 3, rating: 4,
  },
  {
    id: '10',
    titulo: 'Automate the Boring Stuff: Manejo de archivos en Python',
    url: 'https://automatetheboringstuff.com/2e/chapter9/',
    urlCorta: 'automatetheboringstuff.com',
    descripcion: 'Capítulo gratuito sobre lectura y escritura de archivos, rutas con pathlib y manejo de CSV y PDF.',
    tema: 'Python Básico', tipo: 'documento', vark: 'R', dificultad: 1, rating: 4,
  },
  {
    id: '11',
    titulo: 'Podcast: Principios SOLID explicados en Python',
    url: 'https://podcast.example.com/solid-python',
    urlCorta: 'podcast.example.com',
    descripcion: 'Serie de 5 episodios que narra cada principio SOLID usando ejemplos de diseño de software real.',
    tema: 'POO', tipo: 'audio', vark: 'A', dificultad: 2, rating: 4,
  },
  {
    id: '12',
    titulo: 'Retos de código: Diccionarios y sets avanzados',
    url: 'https://leetcode.com/tag/hash-table/',
    urlCorta: 'leetcode.com',
    descripcion: 'Colección de problemas prácticos de LeetCode enfocados en el uso eficiente de diccionarios y conjuntos.',
    tema: 'Estructuras', tipo: 'ejercicio', vark: 'K', dificultad: 2, rating: 3,
  },
];

// ─── Config ────────────────────────────────────────────────────────────────────
const VARK_CONFIG: {
  id: EstiloVark;
  label: string;
  full: string;
  color: string;
  bg: string;
  bgActive: string;
  border: string;
  glow: string;
}[] = [
  {
    id: 'V', label: 'V', full: 'Visual',
    color: 'var(--vark-v)', bg: 'rgba(59,110,248,0.06)',
    bgActive: 'rgba(59,110,248,0.18)', border: 'rgba(59,110,248,0.25)',
    glow: '0 0 20px rgba(59,110,248,0.35), 0 0 6px rgba(59,110,248,0.2)',
  },
  {
    id: 'A', label: 'A', full: 'Auditivo',
    color: 'var(--vark-a)', bg: 'rgba(167,139,250,0.06)',
    bgActive: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.25)',
    glow: '0 0 20px rgba(167,139,250,0.35), 0 0 6px rgba(167,139,250,0.2)',
  },
  {
    id: 'R', label: 'R', full: 'Lectura',
    color: 'var(--vark-r)', bg: 'rgba(0,212,255,0.06)',
    bgActive: 'rgba(0,212,255,0.18)', border: 'rgba(0,212,255,0.25)',
    glow: '0 0 20px rgba(0,212,255,0.35), 0 0 6px rgba(0,212,255,0.2)',
  },
  {
    id: 'K', label: 'K', full: 'Kinestésico',
    color: 'var(--vark-k)', bg: 'rgba(0,230,118,0.06)',
    bgActive: 'rgba(0,230,118,0.18)', border: 'rgba(0,230,118,0.25)',
    glow: '0 0 20px rgba(0,230,118,0.35), 0 0 6px rgba(0,230,118,0.2)',
  },
];

const TIPO_CONFIG: { id: TipoRecurso; label: string; icon: React.ReactNode }[] = [
  { id: 'video',     label: 'Video',     icon: <Play      size={13} /> },
  { id: 'documento', label: 'Documento', icon: <FileText  size={13} /> },
  { id: 'audio',     label: 'Audio',     icon: <Headphones size={13} /> },
  { id: 'ejercicio', label: 'Ejercicio', icon: <Code2     size={13} /> },
];

const DIF_CONFIG: { id: Dificultad; label: string; badge: 'success' | 'warning' | 'danger' }[] = [
  { id: 1, label: 'Fácil',  badge: 'success' },
  { id: 2, label: 'Media',  badge: 'warning' },
  { id: 3, label: 'Difícil', badge: 'danger'  },
];

const VARK_BADGE: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};
const VARK_FULL: Record<EstiloVark, string> = {
  V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico',
};
const DIF_LABEL: Record<Dificultad, string> = {
  1: 'Fácil', 2: 'Media', 3: 'Difícil',
};

const TIPO_ICON: Record<TipoRecurso, React.ReactNode> = {
  video:     <Play      size={13} />,
  documento: <FileText  size={13} />,
  audio:     <Headphones size={13} />,
  ejercicio: <Code2     size={13} />,
};

// ─── Highlight helper ─────────────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: 'rgba(255,215,64,0.25)',
              color: 'var(--warning)',
              borderRadius: 3,
              padding: '0 2px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ─── Star rating (readonly) ───────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={11}
          fill={i < rating ? 'var(--warning)' : 'none'}
          color={i < rating ? 'var(--warning)' : 'rgba(255,255,255,0.15)'}
        />
      ))}
    </div>
  );
}

// ─── Resource card ────────────────────────────────────────────────────────────
function RecursoCard({ recurso: r, query }: { recurso: Recurso; query: string }) {
  const isYt = r.url.includes('youtube.com') || r.url.includes('youtu.be');
  const ytId  = isYt ? r.url.split('v=')[1]?.split('&')[0] : null;

  const DIF_COLOR: Record<Dificultad, string> = {
    1: 'var(--success)', 2: 'var(--warning)', 3: 'var(--danger)',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
      whileHover={{ y: -3 }}
      style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Thumbnail / tipo icon */}
      <div
        style={{
          height: 120,
          background: ytId
            ? `url(https://img.youtube.com/vi/${ytId}/mqdefault.jpg) center/cover`
            : 'var(--bg-glass)',
          display: ytId ? undefined : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {!ytId && (
          <div
            style={{
              width: 44, height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            {React.cloneElement(TIPO_ICON[r.tipo] as React.ReactElement, { size: 22 })}
          </div>
        )}
        {/* VARK ribbon */}
        <div
          style={{
            position: 'absolute', top: 10, left: 10,
          }}
        >
          <Badge variant={VARK_BADGE[r.vark]} size="sm">
            {r.vark}
          </Badge>
        </div>
        {/* Dificultad dot */}
        <div
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 8, height: 8, borderRadius: '50%',
            background: DIF_COLOR[r.dificultad],
            boxShadow: `0 0 6px ${DIF_COLOR[r.dificultad]}`,
          }}
          title={DIF_LABEL[r.dificultad]}
        />
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Title */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700, fontSize: '0.87rem',
            color: 'var(--text-primary)', lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <HighlightText text={r.titulo} query={query} />
        </p>

        {/* Description */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
            color: 'var(--text-muted)', lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <HighlightText text={r.descripcion} query={query} />
        </p>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 6,
            borderTop: '1px solid var(--border-glass)',
            paddingTop: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {/* Tipo */}
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
                fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {TIPO_ICON[r.tipo]}
              {r.tipo}
            </span>
            {/* Dificultad */}
            <Badge
              variant={DIF_CONFIG.find((d) => d.id === r.dificultad)!.badge}
              size="sm"
            >
              {DIF_LABEL[r.dificultad]}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Stars rating={r.rating} />
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center',
                color: 'var(--accent-blue)', opacity: 0.7,
                textDecoration: 'none',
              }}
              title="Abrir recurso"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Toggle button ─────────────────────────────────────────────────────────────
function ToggleBtn({
  active, onClick, children, style,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px',
        borderRadius: 999,
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-glass)',
        cursor: 'pointer',
        fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontWeight: 600,
        color: 'var(--text-muted)',
        transition: 'all 0.18s',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
import React from 'react';

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
};

// ─── API ↔ UI mapping ─────────────────────────────────────────────────────────
const TIPO_API_TO_UI: Record<TipoFormato, TipoRecurso> = {
  video: 'video', articulo: 'documento', documento: 'documento', ejercicio: 'ejercicio',
};
const NIVEL_API_TO_DIF: Record<NivelComplejidad, Dificultad> = {
  basico: 1, intermedio: 2, avanzado: 3,
};

function mapRecursoAPI(r: RecursoAPI): Recurso {
  return {
    id: String(r.id),
    titulo: r.titulo,
    url: r.url,
    urlCorta: r.url.replace(/^https?:\/\//, '').split('/')[0],
    descripcion: r.descripcion ?? '',
    tema: r.tema_nombre,
    tipo: TIPO_API_TO_UI[r.tipo_formato] ?? 'documento',
    vark: r.categoria_vark,
    dificultad: NIVEL_API_TO_DIF[r.nivel_complejidad] ?? 1,
    rating: 0,
  };
}

export default function BuscarPage() {
  const [query,      setQuery]      = useState('');
  const [varkActive, setVarkActive] = useState<Set<EstiloVark>>(new Set());
  const [difActive,  setDifActive]  = useState<Set<Dificultad>>(new Set());
  const [tipoActive, setTipoActive] = useState<Set<TipoRecurso>>(new Set());
  const [recursos,   setRecursos]   = useState<Recurso[]>(MOCK);

  // Carga inicial de recursos reales (CU-11)
  useEffect(() => {
    let mounted = true;
    listarRecursos()
      .then((data) => { if (mounted && data.length) setRecursos(data.map(mapRecursoAPI)); })
      .catch(() => { /* se mantienen datos de respaldo */ });
    return () => { mounted = false; };
  }, []);

  // Toggles
  const toggleVark = (v: EstiloVark) => setVarkActive((prev) => {
    const next = new Set(prev);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  });
  const toggleDif  = (d: Dificultad) => setDifActive((prev) => {
    const next = new Set(prev);
    next.has(d) ? next.delete(d) : next.add(d);
    return next;
  });
  const toggleTipo = (t: TipoRecurso) => setTipoActive((prev) => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  const clearAll = () => {
    setQuery('');
    setVarkActive(new Set());
    setDifActive(new Set());
    setTipoActive(new Set());
  };

  // Active filter chips
  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...[...varkActive].map((v) => ({
      key: `vark-${v}`,
      label: `${v} — ${VARK_FULL[v]}`,
      remove: () => toggleVark(v),
    })),
    ...[...difActive].map((d) => ({
      key: `dif-${d}`,
      label: DIF_LABEL[d],
      remove: () => toggleDif(d),
    })),
    ...[...tipoActive].map((t) => ({
      key: `tipo-${t}`,
      label: t.charAt(0).toUpperCase() + t.slice(1),
      remove: () => toggleTipo(t),
    })),
  ];

  const hasFilters = query.trim() || varkActive.size || difActive.size || tipoActive.size;

  // Filtered results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recursos.filter((r) => {
      if (q && !r.titulo.toLowerCase().includes(q) && !r.descripcion.toLowerCase().includes(q)) return false;
      if (varkActive.size && !varkActive.has(r.vark))  return false;
      if (difActive.size  && !difActive.has(r.dificultad)) return false;
      if (tipoActive.size && !tipoActive.has(r.tipo))  return false;
      return true;
    });
  }, [query, varkActive, difActive, tipoActive, recursos]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100%',
        background: 'transparent',
        padding: '32px 36px 48px',
      }}
    >
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: 28 }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 800, fontSize: '1.75rem',
            color: 'var(--text-primary)', margin: 0, lineHeight: 1.2,
          }}
        >
          Explorar{' '}
          <span style={{ color: 'var(--accent-blue)' }}>recursos</span>
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}
        >
          Encuentra materiales adaptados a tu estilo de aprendizaje
        </p>
      </motion.div>

      {/* ── Search bar ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        style={{ position: 'relative', marginBottom: 28 }}
      >
        <Search
          size={20}
          style={{
            position: 'absolute', left: 20, top: '50%',
            transform: 'translateY(-50%)',
            color: query ? 'var(--accent-blue)' : 'var(--text-muted)',
            transition: 'color 0.18s', pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Buscar por título, tema o descripción…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            height: 58,
            paddingLeft: 54, paddingRight: query ? 48 : 20,
            borderRadius: 'var(--radius-lg)',
            border: `1.5px solid ${query ? 'rgba(59,110,248,0.45)' : 'var(--border-glass)'}`,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-dm-sans)', fontSize: '1rem', fontWeight: 500,
            outline: 'none',
            boxShadow: query ? '0 0 0 3px rgba(59,110,248,0.1)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        )}
      </motion.div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          display: 'flex', flexDirection: 'column', gap: 16,
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glass)',
          background: 'var(--bg-card)',
          marginBottom: 24,
        }}
      >
        {/* VARK row — visually most prominent */}
        <div>
          <p style={filterLabelStyle}>
            <Filter size={12} />
            Estilo VARK
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {VARK_CONFIG.map((v) => {
              const active = varkActive.has(v.id);
              return (
                <motion.button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVark(v.id)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                    width: 82, height: 72,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${active ? v.color : v.border}`,
                    background: active ? v.bgActive : v.bg,
                    cursor: 'pointer',
                    boxShadow: active ? v.glow : 'none',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                >
                  {/* Letter */}
                  <span
                    style={{
                      fontFamily: 'var(--font-syne), Syne, sans-serif',
                      fontSize: '1.35rem', fontWeight: 800,
                      color: active ? v.color : 'rgba(255,255,255,0.35)',
                      lineHeight: 1,
                      transition: 'color 0.18s',
                    }}
                  >
                    {v.label}
                  </span>
                  {/* Full name */}
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem',
                      fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: active ? v.color : 'rgba(255,255,255,0.25)',
                      transition: 'color 0.18s',
                    }}
                  >
                    {v.full}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dificultad + Tipo row */}
        <div
          style={{
            display: 'flex', gap: 28, flexWrap: 'wrap',
            borderTop: '1px solid var(--border-glass)', paddingTop: 16,
          }}
        >
          {/* Dificultad */}
          <div>
            <p style={filterLabelStyle}>Dificultad</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIF_CONFIG.map(({ id, label, badge }) => {
                const active = difActive.has(id);
                const colors = {
                  success: { c: 'var(--success)', b: 'rgba(0,230,118,0.3)', bg: 'rgba(0,230,118,0.15)' },
                  warning: { c: 'var(--warning)', b: 'rgba(255,215,64,0.3)', bg: 'rgba(255,215,64,0.15)' },
                  danger:  { c: 'var(--danger)',  b: 'rgba(255,82,82,0.3)',  bg: 'rgba(255,82,82,0.15)' },
                }[badge];
                return (
                  <ToggleBtn
                    key={id}
                    active={active}
                    onClick={() => toggleDif(id)}
                    style={active ? {
                      background: colors.bg,
                      border: `1px solid ${colors.b}`,
                      color: colors.c,
                    } : {}}
                  >
                    {label}
                  </ToggleBtn>
                );
              })}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <p style={filterLabelStyle}>Tipo de recurso</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIPO_CONFIG.map(({ id, label, icon }) => {
                const active = tipoActive.has(id);
                return (
                  <ToggleBtn
                    key={id}
                    active={active}
                    onClick={() => toggleTipo(id)}
                    style={active ? {
                      background: 'rgba(59,110,248,0.14)',
                      border: '1px solid rgba(59,110,248,0.4)',
                      color: 'var(--accent-blue)',
                    } : {}}
                  >
                    {icon}
                    {label}
                  </ToggleBtn>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Active filter chips ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center',
                gap: 8, flexWrap: 'wrap', paddingBottom: 2,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                  fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                Filtros activos:
              </span>
              {activeChips.map((chip) => (
                <motion.button
                  key={chip.key}
                  type="button"
                  onClick={chip.remove}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(59,110,248,0.35)',
                    background: 'rgba(59,110,248,0.1)',
                    color: 'var(--accent-blue)',
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {chip.label}
                  <X size={10} />
                </motion.button>
              ))}
              {/* Clear all */}
              <button
                type="button"
                onClick={clearAll}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', marginLeft: 4,
                  borderRadius: 999,
                  border: '1px solid var(--border-glass)',
                  background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                  fontWeight: 600, color: 'var(--text-muted)',
                }}
              >
                <X size={10} />
                Limpiar todo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Counter ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
            color: 'var(--text-muted)', fontWeight: 500,
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {results.length}
          </span>
          {' '}recurso{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          {hasFilters ? ' con los filtros aplicados' : ''}
        </p>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      {results.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          <AnimatePresence mode="popLayout">
            {results.map((r) => (
              <RecursoCard key={r.id} recurso={r} query={query.trim()} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty state */
        <AnimatePresence>
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, padding: '80px 32px',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-glass)',
              background: 'rgba(255,255,255,0.01)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64, height: 64,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.2)',
              }}
            >
              <PackageOpen size={28} />
            </div>
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                  fontWeight: 700, fontSize: '1rem',
                  color: 'var(--text-primary)',
                }}
              >
                No encontramos recursos con esos filtros
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.84rem',
                  color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.6,
                }}
              >
                Prueba quitando algún filtro o cambiando los términos de búsqueda.
              </p>
            </div>
            <button
              type="button"
              onClick={clearAll}
              style={{
                marginTop: 4,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px',
                borderRadius: 999,
                border: '1px solid rgba(59,110,248,0.35)',
                background: 'rgba(59,110,248,0.1)',
                color: 'var(--accent-blue)',
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              <X size={13} />
              Limpiar filtros
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────────
const filterLabelStyle: React.CSSProperties = {
  margin: '0 0 10px',
  display: 'flex', alignItems: 'center', gap: 5,
  fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
  fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.09em',
};
