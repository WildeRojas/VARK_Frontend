'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, FileText, Headphones, Code2,
  ExternalLink, Bookmark, BookmarkCheck,
  ChevronRight, ChevronLeft, Brain,
  Star, Sparkles, X, HelpCircle, CheckCircle, Users,
  MessageSquare, Send, Check,
} from 'lucide-react';
import Badge    from '@/components/ui/Badge';
import Button   from '@/components/ui/Button';
import Modal    from '@/components/ui/Modal';
import RadarChart from '@/components/ui/RadarChart';
import {
  misRecomendaciones, marcarRecomendacionVista,
  valorarRecurso, registrarEventoClickstream,
} from '@/lib/api/recomendacion';
import { perfilVARK as fetchPerfilVARK } from '@/lib/api/accounts';
import type { Recomendacion as RecomendacionAPI } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type EstiloVark  = 'V' | 'A' | 'R' | 'K';
type TipoRecurso = 'video' | 'documento' | 'audio' | 'ejercicio';

interface Recurso {
  id:         string;
  titulo:     string;
  url:        string;
  urlCorta:   string;
  descripcion: string;
  tema:       string;
  tipo:       TipoRecurso;
  vark:       EstiloVark;
  dificultad: 1 | 2 | 3;
  rating:     number;
  afinidad:   number; // 0-100
  razon:      string;
  recursoId?:       number; // id real del recurso (CU-14/CU-15)
  recomendacionId?: number; // id de la recomendación (CU-13 marcar vista)
}

// ─── Helpers API → UI ─────────────────────────────────────────────────────────
const TIPO_MAP: Record<string, TipoRecurso> = {
  video:    'video',
  articulo: 'documento',
  audio:    'audio',
  ejercicio:'ejercicio',
};
const NIVEL_TO_DIF: Record<string, 1 | 2 | 3> = {
  basico: 1, intermedio: 2, avanzado: 3,
};

