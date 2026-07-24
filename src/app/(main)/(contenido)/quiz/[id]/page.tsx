'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ArrowRight, CheckCircle, XCircle, RotateCcw,
  ArrowLeft, X, AlertTriangle, BookOpen, Clock, HelpCircle,
} from 'lucide-react';
import BackgroundPattern from '@/components/layout/BackgroundPattern';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { obtenerPreguntasQuiz, responderQuiz } from '@/lib/api/contenido';
import type { ResultadoQuiz } from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Opcion {
  id: string;
  texto: string;
}

interface Pregunta {
  id: string;
  enunciado: string;
  opciones: Opcion[];
  correctaId: string;
}

interface QuizMeta {
  titulo: string;
  tema: string;
  descripcion: string;
  dificultad: 'Fácil' | 'Media' | 'Difícil';
  tiempoEstimado: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const QUIZ_META: QuizMeta = {
  titulo:         'Quiz: Cadenas de texto',
  tema:           'Cadenas',
  descripcion:    'Evalúa tu comprensión sobre manipulación de cadenas, métodos integrados y operaciones básicas en Python.',
  dificultad:     'Media',
  tiempoEstimado: '~8 min',
};

const PREGUNTAS: Pregunta[] = [
  {
    id: '1',
    enunciado: '¿Qué método de cadena elimina los espacios en blanco al inicio y al final de un string en Python?',
    opciones: [
      { id: 'a', texto: 'strip()' },
      { id: 'b', texto: 'trim()' },
      { id: 'c', texto: 'clean()' },
      { id: 'd', texto: 'remove()' },
    ],
    correctaId: 'a',
  },
  {
    id: '2',
    enunciado: '¿Cuál es el resultado de la expresión "hola" * 3 en Python?',
    opciones: [
      { id: 'a', texto: '"hola hola hola"' },
      { id: 'b', texto: '"holaholahola"' },
      { id: 'c', texto: 'Error de tipo' },
      { id: 'd', texto: '"hola3"' },
    ],
    correctaId: 'b',
  },
  {
    id: '3',
    enunciado: '¿Qué índice tiene el último carácter de la cadena "Python" si se accede con índice negativo?',
    opciones: [
      { id: 'a', texto: '-6' },
      { id: 'b', texto: '5' },
      { id: 'c', texto: '-1' },
      { id: 'd', texto: '6' },
    ],
    correctaId: 'c',
  },
  {
    id: '4',
    enunciado: '¿Cuál de los siguientes métodos verifica si todos los caracteres de una cadena son letras?',
    opciones: [
      { id: 'a', texto: 'isalpha()' },
      { id: 'b', texto: 'isword()' },
      { id: 'c', texto: 'ischar()' },
      { id: 'd', texto: 'istext()' },
    ],
    correctaId: 'a',
  },
  {
    id: '5',
    enunciado: '¿Qué produce el slice "Python"[1:4] en Python?',
    opciones: [
      { id: 'a', texto: '"Pyt"' },
      { id: 'b', texto: '"yth"' },
      { id: 'c', texto: '"ytho"' },
      { id: 'd', texto: '"tho"' },
    ],
    correctaId: 'b',
  },
];

// ─── Difficulty badge ─────────────────────────────────────────────────────────
const DIFICULTAD_VARIANT = {
  'Fácil': 'success',
  'Media': 'warning',
  'Difícil': 'danger',
} as const;

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: 'easeOut' });
    const unsub = rounded.on('change', setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [to]);

  return <>{display}</>;
}

