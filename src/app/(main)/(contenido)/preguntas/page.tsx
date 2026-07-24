'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, HelpCircle,
  CheckCircle2, Circle, BookOpen, X, AlertCircle, Sparkles, Wand2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Select, { SelectOption } from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import {
  listarPreguntas, crearPregunta, actualizarPregunta, eliminarPregunta, listarTemas,
  sugerirPreguntasIA,
} from '@/lib/api/contenido';
import type {
  Pregunta as PreguntaAPI, NivelDificultad, PreguntaPayload, OrigenPregunta,
} from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type Dificultad = 'Fácil' | 'Media' | 'Difícil';

interface Opcion {
  id: string;
  texto: string;
}

interface Pregunta {
  id: string;
  enunciado: string;
  tema: string;
  dificultad: Dificultad;
  opciones: Opcion[];
  correctaId: string;
  creadoPor: string;
  fecha: string;
  origen?: OrigenPregunta;
}

interface FormState {
  enunciado: string;
  tema: string;
  dificultad: string;
  opciones: { id: string; texto: string }[];
  correctaId: string;
}

interface FormErrors {
  enunciado?: string;
  tema?: string;
  dificultad?: string;
  opciones?: string;
  correcta?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const TEMAS: SelectOption[] = [
  { value: 'numeros',  label: 'Números' },
  { value: 'cadenas',  label: 'Cadenas' },
  { value: 'vectores', label: 'Vectores' },
  { value: 'matrices', label: 'Matrices' },
];

const DIFICULTADES: SelectOption[] = [
  { value: 'Fácil',  label: 'Fácil' },
  { value: 'Media',  label: 'Media' },
  { value: 'Difícil', label: 'Difícil' },
];

const MOCK_PREGUNTAS: Pregunta[] = [
  {
    id: '1',
    enunciado: '¿Cuál es el resultado de dividir un número entero entre cero en Python?',
    tema: 'numeros',
    dificultad: 'Media',
    opciones: [
      { id: 'a', texto: 'Retorna 0' },
      { id: 'b', texto: 'Retorna infinito' },
      { id: 'c', texto: 'Lanza una excepción ZeroDivisionError' },
      { id: 'd', texto: 'Retorna None' },
    ],
    correctaId: 'c',
    creadoPor: 'Dr. García',
    fecha: '10 Ene 2026',
  },
  {
    id: '2',
    enunciado: '¿Qué método permite convertir una cadena de texto a mayúsculas en Python?',
    tema: 'cadenas',
    dificultad: 'Fácil',
    opciones: [
      { id: 'a', texto: 'toUpper()' },
      { id: 'b', texto: 'upper()' },
      { id: 'c', texto: 'toUpperCase()' },
      { id: 'd', texto: 'capitalize()' },
    ],
    correctaId: 'b',
    creadoPor: 'Dra. Martínez',
    fecha: '12 Ene 2026',
  },
  {
    id: '3',
    enunciado: '¿Cuál es la complejidad temporal de acceder a un elemento de un arreglo por índice?',
    tema: 'vectores',
    dificultad: 'Fácil',
    opciones: [
      { id: 'a', texto: 'O(n)' },
      { id: 'b', texto: 'O(log n)' },
      { id: 'c', texto: 'O(1)' },
      { id: 'd', texto: 'O(n²)' },
    ],
    correctaId: 'c',
    creadoPor: 'Dr. García',
    fecha: '15 Ene 2026',
  },
  {
    id: '4',
    enunciado: '¿Cómo se accede al elemento en la fila 2, columna 3 de una matriz bidimensional en Python?',
    tema: 'matrices',
    dificultad: 'Difícil',
    opciones: [
      { id: 'a', texto: 'matriz[2][3]' },
      { id: 'b', texto: 'matriz[1][2]' },
      { id: 'c', texto: 'matriz(2, 3)' },
      { id: 'd', texto: 'matriz.get(2, 3)' },
    ],
    correctaId: 'b',
    creadoPor: 'Dra. Martínez',
    fecha: '18 Ene 2026',
  },
  {
    id: '5',
    enunciado: '¿Cuál de los siguientes no es un tipo numérico en Python?',
    tema: 'numeros',
    dificultad: 'Fácil',
    opciones: [
      { id: 'a', texto: 'int' },
      { id: 'b', texto: 'float' },
      { id: 'c', texto: 'char' },
      { id: 'd', texto: 'complex' },
    ],
    correctaId: 'c',
    creadoPor: 'Dr. García',
    fecha: '20 Ene 2026',
  },
  {
    id: '6',
    enunciado: '¿Qué operador se usa para la concatenación de cadenas en Python?',
    tema: 'cadenas',
    dificultad: 'Fácil',
    opciones: [
      { id: 'a', texto: '&' },
      { id: 'b', texto: '.' },
      { id: 'c', texto: '+' },
      { id: 'd', texto: '*' },
    ],
    correctaId: 'c',
    creadoPor: 'Dra. Martínez',
    fecha: '22 Ene 2026',
  },
  {
    id: '7',
    enunciado: '¿Cuál es la función para obtener la longitud de una lista (vector) en Python?',
    tema: 'vectores',
    dificultad: 'Fácil',
    opciones: [
      { id: 'a', texto: 'size()' },
      { id: 'b', texto: 'length()' },
      { id: 'c', texto: 'count()' },
      { id: 'd', texto: 'len()' },
    ],
    correctaId: 'd',
    creadoPor: 'Dr. García',
    fecha: '25 Ene 2026',
  },
  {
    id: '8',
    enunciado: '¿Cuánto espacio en memoria ocupa una matriz de 3×3 de enteros de 4 bytes?',
    tema: 'matrices',
    dificultad: 'Difícil',
    opciones: [
      { id: 'a', texto: '9 bytes' },
      { id: 'b', texto: '12 bytes' },
      { id: 'c', texto: '36 bytes' },
      { id: 'd', texto: '18 bytes' },
    ],
    correctaId: 'c',
    creadoPor: 'Dr. García',
    fecha: '28 Ene 2026',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIFICULTAD_VARIANT: Record<Dificultad, 'success' | 'warning' | 'danger'> = {
  'Fácil':   'success',
  'Media':   'warning',
  'Difícil': 'danger',
};

const TEMA_LABEL: Record<string, string> = {
  numeros:  'Números',
  cadenas:  'Cadenas',
  vectores: 'Vectores',
  matrices: 'Matrices',
};

// ─── API ↔ UI mapping ─────────────────────────────────────────────────────────
const DIF_API_TO_UI: Record<NivelDificultad, Dificultad> = {
  facil: 'Fácil', media: 'Media', dificil: 'Difícil',
};
const DIF_UI_TO_API: Record<Dificultad, NivelDificultad> = {
  'Fácil': 'facil', 'Media': 'media', 'Difícil': 'dificil',
};
const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f'];

function mapPreguntaAPI(p: PreguntaAPI): Pregunta {
  const opciones = p.opciones.map((o, i) => ({ id: LETRAS[i] ?? String(i), texto: o.texto }));
  const correctaIdx = p.opciones.findIndex((o) => o.es_correcta);
  return {
    id: String(p.id),
    enunciado: p.enunciado,
    tema: String(p.tema),
    dificultad: DIF_API_TO_UI[p.nivel_dificultad] ?? 'Fácil',
    opciones,
    correctaId: opciones[correctaIdx]?.id ?? opciones[0]?.id ?? 'a',
    creadoPor: 'Docente',
    fecha: p.fecha_creacion ? new Date(p.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    origen: p.origen,
  };
}

// ─── Editor de candidata IA (Fase 4) ──────────────────────────────────────────
interface CandidataEditor {
  enunciado: string;
  explicacion: string;
  opciones: { texto: string }[];
  correctaIdx: number;
}
const DIFICULTADES_IA: SelectOption[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Media' },
  { value: 'dificil', label: 'Difícil' },
];

function newOpcion(id: string): Opcion {
  return { id, texto: '' };
}

function emptyForm(): FormState {
  return {
    enunciado: '',
    tema: '',
    dificultad: '',
    opciones: [
      newOpcion('a'),
      newOpcion('b'),
      newOpcion('c'),
      newOpcion('d'),
    ],
    correctaId: '',
  };
}

// ─── Animation variants ───────────────────────────────────────────────────────
const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PreguntasPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(MOCK_PREGUNTAS);

  // Temas reales (CU-04) para selects y etiquetas
  const [temaOpts, setTemaOpts] = useState<SelectOption[]>(TEMAS);
  const temaLabelMap = useMemo(
    () => Object.fromEntries(temaOpts.map((t) => [t.value, t.label])) as Record<string, string>,
    [temaOpts],
  );

  // Carga inicial desde el backend (CU-05)
  useEffect(() => {
    let mounted = true;
    listarTemas()
      .then((temas) => {
        if (mounted && temas.length) {
          setTemaOpts(temas.map((t) => ({ value: String(t.id), label: t.nombre })));
        }
      })
      .catch(() => { /* fallback a TEMAS estáticos */ });
    listarPreguntas()
      .then((data) => { if (mounted) setPreguntas(data.map(mapPreguntaAPI)); })
      .catch(() => { /* se mantienen datos de respaldo */ });
    return () => { mounted = false; };
  }, []);

  // Filters
  const [filterTema,       setFilterTema]       = useState('');
  const [filterDificultad, setFilterDificultad] = useState('');

  // Hover
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Form modal
  const [formOpen,   setFormOpen]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving,     setSaving]     = useState(false);

  // Preview modal
  const [previewPregunta, setPreviewPregunta] = useState<Pregunta | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Generar con IA (Fase 4) ──────────────────────────────────────────────────
  const [iaOpen, setIaOpen] = useState(false);
  const [iaTema, setIaTema] = useState('');
  const [iaDificultad, setIaDificultad] = useState('facil');
  const [iaCantidad, setIaCantidad] = useState(5);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaCandidatas, setIaCandidatas] = useState<CandidataEditor[]>([]);
  const [iaAprobadas, setIaAprobadas] = useState(0);
  const [iaSavingIdx, setIaSavingIdx] = useState<number | null>(null);

  const openIA = () => {
    setIaTema(filterTema || ''); setIaDificultad('facil'); setIaCantidad(5);
    setIaCandidatas([]); setIaAprobadas(0); setIaError(null); setIaOpen(true);
  };

  const handleGenerarIA = async () => {
    if (!iaTema) { setIaError('Selecciona un tema.'); return; }
    setIaLoading(true); setIaError(null);
    try {
      const data = await sugerirPreguntasIA(Number(iaTema), iaDificultad as NivelDificultad, iaCantidad);
      setIaCandidatas(data.preguntas.map((c) => ({
        enunciado: c.enunciado,
        explicacion: c.explicacion,
        opciones: c.opciones.map((o) => ({ texto: o.texto })),
        correctaIdx: Math.max(0, c.opciones.findIndex((o) => o.es_correcta)),
      })));
      setIaAprobadas(0);
      if (data.preguntas.length === 0) setIaError('La IA no devolvió preguntas. Intenta de nuevo.');
    } catch (e) {
      setIaError(e instanceof Error ? e.message : 'No se pudo generar con IA. Puedes crear preguntas manualmente.');
    } finally { setIaLoading(false); }
  };

  const setCand = (idx: number, patch: Partial<CandidataEditor>) =>
    setIaCandidatas((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const setCandOpcion = (idx: number, oi: number, texto: string) =>
    setIaCandidatas((prev) => prev.map((c, i) => i === idx
      ? { ...c, opciones: c.opciones.map((o, j) => (j === oi ? { texto } : o)) } : c));

  const handleAprobarIA = async (idx: number) => {
    const c = iaCandidatas[idx];
    const conTexto = c.opciones.filter((o) => o.texto.trim());
    if (!c.enunciado.trim() || conTexto.length < 2) { setIaError('Completa el enunciado y al menos 2 opciones.'); return; }
    if (!c.opciones[c.correctaIdx]?.texto.trim()) { setIaError('La opción marcada como correcta no puede estar vacía.'); return; }
    setIaSavingIdx(idx); setIaError(null);
    try {
      const payload: PreguntaPayload = {
        enunciado: c.enunciado.trim(),
        tema: Number(iaTema),
        nivel_dificultad: iaDificultad as NivelDificultad,
        origen: 'ia',
        explicacion: c.explicacion.trim(),
        opciones: c.opciones
          .map((o, i) => ({ texto: o.texto.trim(), es_correcta: i === c.correctaIdx }))
          .filter((o) => o.texto),
      };
      const created = await crearPregunta(payload);
      setPreguntas((prev) => [mapPreguntaAPI(created), ...prev]);
      setIaCandidatas((prev) => prev.filter((_, i) => i !== idx));
      setIaAprobadas((n) => n + 1);
    } catch (e) {
      setIaError(e instanceof Error ? e.message : 'Error al aprobar la pregunta.');
    } finally { setIaSavingIdx(null); }
  };

  const handleDescartarIA = (idx: number) => setIaCandidatas((prev) => prev.filter((_, i) => i !== idx));

  // ─── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return preguntas.filter((p) => {
      if (filterTema       && p.tema       !== filterTema)       return false;
      if (filterDificultad && p.dificultad !== filterDificultad) return false;
      return true;
    });
  }, [preguntas, filterTema, filterDificultad]);

  // ─── Form handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (p: Pregunta) => {
    setEditingId(p.id);
    setForm({
      enunciado:  p.enunciado,
      tema:       p.tema,
      dificultad: p.dificultad,
      opciones:   p.opciones.map((o) => ({ ...o })),
      correctaId: p.correctaId,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.enunciado.trim()) errs.enunciado = 'El enunciado es obligatorio';
    if (!form.tema)             errs.tema       = 'Selecciona un tema';
    if (!form.dificultad)       errs.dificultad = 'Selecciona la dificultad';
    const validas = form.opciones.filter((o) => o.texto.trim());
    if (validas.length < 2)  errs.opciones = 'Debe haber al menos 2 opciones con texto';
    if (!form.correctaId)    errs.correcta  = 'Marca la opción correcta';
    else if (!form.opciones.find((o) => o.id === form.correctaId && o.texto.trim()))
      errs.correcta = 'La opción correcta no tiene texto';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const opcionesConTexto = form.opciones.filter((o) => o.texto.trim());
    const payload = {
      enunciado: form.enunciado.trim(),
      tema: Number(form.tema),
      nivel_dificultad: DIF_UI_TO_API[form.dificultad as Dificultad],
      opciones: opcionesConTexto.map((o) => ({
        texto: o.texto.trim(),
        es_correcta: o.id === form.correctaId,
      })),
    };
    try {
      if (editingId) {
        const updated = await actualizarPregunta(Number(editingId), payload);
        setPreguntas((prev) => prev.map((p) => (p.id === editingId ? mapPreguntaAPI(updated) : p)));
      } else {
        const created = await crearPregunta(payload);
        setPreguntas((prev) => [mapPreguntaAPI(created), ...prev]);
      }
      setFormOpen(false);
    } catch (err) {
      setFormErrors({ enunciado: err instanceof Error ? err.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
    eliminarPregunta(Number(id)).catch(() => { /* cambio optimista en la UI */ });
    setDeleteId(null);
  };

  const updateOpcion = (idx: number, texto: string) => {
    setForm((prev) => {
      const opciones = [...prev.opciones];
      opciones[idx] = { ...opciones[idx], texto };
      return { ...prev, opciones };
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: 1100, margin: '0 auto' }}
    >
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59,110,248,0.15)',
              border: '1px solid rgba(59,110,248,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <HelpCircle size={20} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-syne), Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Banco de{' '}
              <span style={{ color: 'var(--accent-blue)' }}>preguntas</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Gestiona las preguntas para los quizzes por tema
            </p>
          </div>
          <Badge variant="default" size="md">
            {filtered.length} pregunta{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={openIA}>
            <Sparkles size={16} />
            Generar con IA
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Nueva pregunta
          </Button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 22,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 220px', maxWidth: 280 }}>
          <Select
            label="Filtrar por tema"
            options={temaOpts}
            value={filterTema}
            onChange={setFilterTema}
            nullable
            nullLabel="Todos los temas"
          />
        </div>
        <div style={{ flex: '1 1 180px', maxWidth: 240 }}>
          <Select
            label="Dificultad"
            options={DIFICULTADES}
            value={filterDificultad}
            onChange={setFilterDificultad}
            nullable
            nullLabel="Todas"
          />
        </div>

        {/* Active filters badges */}
        <AnimatePresence>
          {(filterTema || filterDificultad) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}
            >
              {filterTema && (
                <button
                  onClick={() => setFilterTema('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 999,
                    background: 'rgba(59,110,248,0.12)',
                    border: '1px solid rgba(59,110,248,0.3)',
                    color: 'var(--accent-blue)',
                    fontSize: '0.72rem', fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.05em',
                  }}
                >
                  {temaLabelMap[filterTema]}
                  <X size={11} />
                </button>
              )}
              {filterDificultad && (
                <button
                  onClick={() => setFilterDificultad('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 999,
                    background: filterDificultad === 'Fácil'
                      ? 'rgba(0,230,118,0.1)' : filterDificultad === 'Media'
                      ? 'rgba(255,215,64,0.1)' : 'rgba(255,82,82,0.1)',
                    border: `1px solid ${filterDificultad === 'Fácil'
                      ? 'rgba(0,230,118,0.3)' : filterDificultad === 'Media'
                      ? 'rgba(255,215,64,0.3)' : 'rgba(255,82,82,0.3)'}`,
                    color: filterDificultad === 'Fácil'
                      ? 'var(--success)' : filterDificultad === 'Media'
                      ? 'var(--warning)' : 'var(--danger)',
                    fontSize: '0.72rem', fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.05em',
                  }}
                >
                  {filterDificultad}
                  <X size={11} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div
        className="glass-card"
        style={{ overflow: 'hidden', padding: 0 }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 130px 110px 90px 90px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-glass)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {['Pregunta', 'Tema', 'Dificultad', 'Opciones', 'Acciones'].map((col) => (
            <span
              key={col}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Empty state */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '56px 20px',
                gap: 14,
                color: 'var(--text-muted)',
              }}
            >
              <BookOpen size={40} strokeWidth={1.2} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'var(--font-dm-sans)' }}>
                No hay preguntas con los filtros aplicados
              </p>
              <Button variant="outline" onClick={openCreate}>
                <Plus size={14} />
                Agregar pregunta
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filtered.map((p, idx) => (
                <motion.div
                  key={p.id}
                  variants={rowVariants}
                  onHoverStart={() => setHoveredId(p.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  onClick={() => setPreviewPregunta(p)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 130px 110px 90px 90px',
                    padding: '15px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-glass)' : 'none',
                    background: hoveredId === p.id ? 'var(--bg-glass-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    alignItems: 'center',
                  }}
                >
                  {/* Pregunta (truncada) */}
                  <div style={{ paddingRight: 16, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-dm-sans)',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.enunciado}
                    </p>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {p.creadoPor} · {p.fecha}
                      {p.origen === 'ia' && (
                        <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}> · IA</span>
                      )}
                    </span>
                  </div>

                  {/* Tema */}
                  <div>
                    <Badge variant="vark-v" size="sm">
                      {temaLabelMap[p.tema] ?? p.tema}
                    </Badge>
                  </div>

                  {/* Dificultad */}
                  <div>
                    <Badge variant={DIFICULTAD_VARIANT[p.dificultad]} size="sm">
                      {p.dificultad}
                    </Badge>
                  </div>

                  {/* Opciones count */}
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {p.opciones.length} opc.
                  </div>

                  {/* Acciones */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <AnimatePresence>
                      {hoveredId === p.id && (
                        <motion.div
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 6 }}
                          transition={{ duration: 0.15 }}
                          style={{ display: 'flex', gap: 6 }}
                        >
                          <motion.button
                            whileHover={{ color: 'var(--accent-cyan)' }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setPreviewPregunta(p)}
                            title="Previsualizar"
                            style={{
                              background: 'none', border: 'none',
                              color: 'var(--text-muted)', cursor: 'pointer',
                              padding: 5, borderRadius: 'var(--radius-sm)',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Eye size={15} />
                          </motion.button>
                          <motion.button
                            whileHover={{ color: 'var(--accent-blue)' }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => openEdit(p)}
                            title="Editar"
                            style={{
                              background: 'none', border: 'none',
                              color: 'var(--text-muted)', cursor: 'pointer',
                              padding: 5, borderRadius: 'var(--radius-sm)',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Edit2 size={15} />
                          </motion.button>
                          <motion.button
                            whileHover={{ color: 'var(--danger)' }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setDeleteId(p.id)}
                            title="Eliminar"
                            style={{
                              background: 'none', border: 'none',
                              color: 'var(--text-muted)', cursor: 'pointer',
                              padding: 5, borderRadius: 'var(--radius-sm)',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Trash2 size={15} />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Total count footer ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 12,
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-dm-sans)',
            textAlign: 'right',
          }}
        >
          Mostrando {filtered.length} de {preguntas.length} preguntas
        </motion.p>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Formulario crear / editar
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar pregunta' : 'Nueva pregunta'}
        maxWidth={660}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Enunciado */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: formErrors.enunciado ? 'var(--danger)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-dm-sans)',
                marginBottom: 8,
              }}
            >
              Enunciado de la pregunta
            </label>
            <textarea
              value={form.enunciado}
              onChange={(e) => setForm((p) => ({ ...p, enunciado: e.target.value }))}
              rows={3}
              placeholder="Escribe aquí el enunciado completo..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${formErrors.enunciado ? 'var(--danger)' : 'var(--border-glass)'}`,
                background: 'var(--bg-glass)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                fontSize: '0.875rem',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--border-active)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59,110,248,0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = formErrors.enunciado ? 'var(--danger)' : 'var(--border-glass)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <AnimatePresence>
              {formErrors.enunciado && (
                <ErrorMsg msg={formErrors.enunciado} />
              )}
            </AnimatePresence>
          </div>

          {/* Tema + Dificultad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Select
                label="Tema"
                options={temaOpts}
                value={form.tema}
                onChange={(v) => setForm((p) => ({ ...p, tema: v }))}
                error={formErrors.tema}
              />
              <AnimatePresence>
                {formErrors.tema && <ErrorMsg msg={formErrors.tema} />}
              </AnimatePresence>
            </div>
            <div>
              <Select
                label="Dificultad"
                options={DIFICULTADES}
                value={form.dificultad}
                onChange={(v) => setForm((p) => ({ ...p, dificultad: v }))}
                error={formErrors.dificultad}
              />
              <AnimatePresence>
                {formErrors.dificultad && <ErrorMsg msg={formErrors.dificultad} />}
              </AnimatePresence>
            </div>
          </div>

          {/* Opciones */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: formErrors.opciones || formErrors.correcta ? 'var(--danger)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Opciones de respuesta
              </label>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Selecciona la correcta →
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.opciones.map((opcion, idx) => {
                const isCorrecta = form.correctaId === opcion.id;
                return (
                  <motion.div
                    key={opcion.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isCorrecta ? 'rgba(0,230,118,0.4)' : 'var(--border-glass)'}`,
                      background: isCorrecta ? 'rgba(0,230,118,0.06)' : 'var(--bg-glass)',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    {/* Radio selector */}
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, correctaId: opcion.id }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: isCorrecta ? 'var(--success)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        transition: 'color 0.2s',
                      }}
                      title="Marcar como correcta"
                    >
                      {isCorrecta
                        ? <CheckCircle2 size={18} />
                        : <Circle size={18} />
                      }
                    </button>

                    {/* Label */}
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isCorrecta ? 'var(--success)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-dm-sans)',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                        width: 16,
                        transition: 'color 0.2s',
                      }}
                    >
                      {opcion.id.toUpperCase()}
                    </span>

                    {/* Text input */}
                    <input
                      type="text"
                      value={opcion.texto}
                      onChange={(e) => updateOpcion(idx, e.target.value)}
                      placeholder={`Opción ${opcion.id.toUpperCase()}`}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {formErrors.opciones && <ErrorMsg msg={formErrors.opciones} />}
              {formErrors.correcta && <ErrorMsg msg={formErrors.correcta} />}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              paddingTop: 8,
              borderTop: '1px solid var(--border-glass)',
            }}
          >
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingId ? 'Guardar cambios' : 'Crear pregunta'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Preview de pregunta
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!previewPregunta}
        onClose={() => setPreviewPregunta(null)}
        title="Vista previa de pregunta"
        maxWidth={580}
      >
        {previewPregunta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge variant="vark-v" size="sm">
                {temaLabelMap[previewPregunta.tema] ?? previewPregunta.tema}
              </Badge>
              <Badge variant={DIFICULTAD_VARIANT[previewPregunta.dificultad]} size="sm">
                {previewPregunta.dificultad}
              </Badge>
              <Badge variant="ghost" size="sm">
                {previewPregunta.creadoPor} · {previewPregunta.fecha}
              </Badge>
            </div>

            {/* Enunciado */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}
              >
                {previewPregunta.enunciado}
              </p>
            </div>

            {/* Opciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {previewPregunta.opciones.map((opcion) => {
                const isCorrecta = opcion.id === previewPregunta.correctaId;
                return (
                  <motion.div
                    key={opcion.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isCorrecta ? 'rgba(0,230,118,0.45)' : 'var(--border-glass)'}`,
                      background: isCorrecta ? 'rgba(0,230,118,0.08)' : 'var(--bg-glass)',
                    }}
                  >
                    <span
                      style={{
                        color: isCorrecta ? 'var(--success)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isCorrecta ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isCorrecta ? 'var(--success)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-dm-sans)',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                        width: 16,
                      }}
                    >
                      {opcion.id.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: isCorrecta ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-dm-sans)',
                        fontWeight: isCorrecta ? 600 : 400,
                      }}
                    >
                      {opcion.texto}
                    </span>
                    {isCorrecta && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--success)',
                          fontFamily: 'var(--font-dm-sans)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          flexShrink: 0,
                        }}
                      >
                        Correcta
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                paddingTop: 8,
                borderTop: '1px solid var(--border-glass)',
              }}
            >
              <Button
                variant="ghost"
                onClick={() => setPreviewPregunta(null)}
              >
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewPregunta(null);
                  openEdit(previewPregunta);
                }}
              >
                <Edit2 size={14} />
                Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Confirmar eliminación
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Eliminar pregunta"
        maxWidth={420}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,82,82,0.07)',
              border: '1px solid rgba(255,82,82,0.2)',
            }}
          >
            <AlertCircle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-dm-sans)',
                lineHeight: 1.6,
              }}
            >
              Esta acción es irreversible. La pregunta será eliminada del banco y
              no podrá usarse en futuros quizzes.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>
              <Trash2 size={14} />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Generar preguntas con IA (Fase 4)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal open={iaOpen} onClose={() => setIaOpen(false)} title="Generar preguntas con IA" maxWidth={720}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Controles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px auto', gap: 12, alignItems: 'flex-end' }}>
            <Select label="Tema" options={temaOpts} value={iaTema} onChange={setIaTema} />
            <Select label="Dificultad" options={DIFICULTADES_IA} value={iaDificultad} onChange={setIaDificultad} />
            <Input id="ia-cantidad" label="Cantidad" type="number"
              value={String(iaCantidad)} onChange={(e) => setIaCantidad(Number(e.target.value) || 0)} />
            <Button variant="primary" onClick={handleGenerarIA} loading={iaLoading}>
              <Wand2 size={15} />&nbsp;Generar
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <Sparkles size={16} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-dm-sans)' }}>
              La IA propone preguntas candidatas. Revisa y edita cada una, marca la opción correcta y aprueba las que quieras añadir al banco. Si la IA no está disponible, sigue funcionando la creación manual.
            </p>
          </div>

          {iaError && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>{iaError}</p>
          )}
          {iaAprobadas > 0 && (
            <Badge variant="success" size="sm">{iaAprobadas} pregunta(s) añadida(s) al banco</Badge>
          )}

          {/* Candidatas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '46vh', overflowY: 'auto' }}>
            {iaCandidatas.map((c, idx) => (
              <motion.div key={idx} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '16px 18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
                    Candidata #{idx + 1}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" onClick={() => handleDescartarIA(idx)}><X size={14} />&nbsp;Descartar</Button>
                    <Button variant="primary" onClick={() => handleAprobarIA(idx)} loading={iaSavingIdx === idx}>
                      <CheckCircle2 size={14} />&nbsp;Aprobar
                    </Button>
                  </div>
                </div>

                <textarea value={c.enunciado} onChange={(e) => setCand(idx, { enunciado: e.target.value })}
                  rows={2} placeholder="Enunciado" style={iaTextarea} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {c.opciones.map((o, oi) => {
                    const correcta = c.correctaIdx === oi;
                    return (
                      <div key={oi} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${correcta ? 'rgba(0,230,118,0.4)' : 'var(--border-glass)'}`,
                        background: correcta ? 'rgba(0,230,118,0.06)' : 'transparent',
                      }}>
                        <button type="button" onClick={() => setCand(idx, { correctaIdx: oi })} title="Marcar correcta"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: correcta ? 'var(--success)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                          {correcta ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                        </button>
                        <input type="text" value={o.texto} onChange={(e) => setCandOpcion(idx, oi, e.target.value)}
                          placeholder={`Opción ${LETRAS[oi]?.toUpperCase()}`}
                          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem' }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', display: 'block', marginBottom: 6 }}>
                    Explicación (retroalimentación)
                  </label>
                  <textarea value={c.explicacion} onChange={(e) => setCand(idx, { explicacion: e.target.value })}
                    rows={2} placeholder="Por qué la respuesta correcta es correcta" style={iaTextarea} />
                </div>
              </motion.div>
            ))}

            {iaCandidatas.length === 0 && !iaLoading && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <Sparkles size={30} strokeWidth={1.2} />
                <p style={{ marginTop: 10, fontSize: '0.85rem', fontFamily: 'var(--font-dm-sans)' }}>
                  Elige tema y dificultad y pulsa &ldquo;Generar&rdquo; para obtener preguntas candidatas.
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--border-glass)' }}>
            <Button variant="ghost" onClick={() => setIaOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

const iaTextarea: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--text-primary)',
  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', fontSize: '0.85rem', resize: 'vertical',
  outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
};

// ─── ErrorMsg helper ──────────────────────────────────────────────────────────
function ErrorMsg({ msg }: { msg: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        margin: '5px 0 0 2px',
        fontSize: '0.75rem',
        color: 'var(--danger)',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
      }}
    >
      {msg}
    </motion.p>
  );
}