function toRecurso(r: RecomendacionAPI): Recurso {
  return {
    id:          String(r.id),
    titulo:      r.recurso_titulo,
    url:         r.recurso_url,
    urlCorta:    r.recurso_url.replace(/^https?:\/\//, '').split('/')[0],
    descripcion: r.justificacion,
    tema:        r.tema_nombre,
    tipo:        TIPO_MAP[r.recurso_tipo] ?? 'documento',
    vark:        r.recurso_categoria_vark,
    dificultad:  NIVEL_TO_DIF[r.recurso_nivel] ?? 1,
    rating:      Math.round(r.puntuacion * 5),
    afinidad:    Math.round(r.puntuacion * 100),
    razon:       r.justificacion,
    recursoId:       r.recurso,
    recomendacionId: r.id,
  };
}

// ─── Mock: perfil del estudiante ─────────────────────────────────────────────
const PERFIL_VARK = { v: 82, a: 45, r: 60, k: 38 };
const ESTILO_DOMINANTE: EstiloVark = 'V';

// ─── Mock: recursos (12) ──────────────────────────────────────────────────────
const MOCK_RECURSOS: Recurso[] = [
  {
    id: '1',
    titulo: 'Introducción a Python – Variables y Tipos visualizados',
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    urlCorta: 'youtube.com',
    descripcion: 'Video tutorial con animaciones que explica variables, tipos de datos y operadores en Python de forma visual e ilustrativa.',
    tema: 'Python Básico', tipo: 'video', vark: 'V', dificultad: 1, rating: 5, afinidad: 95,
    razon: 'Tu perfil muestra una fuerte preferencia Visual (82%). Los recursos en video con animaciones son altamente efectivos para tu estilo de aprendizaje.',
  },
  {
    id: '2',
    titulo: 'Visualgo – Estructuras de datos animadas',
    url: 'https://visualgo.net/en',
    urlCorta: 'visualgo.net',
    descripcion: 'Herramienta interactiva que anima algoritmos de ordenamiento, árboles y grafos con control de velocidad y pasos detallados.',
    tema: 'Algoritmos', tipo: 'video', vark: 'V', dificultad: 3, rating: 5, afinidad: 92,
    razon: 'Recurso altamente visual que permite ver el flujo de los algoritmos paso a paso, alineado con tu preferencia de aprendizaje visual.',
  },
  {
    id: '3',
    titulo: 'Funciones en Python – Guía visual con diagramas',
    url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
    urlCorta: 'youtube.com',
    descripcion: 'Video con diagramas de flujo que explica scope, parámetros, *args, **kwargs y retorno de valores.',
    tema: 'Funciones', tipo: 'video', vark: 'V', dificultad: 2, rating: 4, afinidad: 90,
    razon: 'Los diagramas de flujo y la presentación visual del scope hacen de este recurso una elección ideal para perfiles Visuales.',
  },
  {
    id: '4',
    titulo: 'Guía completa de cadenas en Python – Real Python',
    url: 'https://realpython.com/python-strings/',
    urlCorta: 'realpython.com',
    descripcion: 'Artículo estructurado con tablas, ejemplos de código y referencias cruzadas sobre métodos de cadenas, slicing y formateo.',
    tema: 'Cadenas', tipo: 'documento', vark: 'R', dificultad: 2, rating: 4, afinidad: 68,
    razon: 'Tu segundo estilo más fuerte es Lectura/Escritura (60%). Este artículo detallado se complementa bien con tu perfil mixto V+R.',
  },
  {
    id: '5',
    titulo: 'Programación Orientada a Objetos en Python',
    url: 'https://realpython.com/python3-object-oriented-programming/',
    urlCorta: 'realpython.com',
    descripcion: 'Artículo extenso con diagramas de clases, ejemplos y ejercicios sobre POO: clases, herencia y polimorfismo.',
    tema: 'POO', tipo: 'documento', vark: 'R', dificultad: 3, rating: 5, afinidad: 65,
    razon: 'Combina tu preferencia por Lectura con contenido estructurado y diagramas que también estimulan el estilo Visual.',
  },
  {
    id: '6',
    titulo: 'Podcast: Fundamentos de algoritmos – CS50',
    url: 'https://podcast.example.com/cs50-algorithms',
    urlCorta: 'podcast.example.com',
    descripcion: 'Serie de episodios de audio basados en CS50 de Harvard que narran recursividad, búsqueda binaria y ordenamiento.',
    tema: 'Algoritmos', tipo: 'audio', vark: 'A', dificultad: 2, rating: 4, afinidad: 52,
    razon: 'Aunque tu perfil Auditivo (45%) es secundario, este recurso puede complementar tu aprendizaje cuando estudias con la pantalla apagada.',
  },
  {
    id: '7',
    titulo: 'Exercism – Ejercicios de Python con mentores',
    url: 'https://exercism.org/tracks/python',
    urlCorta: 'exercism.org',
    descripcion: 'Plataforma de ejercicios progresivos con validación automática y retroalimentación de mentores especializados.',
    tema: 'Estructuras', tipo: 'ejercicio', vark: 'K', dificultad: 2, rating: 5, afinidad: 48,
    razon: 'Los ejercicios kinestésicos (38% en tu perfil) pueden reforzar lo que aprendes visualmente a través de la práctica activa.',
  },
  {
    id: '8',
    titulo: 'Python Tutor – Visualiza tu código en ejecución',
    url: 'https://pythontutor.com/',
    urlCorta: 'pythontutor.com',
    descripcion: 'Herramienta online que visualiza paso a paso la ejecución de código Python, mostrando el estado de variables y el call stack.',
    tema: 'Python Básico', tipo: 'video', vark: 'V', dificultad: 1, rating: 5, afinidad: 94,
    razon: 'Recurso 100% visual: permite ver el estado del programa en tiempo real. Ideal para perfiles Visuales como el tuyo.',
  },
  {
    id: '9',
    titulo: 'Automate the Boring Stuff – Capítulo archivos',
    url: 'https://automatetheboringstuff.com/2e/chapter9/',
    urlCorta: 'automatetheboringstuff.com',
    descripcion: 'Capítulo gratuito con ejercicios guiados sobre lectura/escritura de archivos, pathlib, CSV y PDF en Python.',
    tema: 'Python Básico', tipo: 'documento', vark: 'R', dificultad: 1, rating: 4, afinidad: 63,
    razon: 'El estilo Lectura/Escritura complementa tu perfil V+R. Este libro online incluye ejemplos visuales y ejercicios prácticos.',
  },
  {
    id: '10',
    titulo: 'Árboles binarios – CS50 Shorts en video',
    url: 'https://www.youtube.com/watch?v=mFptHjTT3l8',
    urlCorta: 'youtube.com',
    descripcion: 'Video corto de CS50 que explica árboles binarios con animaciones minimalistas y diagramas claros.',
    tema: 'Estructuras', tipo: 'video', vark: 'V', dificultad: 3, rating: 4, afinidad: 88,
    razon: 'Las animaciones de CS50 Shorts son reconocidas por su claridad visual, perfectas para estudiantes con perfil Visual dominante.',
  },
  {
    id: '11',
    titulo: 'Podcast: Recursividad con analogías del mundo real',
    url: 'https://podcast.example.com/recursion',
    urlCorta: 'podcast.example.com',
    descripcion: 'Episodio auditivo que explica la recursividad mediante analogías cotidianas, casos base y ejemplos de factorial y Fibonacci.',
    tema: 'Funciones', tipo: 'audio', vark: 'A', dificultad: 2, rating: 3, afinidad: 44,
    razon: 'El componente auditivo puede ser útil para reforzar conceptos abstractos como la recursividad fuera del entorno visual habitual.',
  },
  {
    id: '12',
    titulo: 'LeetCode – Retos de diccionarios y conjuntos',
    url: 'https://leetcode.com/tag/hash-table/',
    urlCorta: 'leetcode.com',
    descripcion: 'Colección de problemas prácticos enfocados en el uso eficiente de diccionarios y sets con validación inmediata.',
    tema: 'Estructuras', tipo: 'ejercicio', vark: 'K', dificultad: 2, rating: 3, afinidad: 41,
    razon: 'La práctica kinestésica en LeetCode complementa el conocimiento visual adquirido. Útil para consolidar con ejercicios reales.',
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const VARK_CFG = {
  V: { color: 'var(--vark-v)', bg: 'rgba(59,110,248,0.18)',  border: 'rgba(59,110,248,0.5)',  glow: '0 0 18px rgba(59,110,248,0.4)',  full: 'Visual'      },
  A: { color: 'var(--vark-a)', bg: 'rgba(167,139,250,0.18)', border: 'rgba(167,139,250,0.5)', glow: '0 0 18px rgba(167,139,250,0.4)', full: 'Auditivo'    },
  R: { color: 'var(--vark-r)', bg: 'rgba(0,212,255,0.18)',   border: 'rgba(0,212,255,0.5)',   glow: '0 0 18px rgba(0,212,255,0.4)',   full: 'Lectura'     },
  K: { color: 'var(--vark-k)', bg: 'rgba(0,230,118,0.18)',   border: 'rgba(0,230,118,0.5)',   glow: '0 0 18px rgba(0,230,118,0.4)',   full: 'Kinestésico' },
} as const;

const VARK_BADGE: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};

const DIF_LABEL: Record<1 | 2 | 3, string> = { 1: 'Fácil', 2: 'Intermedio', 3: 'Avanzado' };

const TIPO_ICON: Record<TipoRecurso, React.ReactNode> = {
  video:     <Play      size={20} />,
  documento: <FileText  size={20} />,
  audio:     <Headphones size={20} />,
  ejercicio: <Code2     size={20} />,
};

// ─── CU-13 helpers ─────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<TipoRecurso, string> = {
  video: 'Video', documento: 'Documento', audio: 'Audio', ejercicio: 'Ejercicio práctico',
};

function getResourceVarkProfile(rec: Recurso): { v: number; a: number; r: number; k: number } {
  const base: Record<TipoRecurso, { v: number; a: number; r: number; k: number }> = {
    video:     { v: 88, a: 35, r: 42, k: 30 },
    audio:     { v: 28, a: 90, r: 38, k: 32 },
    documento: { v: 45, a: 30, r: 88, k: 35 },
    ejercicio: { v: 38, a: 28, r: 42, k: 90 },
  };
  return base[rec.tipo];
}

function getRazones(rec: Recurso, perfilVark: { v: number; a: number; r: number; k: number }): string[] {
  const varkLower = rec.vark.toLowerCase() as 'v' | 'a' | 'r' | 'k';
  const pctEstilo = perfilVark[varkLower];
  return [
    `Tu estilo ${VARK_CFG[rec.vark].full} (${pctEstilo}%) coincide con el formato ${TIPO_LABEL[rec.tipo]}`,
    `El nivel ${DIF_LABEL[rec.dificultad]} es apropiado para tu progreso actual en ${rec.tema}`,
    `El tema "${rec.tema}" está dentro de tu plan de aprendizaje personalizado`,
  ];
}

function getValoracion(rec: Recurso): number {
  return Math.min(96, Math.round(rec.afinidad * 0.82 + 12));
}

// ─── CU-14 data ─────────────────────────────────────────────────────────────
const FEEDBACK_TAGS = [
  'Muy claro', 'Bien explicado', 'Muy largo',
  'Difícil de entender', 'Excelente calidad',
];
const MAX_COMENTARIO = 300;

type Coincidencia = 'si' | 'mazo' | 'no';
const COINCIDENCIA_CFG: Record<Coincidencia, { label: string; color: string; bg: string; border: string }> = {
  si:   { label: 'Sí',          color: 'var(--success)', bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.4)' },
  mazo: { label: 'Más o menos', color: 'var(--warning)', bg: 'rgba(255,215,64,0.1)', border: 'rgba(255,215,64,0.4)' },
  no:   { label: 'No',          color: 'var(--danger)',  bg: 'rgba(255,82,82,0.1)',  border: 'rgba(255,82,82,0.4)'  },
};

// ─── Stagger variants ─────────────────────────────────────────────────────────
const containerV = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};
const cardV = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
};