// ─── Circular progress ────────────────────────────────────────────────────────
function CircularProgress({ pct, color }: { pct: number; color: string }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={136} height={136} style={{ transform: 'rotate(-90deg)' }}>
      {/* bg track */}
      <circle cx={68} cy={68} r={r} fill="none" stroke="var(--border-glass)" strokeWidth={8} />
      {/* fill */}
      <motion.circle
        cx={68} cy={68} r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 6px ${color}90)` }}
      />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Screen = 'start' | 'question' | 'result';

const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f'];

export default function QuizPage() {
  const params = useParams();
  const temaId = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);

  const [screen,      setScreen]      = useState<Screen>('start');
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [respuestas,  setRespuestas]  = useState<Record<string, string>>({});   // preguntaId → letra elegida
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [direction,   setDirection]   = useState(1);   // 1 = fwd, -1 = bwd
  const [exitModal,   setExitModal]   = useState(false);
  const [calculating, setCalculating] = useState(false);

  // ── Datos del backend (CU-07) ───────────────────────────────────────────────
  const [preguntas,  setPreguntas]  = useState<Pregunta[]>(PREGUNTAS);
  const [quizMeta,   setQuizMeta]   = useState<QuizMeta>(QUIZ_META);
  const [opcionBackendId, setOpcionBackendId] = useState<Record<string, number>>({});
  const [resultado,  setResultado]  = useState<ResultadoQuiz | null>(null);
  const [, setLoadError]  = useState<string | null>(null);

  // Carga las preguntas reales del tema (sin revelar la respuesta correcta)
  useEffect(() => {
    if (!temaId) return;
    let mounted = true;
    obtenerPreguntasQuiz(temaId)
      .then((data) => {
        if (!mounted) return;
        const map: Record<string, number> = {};
        const mapped: Pregunta[] = data.preguntas.map((p) => {
          const opciones = p.opciones.map((o, i) => {
            const letra = LETRAS[i] ?? String(i);
            map[`${p.id}:${letra}`] = o.id;
            return { id: letra, texto: o.texto };
          });
          return { id: String(p.id), enunciado: p.enunciado, opciones, correctaId: '' };
        });
        setPreguntas(mapped);
        setOpcionBackendId(map);
        if (data.preguntas[0]) {
          setQuizMeta((m) => ({ ...m, titulo: `Quiz: ${data.preguntas[0].tema_nombre}`, tema: data.preguntas[0].tema_nombre }));
        }
      })
      .catch((err) => { if (mounted) setLoadError(err instanceof Error ? err.message : 'Error al cargar el quiz.'); });
    return () => { mounted = false; };
  }, [temaId]);

  const total    = preguntas.length;
  const pregunta = preguntas[currentIdx];
  const isLast   = currentIdx === total - 1;

  // ── Score (calculado por el backend) ─────────────────────────────────────────
  const correctas = resultado?.respuestas_correctas ?? 0;
  const pct = resultado ? Math.round(resultado.puntaje * 100) : 0;
  const esCorrectaMap: Record<string, boolean> = {};
  (resultado?.respuestas_json ?? []).forEach((r) => {
    esCorrectaMap[String(r.pregunta_id)] = r.es_correcta;
  });
  const resultColor =
    pct >= 70 ? 'var(--success)' :
    pct >= 40 ? 'var(--warning)' :
    'var(--danger)';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!selectedOpt) return;
    const updated = { ...respuestas, [pregunta.id]: selectedOpt };
    setRespuestas(updated);

    if (isLast) {
      setCalculating(true);
      try {
        const payload = {
          tema_id: temaId,
          respuestas: Object.entries(updated).map(([pid, letra]) => ({
            pregunta_id: Number(pid),
            opcion_id: opcionBackendId[`${pid}:${letra}`],
          })),
        };
        const res = await responderQuiz(payload);
        setResultado(res);
        setScreen('result');
      } catch {
        // Si falla el envío, igualmente mostramos la pantalla de resultado.
        setScreen('result');
      } finally {
        setCalculating(false);
      }
      return;
    }
    setDirection(1);
    setSelectedOpt(respuestas[preguntas[currentIdx + 1]?.id] ?? null);
    setCurrentIdx((i) => i + 1);
  };

  const handleRestart = () => {
    setRespuestas({});
    setSelectedOpt(null);
    setCurrentIdx(0);
    setDirection(1);
    setResultado(null);
    setScreen('start');
  };

  // Pre-fill selection if revisiting
  useEffect(() => {
    setSelectedOpt(respuestas[pregunta?.id] ?? null);
  }, [currentIdx]);

  // ── Slide variants ─────────────────────────────────────────────────────────
  const slideVariants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60, transition: { duration: 0.22 } }),
  };

  // ── Background wrapper ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <BackgroundPattern />

      <div
        style={{
          position: 'relative', zIndex: 1,
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN: START
          ═══════════════════════════════════════════════════════════════════ */}
          {screen === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '32px 20px',
              }}
            >
              <div
                className="glass-card"
                style={{ width: '100%', maxWidth: 520, padding: '40px 36px' }}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
                  style={{
                    width: 64, height: 64,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(59,110,248,0.15)',
                    border: '1px solid rgba(59,110,248,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                    color: 'var(--accent-blue)',
                  }}
                >
                  <HelpCircle size={30} />
                </motion.div>

                {/* Title */}
                <h1
                  style={{
                    fontFamily: 'var(--font-syne), Syne, sans-serif',
                    fontWeight: 800, fontSize: '1.8rem',
                    color: 'var(--text-primary)', margin: '0 0 10px',
                    lineHeight: 1.2,
                  }}
                >
                  {quizMeta.titulo.split(':')[0]}:{' '}
                  <span style={{ color: 'var(--accent-blue)' }}>
                    {quizMeta.titulo.split(':')[1]?.trim()}
                  </span>
                </h1>

                {/* Description */}
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                    color: 'var(--text-secondary)', lineHeight: 1.65,
                    margin: '0 0 28px',
                  }}
                >
                  {quizMeta.descripcion}
                </p>

                {/* Meta chips */}
                <div
                  style={{
                    display: 'flex', gap: 10, flexWrap: 'wrap',
                    marginBottom: 32,
                  }}
                >
                  <div style={metaChip}>
                    <BookOpen size={13} color="var(--text-muted)" />
                    <span>{total} preguntas</span>
                  </div>
                  <div style={metaChip}>
                    <Clock size={13} color="var(--text-muted)" />
                    <span>{quizMeta.tiempoEstimado}</span>
                  </div>
                  <Badge variant={DIFICULTAD_VARIANT[quizMeta.dificultad]} size="sm">
                    {quizMeta.dificultad}
                  </Badge>
                </div>

                <Button variant="primary" fullWidth onClick={() => setScreen('question')}>
                  Comenzar quiz
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN: QUESTION
          ═══════════════════════════════════════════════════════════════════ */}
          {screen === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* ── Top bar ─────────────────────────────────────────────────── */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 28px',
                  borderBottom: '1px solid var(--border-glass)',
                  background: 'rgba(5,11,31,0.7)',
                  backdropFilter: 'blur(20px)',
                  flexShrink: 0,
                }}
              >
                {/* Exit button */}
                <motion.button
                  whileHover={{ color: 'var(--danger)' }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setExitModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.82rem', fontWeight: 500,
                    transition: 'color 0.2s',
                    padding: '6px 0',
                  }}
                >
                  <X size={15} />
                  Salir
                </motion.button>

                {/* Progress bar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={progressLabel}>
                      Pregunta {currentIdx + 1} de {total}
                    </span>
                    <span style={progressLabel}>
                      {Math.round(((currentIdx) / total) * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6, borderRadius: 999,
                      background: 'var(--border-glass)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: `${(currentIdx / total) * 100}%` }}
                      animate={{ width: `${((currentIdx + 1) / total) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 999,
                        background: 'var(--accent-blue)',
                        boxShadow: '0 0 10px rgba(59,110,248,0.5)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Question card area ──────────────────────────────────────── */}
              <div
                style={{
                  flex: 1, overflow: 'auto',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  padding: '28px 20px',
                }}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={pregunta.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ width: '100%', maxWidth: 640 }}
                  >
                    {/* Card */}
                    <div
                      className="glass-card"
                      style={{ padding: '36px 32px' }}
                    >
                      {/* Question number */}
                      <p
                        style={{
                          margin: '0 0 16px',
                          fontSize: '0.72rem', fontWeight: 700,
                          color: 'var(--accent-blue)',
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          fontFamily: 'var(--font-dm-sans)',
                        }}
                      >
                        Pregunta {currentIdx + 1}
                      </p>

                      {/* Enunciado */}
                      <h2
                        style={{
                          fontFamily: 'var(--font-syne), Syne, sans-serif',
                          fontWeight: 700, fontSize: '1.2rem',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5, margin: '0 0 28px',
                        }}
                      >
                        {pregunta.enunciado}
                      </h2>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {pregunta.opciones.map((opcion, oi) => {
                          const isSelected = selectedOpt === opcion.id;
                          return (
                            <motion.button
                              key={opcion.id}
                              type="button"
                              onClick={() => setSelectedOpt(opcion.id)}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: oi * 0.06, duration: 0.25 }}
                              whileHover={
                                !isSelected
                                  ? {
                                      borderColor: 'rgba(59,110,248,0.5)',
                                      boxShadow: '0 0 16px rgba(59,110,248,0.15)',
                                      background: 'rgba(59,110,248,0.06)',
                                    }
                                  : {}
                              }
                              whileTap={{ scale: 0.98 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 18px',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                                background: isSelected
                                  ? 'rgba(59,110,248,0.14)'
                                  : 'var(--bg-glass)',
                                cursor: 'pointer', textAlign: 'left',
                                boxShadow: isSelected
                                  ? '0 0 18px rgba(59,110,248,0.2)'
                                  : 'none',
                                transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                                width: '100%',
                              }}
                            >
                              {/* Option label */}
                              <span
                                style={{
                                  flexShrink: 0,
                                  width: 28, height: 28,
                                  borderRadius: 'var(--radius-sm)',
                                  border: `1.5px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                                  background: isSelected ? 'var(--accent-blue)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.72rem', fontWeight: 700,
                                  color: isSelected ? '#fff' : 'var(--text-muted)',
                                  fontFamily: 'var(--font-dm-sans)',
                                  textTransform: 'uppercase',
                                  transition: 'border-color 0.2s, background 0.2s, color 0.2s',
                                }}
                              >
                                {opcion.id.toUpperCase()}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-dm-sans)', fontSize: '0.9rem',
                                  fontWeight: isSelected ? 600 : 400,
                                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  lineHeight: 1.4,
                                  transition: 'color 0.2s, font-weight 0.2s',
                                }}
                              >
                                {opcion.texto}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── Bottom nav ──────────────────────────────────────────────── */}
              <div
                style={{
                  padding: '16px 28px',
                  borderTop: '1px solid var(--border-glass)',
                  background: 'rgba(5,11,31,0.7)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex', justifyContent: 'flex-end',
                  flexShrink: 0,
                }}
              >
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!selectedOpt}
                  loading={calculating}
                  style={{ minWidth: 160 }}
                >
                  {isLast ? 'Ver resultados' : 'Siguiente'}
                  <ArrowRight size={15} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN: RESULT
          ═══════════════════════════════════════════════════════════════════ */}
          {screen === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              style={{
                flex: 1, overflow: 'auto',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                padding: '32px 20px 40px',
                gap: 24,
              }}
            >
              {/* Result card */}
              <div
                className="glass-card"
                style={{ width: '100%', maxWidth: 580, padding: '36px 32px' }}
              >
                {/* Icon + circular progress */}
                <div
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 0, marginBottom: 28,
                  }}
                >
                  {/* Circular progress with icon inside */}
                  <div style={{ position: 'relative', width: 136, height: 136 }}>
                    <CircularProgress pct={pct} color={resultColor} />
                    <div
                      style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 18 }}
                      >
                        {pct >= 70
                          ? <CheckCircle size={28} color="var(--success)" />
                          : <XCircle    size={28} color="var(--danger)"  />
                        }
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{
                          fontFamily: 'var(--font-syne)', fontWeight: 800,
                          fontSize: '1.5rem', color: resultColor,
                          lineHeight: 1,
                        }}
                      >
                        <AnimatedNumber to={pct} />%
                      </motion.span>
                    </div>
                  </div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.35 }}
                    style={{
                      fontFamily: 'var(--font-syne)', fontWeight: 800,
                      fontSize: '1.55rem', color: 'var(--text-primary)',
                      margin: '20px 0 6px', textAlign: 'center',
                    }}
                  >
                    {pct >= 70 ? '¡Bien hecho!' : 'Sigue practicando'}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                      color: 'var(--text-secondary)', margin: 0, textAlign: 'center',
                    }}
                  >
                    Respondiste correctamente{' '}
                    <strong style={{ color: resultColor }}>
                      <AnimatedNumber to={correctas} /> de {total}
                    </strong>{' '}
                    preguntas
                  </motion.p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-glass)', margin: '0 0 22px' }} />

                {/* Per-question breakdown */}
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                    fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    margin: '0 0 12px',
                  }}
                >
                  Desglose de respuestas
                </p>

                <div
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    maxHeight: 260, overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {preguntas.map((p, idx) => {
                    const elegida    = respuestas[p.id];
                    const acertada   = esCorrectaMap[p.id] ?? false;
                    const opElegida  = p.opciones.find((o) => o.id === elegida);

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.07, duration: 0.28 }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${acertada ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.25)'}`,
                          background: acertada ? 'rgba(0,230,118,0.05)' : 'rgba(255,82,82,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          {acertada
                            ? <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                            : <XCircle    size={15} color="var(--danger)"  style={{ flexShrink: 0, marginTop: 2 }} />
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: '0 0 6px',
                                fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
                                fontWeight: 500, color: 'var(--text-primary)',
                                lineHeight: 1.4,
                              }}
                            >
                              {idx + 1}. {p.enunciado}
                            </p>
                            {!acertada && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem', color: 'var(--danger)',
                                    fontFamily: 'var(--font-dm-sans)',
                                  }}
                                >
                                  Tu respuesta: <strong>{opElegida?.texto ?? '—'}</strong>
                                </span>
                              </div>
                            )}
                            {acertada && (
                              <span
                                style={{
                                  fontSize: '0.75rem', color: 'var(--success)',
                                  fontFamily: 'var(--font-dm-sans)',
                                }}
                              >
                                ✓ {opElegida?.texto}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex', gap: 12, justifyContent: 'flex-end',
                    marginTop: 24, paddingTop: 20,
                    borderTop: '1px solid var(--border-glass)',
                  }}
                >
                  <Button variant="ghost" onClick={handleRestart}>
                    <RotateCcw size={14} />
                    Intentar de nuevo
                  </Button>
                  <Button variant="primary" onClick={() => window.history.back()}>
                    <ArrowLeft size={14} />
                    Volver a temas
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Exit confirmation modal ─────────────────────────────────────────── */}
      <Modal
        open={exitModal}
        onClose={() => setExitModal(false)}
        title="¿Salir del quiz?"
        maxWidth={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '13px 15px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,215,64,0.07)',
              border: '1px solid rgba(255,215,64,0.25)',
            }}
          >
            <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                margin: 0, fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6,
              }}
            >
              Tu progreso actual se perderá. ¿Estás seguro de que quieres salir?
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="ghost" onClick={() => setExitModal(false)}>
              Continuar quiz
            </Button>
            <Button variant="danger" onClick={() => window.history.back()}>
              Salir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const metaChip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '4px 12px',
  borderRadius: 999,
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-glass)',
  fontSize: '0.78rem', fontWeight: 500,
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-dm-sans)',
};

const progressLabel: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 600,
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-dm-sans)',
};