// ─── Afinidad bar ─────────────────────────────────────────────────────────────
function AfinidadBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1, height: 5, borderRadius: 99,
          background: 'var(--bg-glass-hover)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          style={{ height: '100%', borderRadius: 99, background: color }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
          fontWeight: 800, color, whiteSpace: 'nowrap', minWidth: 42,
          textAlign: 'right',
        }}
      >
        {pct}% compatible
      </span>
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i} size={11}
          fill={i < rating ? 'var(--warning)' : 'none'}
          color={i < rating ? 'var(--warning)' : 'var(--text-muted)'}
        />
      ))}
    </div>
  );
}

// ─── CU-13: Section label + Justification modal content ──────────────────────
const radarLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
  fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  textAlign: 'center',
};

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        margin: '0 0 12px',
        fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
        fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}
    >
      {label}
    </p>
  );
}

function JustContent({ rec, onClose, perfilVark }: { rec: Recurso; onClose: () => void; perfilVark: { v: number; a: number; r: number; k: number } }) {
  const cfg        = VARK_CFG[rec.vark];
  const recProfile = getResourceVarkProfile(rec);
  const razones    = getRazones(rec, perfilVark);
  const valoracion = getValoracion(rec);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Resource header */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700, fontSize: '0.95rem',
            color: 'var(--text-primary)', lineHeight: 1.3,
          }}
        >
          {rec.titulo}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge variant={VARK_BADGE[rec.vark]}>{rec.vark} — {cfg.full}</Badge>
          <Badge variant="ghost">{DIF_LABEL[rec.dificultad]}</Badge>
          <Badge variant="ghost">{TIPO_LABEL[rec.tipo]}</Badge>
        </div>
      </div>

      {/* Section: Tu perfil vs este recurso */}
      <div>
        <SectionLabel label="Tu perfil vs este recurso" />
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={radarLabelStyle}>Tu perfil</span>
            <RadarChart data={perfilVark} size={160} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={radarLabelStyle}>Este recurso</span>
            <RadarChart data={recProfile} size={160} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <AfinidadBar pct={rec.afinidad} color={cfg.color} />
        </div>
      </div>

      {/* Section: Razones principales */}
      <div>
        <SectionLabel label="Razones principales" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {razones.map((razon, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: i * 0.09 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,230,118,0.05)',
                border: '1px solid rgba(0,230,118,0.15)',
              }}
            >
              <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
                  color: 'var(--text-secondary)', lineHeight: 1.5,
                }}
              >
                {razon}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section: Otros estudiantes similares */}
      <div>
        <SectionLabel label="Otros estudiantes similares" />
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Users size={14} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem',
                color: 'var(--text-secondary)', lineHeight: 1.5,
              }}
            >
              El{' '}
              <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                {valoracion}%
              </span>
              {' '}de estudiantes con tu perfil valoró positivamente este recurso
            </p>
          </div>
          <div>
            <div
              style={{
                height: 8, borderRadius: 99,
                background: 'var(--bg-glass-hover)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${valoracion}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.25 }}
                style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, var(--success), rgba(0,230,118,0.6))',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>0%</span>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--success)' }}>{valoracion}%</span>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <Button
          variant="ghost"
          onClick={onClose}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          Cerrar
        </Button>
        <a
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 2, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            padding: '11px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-blue)',
            color: '#fff',
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.9rem',
            fontWeight: 700, textDecoration: 'none',
          }}
        >
          <ExternalLink size={15} />
          Ver recurso
        </a>
      </div>
    </div>
  );
}

// ─── CU-14: Feedback Panel ──────────────────────────────────────────────────
function FeedbackPanel({ rec, onClose }: { rec: Recurso; onClose: () => void }) {
  const [stars,        setStars]        = useState(0);
  const [hoverStar,    setHoverStar]    = useState(0);
  const [coincidencia, setCoincidencia] = useState<Coincidencia | null>(null);
  const [comentario,   setComentario]   = useState('');
  const [selTags,      setSelTags]      = useState<Set<string>>(new Set());
  const [sending,      setSending]      = useState(false);
  const [enviado,      setEnviado]      = useState(false);

  const toggleTag = (tag: string) => setSelTags((prev) => {
    const next = new Set(prev);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    return next;
  });

  const handleEnviar = async () => {
    if (stars === 0 || sending) return;
    setSending(true);
    // CU-14: Registrar valoración. stars >= 3 => útil; se añaden los tags al comentario.
    const comentarioFinal = [comentario.trim(), Array.from(selTags).join(', ')]
      .filter(Boolean).join(' · ');
    try {
      if (rec.recursoId) {
        await valorarRecurso({
          recurso: rec.recursoId,
          valoracion: stars >= 3 ? 'util' : 'no_util',
          comentario: comentarioFinal,
        });
      }
    } catch {
      /* la UI muestra el agradecimiento aunque falle el guardado */
    }
    setSending(false);
    setEnviado(true);
    setTimeout(onClose, 2200);
  };

  const activeStar = hoverStar || stars;
  const canSend    = stars > 0 && !sending && !enviado;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'flex-end',
        background: 'var(--overlay)',
        backdropFilter: 'blur(6px)',
        paddingLeft: 'var(--sidebar-width, 220px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
        style={{
          width: '100%', maxWidth: 620, margin: '0 auto',
          background: 'var(--bg-card)', backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-glass)', borderBottom: 'none',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          overflow: 'hidden', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ minWidth: 0, paddingRight: 12 }}>
            <h2
              style={{
                margin: '0 0 3px',
                fontFamily: 'var(--font-syne), Syne, sans-serif',
                fontWeight: 700, fontSize: '1.05rem',
                color: 'var(--text-primary)',
              }}
            >
              ¿Qué te pareció este recurso?
            </h2>
            <p
              style={{
                margin: 0, fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: '-webkit-box', WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
              {rec.titulo}
            </p>
          </div>
          <motion.button
            type="button" onClick={onClose}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)', cursor: 'pointer',
              padding: 6, display: 'flex', flexShrink: 0,
            }}
          >
            <X size={15} />
          </motion.button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px' }}>
          <AnimatePresence mode="wait">
            {enviado ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 16,
                  padding: '40px 24px', textAlign: 'center',
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 260, delay: 0.05 }}
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(0,230,118,0.15)',
                    border: '2px solid var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Check size={28} color="var(--success)" />
                </motion.div>
                <div>
                  <p style={{
                    margin: '0 0 6px',
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    fontWeight: 800, fontSize: '1.1rem',
                    color: 'var(--text-primary)',
                  }}>
                    ¡Gracias por tu valoración!
                  </p>
                  <p style={{
                    margin: 0,
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem',
                    color: 'var(--text-muted)', lineHeight: 1.5,
                  }}>
                    Tu feedback ayuda a mejorar las recomendaciones para ti y otros estudiantes
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i} size={22}
                      fill={i < stars ? 'var(--warning)' : 'none'}
                      color={i < stars ? 'var(--warning)' : 'var(--text-muted)'}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Stars */}
                <div>
                  <SectionLabel label="Calificación" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Array.from({ length: 5 }, (_, i) => {
                      const idx      = i + 1;
                      const isActive = idx <= activeStar;
                      return (
                        <motion.button
                          key={idx} type="button"
                          onMouseEnter={() => setHoverStar(idx)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setStars(idx)}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.85 }}
                          animate={stars === idx ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', padding: 2, display: 'flex',
                          }}
                        >
                          <Star
                            size={30}
                            fill={isActive ? 'var(--warning)' : 'none'}
                            color={isActive ? 'var(--warning)' : 'var(--text-muted)'}
                          />
                        </motion.button>
                      );
                    })}
                    <AnimatePresence>
                      {activeStar > 0 && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          style={{
                            fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
                            fontWeight: 700, color: 'var(--warning)', marginLeft: 10,
                          }}
                        >
                          {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][activeStar]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Coincidencia */}
                <div>
                  <SectionLabel label="¿Este recurso coincide con tu estilo de aprendizaje?" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['si', 'mazo', 'no'] as Coincidencia[]).map((c) => {
                      const cfg = COINCIDENCIA_CFG[c];
                      const sel = coincidencia === c;
                      return (
                        <motion.button
                          key={c} type="button"
                          onClick={() => setCoincidencia(sel ? null : c)}
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          style={{
                            flex: 1, padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${sel ? cfg.color : 'var(--border-glass)'}`,
                            background: sel ? cfg.bg : 'var(--bg-glass)',
                            color: sel ? cfg.color : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: 700,
                            fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
                            transition: 'all 0.18s',
                          }}
                        >
                          {cfg.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <SectionLabel label="Feedback rápido" />
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {FEEDBACK_TAGS.map((tag) => {
                      const sel = selTags.has(tag);
                      return (
                        <motion.button
                          key={tag} type="button"
                          onClick={() => toggleTag(tag)}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{
                            padding: '6px 13px', borderRadius: 999,
                            border: `1.5px solid ${sel ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                            background: sel ? 'rgba(59,110,248,0.15)' : 'var(--bg-glass)',
                            color: sel ? 'var(--accent-blue)' : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: 600,
                            fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          {tag}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Comentario */}
                <div>
                  <SectionLabel label="Cuéntanos más (opcional)" />
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value.slice(0, MAX_COMENTARIO))}
                      placeholder="¿Qué fue lo que más te gustó? ¿Algo que mejorarías?"
                      rows={3}
                      style={{
                        width: '100%', resize: 'none', boxSizing: 'border-box',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                        padding: '10px 12px 28px',
                        outline: 'none', lineHeight: 1.5,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute', bottom: 8, right: 10,
                        fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
                        color: comentario.length >= MAX_COMENTARIO * 0.9
                          ? 'var(--warning)' : 'var(--text-muted)',
                      }}
                    >
                      {comentario.length}/{MAX_COMENTARIO}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  variant="primary"
                  onClick={handleEnviar}
                  loading={sending}
                  disabled={!canSend}
                  fullWidth
                  style={{ justifyContent: 'center', fontSize: '0.9rem', marginBottom: 4 }}
                >
                  <Send size={14} />
                  Enviar valoración
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Resource card ─────────────────────────────────────────────────────────────
function RecursoCard({
  recurso: r, saved, onSave, onVer, onHover, onJustificar, onValorar,
}: {
  recurso: Recurso;
  saved:   boolean;
  onSave:  () => void;
  onVer:   () => void;
  onHover: (r: Recurso | null) => void;
  onJustificar: () => void;
  onValorar: () => void;
}) {
  const cfg   = VARK_CFG[r.vark];
  const isYt  = r.url.includes('youtube.com') || r.url.includes('youtu.be');
  const ytId  = isYt ? r.url.split('v=')[1]?.split('&')[0] : null;

  return (
    <motion.div
      layout
      variants={cardV}
      whileHover={{ y: -4, boxShadow: `var(--shadow-card)` }}
      onHoverStart={() => onHover(r)}
      onHoverEnd={() => onHover(null)}
      style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        transition: 'box-shadow 0.22s',
      }}
    >
      {/* Thumbnail / icon area */}
      <div
        style={{
          height: 120, flexShrink: 0, position: 'relative',
          background: ytId
            ? `url(https://img.youtube.com/vi/${ytId}/mqdefault.jpg) center/cover`
            : `linear-gradient(135deg, ${cfg.bg}, rgba(0,0,0,0.2))`,
          display: ytId ? undefined : 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {!ytId && (
          <div style={{ color: cfg.color, opacity: 0.7 }}>
            {TIPO_ICON[r.tipo]}
          </div>
        )}
        {/* VARK badge */}
        <div style={{ position: 'absolute', top: 9, left: 9 }}>
          <Badge variant={VARK_BADGE[r.vark]} size="sm">{r.vark} — {VARK_CFG[r.vark].full}</Badge>
        </div>
        {/* Save button */}
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'absolute', top: 9, right: 9,
            background: saved ? 'rgba(59,110,248,0.25)' : 'rgba(0,0,0,0.45)',
            border: `1px solid ${saved ? 'rgba(59,110,248,0.5)' : 'var(--text-muted)'}`,
            borderRadius: 'var(--radius-sm)',
            color: saved ? 'var(--accent-blue)' : 'rgba(255,255,255,0.7)',
            cursor: 'pointer', padding: 5, display: 'flex',
            backdropFilter: 'blur(4px)',
          }}
          title={saved ? 'Guardado' : 'Guardar'}
        >
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </motion.button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {/* Tema + dificultad */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
              fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}
          >
            {r.tema}
          </span>
          <Stars rating={r.rating} />
        </div>

        {/* Título */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700, fontSize: '0.88rem',
            color: 'var(--text-primary)', lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {r.titulo}
        </p>

        {/* Dificultad */}
        <span
          style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
            fontWeight: 600, color: 'var(--text-muted)',
          }}
        >
          {DIF_LABEL[r.dificultad]}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Afinidad bar */}
        <AfinidadBar pct={r.afinidad} color={cfg.color} />

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-glass)' }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 7 }}>
          <Button
            variant="primary"
            onClick={onVer}
            style={{
              flex: 1, padding: '9px 12px', fontSize: '0.78rem',
              justifyContent: 'center',
            }}
          >
            <ExternalLink size={13} />
            Ver recurso
          </Button>
          <Button
            variant="ghost"
            onClick={onSave}
            style={{
              padding: '9px 12px', fontSize: '0.78rem',
              border: saved ? '1px solid rgba(59,110,248,0.4)' : undefined,
              color: saved ? 'var(--accent-blue)' : undefined,
            }}
          >
            {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </Button>
        </div>

        {/* CU-14: Valorar */}
        <Button
          variant="outline"
          onClick={onValorar}
          style={{
            width: '100%', justifyContent: 'center',
            padding: '7px 12px', fontSize: '0.76rem', gap: 5,
          }}
        >
          <MessageSquare size={12} />
          Valorar este recurso
        </Button>

        {/* CU-13: Por qué se recomienda */}
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); onJustificar(); }}
          whileHover={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '5px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem', fontWeight: 600,
            color: 'var(--accent-blue)', opacity: 0.45, width: '100%',
          }}
        >
          <HelpCircle size={11} />
          ¿Por qué se recomienda esto?
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RecomendacionesPage() {
  const [varkActive, setVarkActive]   = useState<Set<EstiloVark>>(new Set([ESTILO_DOMINANTE]));
  const [saved,      setSaved]        = useState<Set<string>>(new Set());
  const [hovered,    setHovered]      = useState<Recurso | null>(null);
  const [panelOpen,  setPanelOpen]    = useState(true);
  const [modalOpen,  setModalOpen]    = useState(false);
  const [selected,   setSelected]     = useState<Recurso | null>(null);
  const [justOpen,    setJustOpen]    = useState(false);
  const [justRecurso,  setJustRecurso]  = useState<Recurso | null>(null);
  const [valorOpen,    setValorOpen]   = useState(false);
  const [valorRecurso, setValorRecurso] = useState<Recurso | null>(null);
  // API state
  const [recursos,   setRecursos]     = useState<Recurso[]>(MOCK_RECURSOS);
  const [perfilVark, setPerfilVark]   = useState(PERFIL_VARK);
  const [estiloDom,  setEstiloDom]    = useState<EstiloVark>(ESTILO_DOMINANTE);

  // CU-13: Cargar historial de recomendaciones + perfil al montar
  useEffect(() => {
    let mounted = true;
    Promise.all([
      misRecomendaciones(),
      fetchPerfilVARK(),
    ])
      .then(([recs, perfil]) => {
        if (!mounted) return;
        if (recs.length > 0) {
          setRecursos(recs.map(toRecurso));
        }
        const v = { v: perfil.puntaje_visual, a: perfil.puntaje_auditivo, r: perfil.puntaje_lectura, k: perfil.puntaje_kinestesico };
        setPerfilVark(v);
        const dom = perfil.estilo_dominante;
        setEstiloDom(dom);
        setVarkActive(new Set([dom]));
      })
      .catch(() => {
        // Si falla, mantenemos los valores mock/fallback
      });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVark = (v: EstiloVark) => setVarkActive((prev) => {
    const next = new Set(prev);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  });

  const toggleSave = (id: string) => setSaved((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openModal = (r: Recurso) => {
    setSelected(r);
    setModalOpen(true);
    // CU-15: registrar clic en el recurso · CU-13: marcar recomendación como vista
    if (r.recursoId) {
      registrarEventoClickstream({ recurso: r.recursoId, tipo_evento: 'clic' }).catch(() => {});
    }
    if (r.recomendacionId) {
      marcarRecomendacionVista(r.recomendacionId).catch(() => {});
    }
  };
  const openJust  = (r: Recurso) => { setJustRecurso(r); setJustOpen(true); };
  const openValor = (r: Recurso) => { setValorRecurso(r); setValorOpen(true); };

  const filtered = useMemo(
    () =>
      recursos
        .filter((r) => varkActive.size === 0 || varkActive.has(r.vark))
        .sort((a, b) => b.afinidad - a.afinidad),
    [varkActive, recursos],
  );

  const panelRecurso = hovered ?? selected;

  const dominanteCfg = VARK_CFG[estiloDom];

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--topbar-height, 70px))',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 28px 48px',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Sparkles size={20} color={dominanteCfg.color} />
                <h1
                  style={{
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    fontWeight: 800, fontSize: '1.55rem',
                    color: 'var(--text-primary)', margin: 0,
                  }}
                >
                  Recomendado{' '}
                  <span style={{ color: dominanteCfg.color }}>para ti</span>
                </h1>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                }}
              >
                Basado en tu perfil{' '}
                <span style={{ color: dominanteCfg.color, fontWeight: 700 }}>
                  {dominanteCfg.full}
                </span>
                {' '}— ordenados por compatibilidad con tu estilo
              </p>
            </div>

            {/* Toggle panel button */}
            <motion.button
              type="button"
              onClick={() => setPanelOpen((p) => !p)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                background: panelOpen ? 'rgba(59,110,248,0.1)' : 'var(--bg-glass)',
                color: panelOpen ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer', flexShrink: 0,
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <Brain size={14} />
              Mi perfil
              {panelOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </motion.button>
          </div>
        </motion.div>

        {/* ── VARK filter row ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span
            style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
              fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.09em',
              whiteSpace: 'nowrap',
            }}
          >
            Filtrar por estilo:
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['V', 'A', 'R', 'K'] as EstiloVark[]).map((v) => {
              const cfg    = VARK_CFG[v];
              const active = varkActive.has(v);
              return (
                <motion.button
                  key={v}
                  type="button"
                  onClick={() => toggleVark(v)}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 2,
                    width: 72, height: 60,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${active ? cfg.color : 'var(--border-glass)'}`,
                    background: active ? cfg.bg : 'var(--bg-glass)',
                    cursor: 'pointer', outline: 'none',
                    boxShadow: active ? cfg.glow : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-syne), Syne, sans-serif',
                      fontSize: '1.2rem', fontWeight: 800, lineHeight: 1,
                      color: active ? cfg.color : 'var(--text-muted)',
                      transition: 'color 0.18s',
                    }}
                  >
                    {v}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '0.58rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: active ? cfg.color : 'var(--text-muted)',
                      transition: 'color 0.18s',
                    }}
                  >
                    {cfg.full}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Counter */}
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{filtered.length}</span>
            {' '}recurso{filtered.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* ── Grid ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              variants={containerV}
              initial="hidden"
              animate="show"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 18,
              }}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((r) => (
                  <RecursoCard
                    key={r.id}
                    recurso={r}
                    saved={saved.has(r.id)}
                    onSave={() => toggleSave(r.id)}
                    onVer={() => openModal(r)}
                    onHover={setHovered}
                    onJustificar={() => openJust(r)}
                    onValorar={() => openValor(r)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 14, padding: '70px 24px', textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-glass)',
                background: 'var(--bg-glass)',
              }}
            >
              <Sparkles size={32} style={{ opacity: 0.2 }} />
              <p
                style={{
                  margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif',
                  fontWeight: 700, fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                }}
              >
                No hay recomendaciones para los estilos seleccionados
              </p>
              <button
                type="button"
                onClick={() => setVarkActive(new Set([estiloDom]))}
                style={{
                  padding: '8px 18px', borderRadius: 999,
                  border: '1px solid rgba(59,110,248,0.35)',
                  background: 'rgba(59,110,248,0.1)',
                  color: 'var(--accent-blue)',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                Restablecer filtro
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SIDE PANEL (slide from right)
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {panelOpen && (
          <motion.aside
            key="panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
            style={{
              flexShrink: 0, overflow: 'hidden',
              borderLeft: '1px solid var(--border-glass)',
              background: 'var(--bg-card)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div
              style={{
                width: 288, flex: 1, overflowY: 'auto',
                padding: '24px 20px',
                display: 'flex', flexDirection: 'column', gap: 24,
              }}
            >
              {/* Radar */}
              <div>
                <p style={panelLabelStyle}>Tu perfil VARK</p>
                <RadarChart data={perfilVark} size={220} />

                {/* VARK % bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {(['V', 'A', 'R', 'K'] as EstiloVark[]).map((v) => {
                    const cfg = VARK_CFG[v];
                    const pct = perfilVark[v.toLowerCase() as 'v' | 'a' | 'r' | 'k'];
                    return (
                      <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 18, textAlign: 'center',
                            fontFamily: 'var(--font-syne)', fontWeight: 800,
                            fontSize: '0.78rem', color: cfg.color, flexShrink: 0,
                          }}
                        >
                          {v}
                        </span>
                        <div
                          style={{
                            flex: 1, height: 4, borderRadius: 99,
                            background: 'var(--bg-glass)',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                            style={{ height: '100%', borderRadius: 99, background: cfg.color }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                            fontWeight: 700, color: cfg.color, minWidth: 30, textAlign: 'right',
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-glass)', flexShrink: 0 }} />

              {/* Reason block */}
              <AnimatePresence mode="wait">
                {panelRecurso ? (
                  <motion.div
                    key={panelRecurso.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    <p style={panelLabelStyle}>¿Por qué te recomendamos esto?</p>

                    {/* Resource mini title */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: VARK_CFG[panelRecurso.vark].bg,
                        border: `1px solid ${VARK_CFG[panelRecurso.vark].border}`,
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 4px',
                          fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.8rem',
                          color: 'var(--text-primary)', lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {panelRecurso.titulo}
                      </p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Badge variant={VARK_BADGE[panelRecurso.vark]} size="sm">
                          {panelRecurso.vark}
                        </Badge>
                        <span
                          style={{
                            fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
                            fontWeight: 700, color: VARK_CFG[panelRecurso.vark].color,
                          }}
                        >
                          {panelRecurso.afinidad}% compatible
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(59,110,248,0.05)',
                        border: '1px solid rgba(59,110,248,0.15)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        <Brain size={13} color="var(--accent-blue)" />
                        <span
                          style={{
                            fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
                            fontWeight: 800, color: 'var(--accent-blue)',
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                          }}
                        >
                          Análisis de compatibilidad
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
                          color: 'var(--text-secondary)', lineHeight: 1.65,
                        }}
                      >
                        {panelRecurso.razon}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 10, textAlign: 'center',
                      padding: '20px 12px',
                    }}
                  >
                    <Brain size={28} style={{ opacity: 0.18 }} />
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
                        color: 'var(--text-muted)', lineHeight: 1.55,
                      }}
                    >
                      Pasa el cursor sobre una card para ver por qué te recomendamos ese recurso
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL — Ver recurso
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected?.titulo ?? ''}
        maxWidth={620}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Badges row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge variant={VARK_BADGE[selected.vark]}>{selected.vark} — {VARK_CFG[selected.vark].full}</Badge>
              <Badge variant="ghost">{DIF_LABEL[selected.dificultad]}</Badge>
              <Badge variant="ghost">{selected.tipo}</Badge>
              <Badge variant="info">{selected.afinidad}% compatible</Badge>
            </div>

            {/* Description */}
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                color: 'var(--text-secondary)', lineHeight: 1.7,
              }}
            >
              {selected.descripcion}
            </p>

            {/* Afinidad */}
            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
                  fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
              >
                Compatibilidad con tu perfil
              </p>
              <AfinidadBar pct={selected.afinidad} color={VARK_CFG[selected.vark].color} />
            </div>

            {/* Reason */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59,110,248,0.05)',
                border: '1px solid rgba(59,110,248,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Brain size={13} color="var(--accent-blue)" />
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem',
                    fontWeight: 800, color: 'var(--accent-blue)',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}
                >
                  ¿Por qué te recomendamos esto?
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
                  color: 'var(--text-secondary)', lineHeight: 1.65,
                }}
              >
                {selected.razon}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  padding: '11px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.9rem',
                  fontWeight: 700, textDecoration: 'none',
                }}
              >
                <ExternalLink size={15} />
                Abrir recurso
              </a>
              <Button
                variant="ghost"
                onClick={() => { toggleSave(selected.id); }}
                style={{
                  border: saved.has(selected.id) ? '1px solid rgba(59,110,248,0.4)' : undefined,
                  color: saved.has(selected.id) ? 'var(--accent-blue)' : undefined,
                }}
              >
                {saved.has(selected.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {saved.has(selected.id) ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          CU-14 — Panel de valoración (bottom sheet)
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {valorOpen && valorRecurso && (
          <FeedbackPanel
            key={valorRecurso.id}
            rec={valorRecurso}
            onClose={() => setValorOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          MODAL CU-13 — Justificación de recomendación
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        open={justOpen}
        onClose={() => setJustOpen(false)}
        title="¿Por qué se recomienda esto?"
        maxWidth={680}
      >
        {justRecurso && (
          <JustContent rec={justRecurso} onClose={() => setJustOpen(false)} perfilVark={perfilVark} />
        )}
      </Modal>
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────────
const panelLabelStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
  fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.09em',
};
