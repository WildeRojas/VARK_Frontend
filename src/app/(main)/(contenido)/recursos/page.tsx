'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, FileText, Headphones, Code2,
  Star, ExternalLink, Edit2, Trash2,
  Plus, Search, Package, Link2,
} from 'lucide-react';
import Button  from '@/components/ui/Button';
import Badge   from '@/components/ui/Badge';
import Modal   from '@/components/ui/Modal';
import Input   from '@/components/ui/Input';
import Select, { SelectOption } from '@/components/ui/Select';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  listarRecursos, crearRecurso, actualizarRecurso, eliminarRecurso, listarTemas,
} from '@/lib/api/contenido';
import type {
  Recurso as RecursoAPI, NivelComplejidad, TipoFormato, CategoriaVARK,
} from '@/lib/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TipoRecurso = 'video' | 'documento' | 'audio' | 'ejercicio';
type EstiloVark  = 'V' | 'A' | 'R' | 'K';
type EstadoRec   = 'Aprobado' | 'Pendiente' | 'Rechazado';

interface Recurso {
  id:          string;
  titulo:      string;
  url:         string;
  descripcion: string;
  tema:        string;
  tipo:        TipoRecurso;
  vark:        EstiloVark;
  dificultad:  1 | 2 | 3;
  estado:      EstadoRec;
}

interface FormState {
  titulo:      string;
  url:         string;
  descripcion: string;
  tema:        string;
  tipo:        string;
  vark:        string;
  dificultad:  string;
}

interface FormErrors {
  titulo?:      string;
  url?:         string;
  descripcion?: string;
  tema?:        string;
  tipo?:        string;
  vark?:        string;
  dificultad?:  string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_RECURSOS: Recurso[] = [
  {
    id: '1',
    titulo: 'Introducción a Python – Variables y Tipos',
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    descripcion: 'Video tutorial que cubre los fundamentos de variables, tipos de datos y operadores en Python.',
    tema: 'python',
    tipo: 'video',
    vark: 'V',
    dificultad: 1,
    estado: 'Aprobado',
  },
  {
    id: '2',
    titulo: 'Guía completa de cadenas en Python',
    url: 'https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str',
    descripcion: 'Documentación oficial con todos los métodos de cadenas disponibles en Python 3.',
    tema: 'cadenas',
    tipo: 'documento',
    vark: 'R',
    dificultad: 2,
    estado: 'Aprobado',
  },
  {
    id: '3',
    titulo: 'Podcast: Estructuras de datos para principiantes',
    url: 'https://podcast.example.com/ep12',
    descripcion: 'Episodio de podcast que explica listas, tuplas y diccionarios de forma auditiva y ejemplificada.',
    tema: 'estructuras',
    tipo: 'audio',
    vark: 'A',
    dificultad: 1,
    estado: 'Aprobado',
  },
  {
    id: '4',
    titulo: 'Ejercicios: Listas y comprensión de listas',
    url: 'https://exercism.org/tracks/python',
    descripcion: 'Set de ejercicios prácticos para dominar la creación y manipulación de listas en Python.',
    tema: 'estructuras',
    tipo: 'ejercicio',
    vark: 'K',
    dificultad: 2,
    estado: 'Pendiente',
  },
  {
    id: '5',
    titulo: 'Funciones en Python – Guía visual',
    url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
    descripcion: 'Video con animaciones que explica scope, parámetros y retorno de valores en funciones Python.',
    tema: 'funciones',
    tipo: 'video',
    vark: 'V',
    dificultad: 2,
    estado: 'Aprobado',
  },
  {
    id: '6',
    titulo: 'Artículo: Programación orientada a objetos',
    url: 'https://realpython.com/python3-object-oriented-programming/',
    descripcion: 'Artículo detallado sobre clases, herencia y polimorfismo con ejemplos prácticos.',
    tema: 'poo',
    tipo: 'documento',
    vark: 'R',
    dificultad: 3,
    estado: 'Aprobado',
  },
  {
    id: '7',
    titulo: 'Laboratorio: Algoritmos de ordenamiento',
    url: 'https://cs.university.edu/labs/sorting',
    descripcion: 'Laboratorio interactivo donde se implementan bubble sort, merge sort y quick sort.',
    tema: 'algoritmos',
    tipo: 'ejercicio',
    vark: 'K',
    dificultad: 3,
    estado: 'Rechazado',
  },
  {
    id: '8',
    titulo: 'Audio explicativo: Recursividad',
    url: 'https://podcast.example.com/recursion',
    descripcion: 'Explicación auditiva de la recursividad con analogías del mundo real y ejemplos de código.',
    tema: 'funciones',
    tipo: 'audio',
    vark: 'A',
    dificultad: 3,
    estado: 'Pendiente',
  },
];

// ─── Select options ───────────────────────────────────────────────────────────
const TEMAS_OPTS: SelectOption[] = [
  { value: 'python',      label: 'Python Básico' },
  { value: 'cadenas',     label: 'Cadenas' },
  { value: 'estructuras', label: 'Estructuras de datos' },
  { value: 'funciones',   label: 'Funciones' },
  { value: 'poo',         label: 'POO' },
  { value: 'algoritmos',  label: 'Algoritmos' },
];

const TIPO_OPTS: SelectOption[] = [
  { value: 'video',      label: 'Video' },
  { value: 'documento',  label: 'Documento' },
  { value: 'audio',      label: 'Audio' },
  { value: 'ejercicio',  label: 'Ejercicio' },
];

const VARK_OPTS: SelectOption[] = [
  { value: 'V', label: 'Visual (V)' },
  { value: 'A', label: 'Auditivo (A)' },
  { value: 'R', label: 'Lectura (R)' },
  { value: 'K', label: 'Kinestésico (K)' },
];

const ESTADO_OPTS: SelectOption[] = [
  { value: 'Aprobado',  label: 'Aprobado' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Rechazado', label: 'Rechazado' },
];

const DIFICULTAD_OPTS: SelectOption[] = [
  { value: '1', label: '★ Básico' },
  { value: '2', label: '★★ Intermedio' },
  { value: '3', label: '★★★ Avanzado' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TEMA_LABEL: Record<string, string> = {
  python:      'Python Básico',
  cadenas:     'Cadenas',
  estructuras: 'Estructuras de datos',
  funciones:   'Funciones',
  poo:         'POO',
  algoritmos:  'Algoritmos',
};

const VARK_BADGE: Record<EstiloVark, 'vark-v' | 'vark-a' | 'vark-r' | 'vark-k'> = {
  V: 'vark-v', A: 'vark-a', R: 'vark-r', K: 'vark-k',
};
const VARK_LABEL: Record<EstiloVark, string> = {
  V: 'Visual', A: 'Auditivo', R: 'Lectura', K: 'Kinestésico',
};
const ESTADO_BADGE: Record<EstadoRec, 'success' | 'warning' | 'danger'> = {
  Aprobado:  'success',
  Pendiente: 'warning',
  Rechazado: 'danger',
};

const TIPO_ICON: Record<TipoRecurso, React.ReactNode> = {
  video:     <Play     size={18} />,
  documento: <FileText size={18} />,
  audio:     <Headphones size={18} />,
  ejercicio: <Code2    size={18} />,
};

const TIPO_COLOR: Record<TipoRecurso, string> = {
  video:     'var(--vark-v)',
  documento: 'var(--vark-r)',
  audio:     'var(--vark-a)',
  ejercicio: 'var(--vark-k)',
};

// ─── API ↔ UI mapping ─────────────────────────────────────────────────────────
const TIPO_API_TO_UI: Record<TipoFormato, TipoRecurso> = {
  video: 'video', articulo: 'documento', documento: 'documento', ejercicio: 'ejercicio',
};
const TIPO_UI_TO_API: Record<TipoRecurso, TipoFormato> = {
  video: 'video', documento: 'documento', audio: 'documento', ejercicio: 'ejercicio',
};
const NIVEL_API_TO_DIF: Record<NivelComplejidad, 1 | 2 | 3> = {
  basico: 1, intermedio: 2, avanzado: 3,
};
const DIF_TO_NIVEL_API: Record<number, NivelComplejidad> = {
  1: 'basico', 2: 'intermedio', 3: 'avanzado',
};

function mapRecursoAPI(r: RecursoAPI): Recurso {
  return {
    id: String(r.id),
    titulo: r.titulo,
    url: r.url ?? '',
    descripcion: r.descripcion ?? '',
    tema: String(r.tema),
    tipo: TIPO_API_TO_UI[r.tipo_formato] ?? 'documento',
    vark: r.categoria_vark,
    dificultad: NIVEL_API_TO_DIF[r.nivel_complejidad] ?? 1,
    estado: r.activo ? 'Aprobado' : 'Rechazado',
  };
}

function getYoutubeThumbnail(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
}

function StarRating({ value }: { value: 1 | 2 | 3 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          size={12}
          fill={n <= value ? 'var(--warning)' : 'transparent'}
          color={n <= value ? 'var(--warning)' : 'var(--border-glass)'}
        />
      ))}
    </div>
  );
}

// ─── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
};

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew, canCreate = true }: { onNew: () => void; canCreate?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px', gap: 16, textAlign: 'center',
      }}
    >
      {/* Illustration */}
      <div
        style={{
          width: 80, height: 80,
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(59,110,248,0.08)',
          border: '1px solid rgba(59,110,248,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(59,110,248,0.5)',
          marginBottom: 4,
        }}
      >
        <Package size={36} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-syne)', fontWeight: 700,
          fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0,
        }}
      >
        Sin recursos
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-dm-sans)', fontSize: '0.85rem',
          color: 'var(--text-muted)', margin: 0, maxWidth: 300,
        }}
      >
        No se encontraron recursos con los filtros actuales. Prueba con otros criterios{canCreate ? ' o agrega uno nuevo' : ''}.
      </p>
      {canCreate && (
        <Button variant="outline" onClick={onNew}>
          <Plus size={15} />
          Nuevo recurso
        </Button>
      )}
    </motion.div>
  );
}

// ─── URL Preview ───────────────────────────────────────────────────────────────
function UrlPreview({ url }: { url: string }) {
  if (!url.trim()) return null;

  const ytThumb = getYoutubeThumbnail(url);
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { /* invalid url */ }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        overflow: 'hidden',
        background: 'var(--bg-glass)',
      }}
    >
      {ytThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ytThumb}
          alt="thumbnail"
          style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            height: 80, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10,
            color: 'var(--text-muted)',
          }}
        >
          <Link2 size={18} />
          <span
            style={{
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
              color: 'var(--text-secondary)', wordBreak: 'break-all',
            }}
          >
            {hostname || url}
          </span>
        </div>
      )}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <ExternalLink size={12} color="var(--text-muted)" />
        <span
          style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
            color: 'var(--text-muted)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}
        >
          {url}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormState = {
  titulo: '', url: '', descripcion: '',
  tema: '', tipo: '', vark: '', dificultad: '',
};

export default function RecursosPage() {
  const { user } = useAuth();
  const esEstudiante = user?.rol === 'estudiante';
  const [recursos,    setRecursos]    = useState<Recurso[]>(MOCK_RECURSOS);
  const [temaOpts,    setTemaOpts]    = useState<SelectOption[]>(TEMAS_OPTS);
  const temaLabelMap = useMemo(
    () => Object.fromEntries(temaOpts.map((t) => [t.value, t.label])) as Record<string, string>,
    [temaOpts],
  );

  // Carga inicial (CU-08/CU-11)
  useEffect(() => {
    let mounted = true;
    listarTemas()
      .then((temas) => {
        if (mounted && temas.length) {
          setTemaOpts(temas.map((t) => ({ value: String(t.id), label: t.nombre })));
        }
      })
      .catch(() => {});
    listarRecursos()
      .then((data) => { if (mounted) setRecursos(data.map(mapRecursoAPI)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const [busqueda,    setBusqueda]    = useState('');
  const [filtroTema,  setFiltroTema]  = useState('');
  const [filtroVark,  setFiltroVark]  = useState('');
  const [filtroEst,   setFiltroEst]   = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [errors,      setErrors]      = useState<FormErrors>({});
  const [hovered,     setHovered]     = useState<string | null>(null);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = busqueda.toLowerCase();
    return recursos.filter((r) => {
      if (q && !r.titulo.toLowerCase().includes(q) && !r.descripcion.toLowerCase().includes(q)) return false;
      if (filtroTema && r.tema  !== filtroTema) return false;
      if (filtroVark && r.vark  !== filtroVark) return false;
      if (filtroEst  && r.estado !== filtroEst) return false;
      return true;
    });
  }, [recursos, busqueda, filtroTema, filtroVark, filtroEst]);

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r: Recurso) => {
    setEditingId(r.id);
    setForm({
      titulo:      r.titulo,
      url:         r.url,
      descripcion: r.descripcion,
      tema:        r.tema,
      tipo:        r.tipo,
      vark:        r.vark,
      dificultad:  String(r.dificultad),
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const setField = (key: keyof FormState) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.titulo.trim())     e.titulo      = 'El título es requerido';
    if (!form.url.trim())        e.url         = 'La URL es requerida';
    else {
      try { new URL(form.url); } catch { e.url = 'URL inválida'; }
    }
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida';
    if (!form.tema)              e.tema        = 'Selecciona un tema';
    if (!form.tipo)              e.tipo        = 'Selecciona un tipo';
    if (!form.vark)              e.vark        = 'Selecciona un estilo VARK';
    if (!form.dificultad)        e.dificultad  = 'Selecciona la dificultad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      titulo:            form.titulo.trim(),
      url:               form.url.trim(),
      descripcion:       form.descripcion.trim(),
      tema:              Number(form.tema),
      categoria_vark:    form.vark as CategoriaVARK,
      nivel_complejidad: DIF_TO_NIVEL_API[Number(form.dificultad)] ?? 'basico',
      tipo_formato:      TIPO_UI_TO_API[form.tipo as TipoRecurso] ?? 'documento',
    };
    try {
      if (editingId) {
        const updated = await actualizarRecurso(Number(editingId), payload);
        setRecursos((prev) => prev.map((r) => (r.id === editingId ? mapRecursoAPI(updated) : r)));
      } else {
        const created = await crearRecurso(payload);
        setRecursos((prev) => [mapRecursoAPI(created), ...prev]);
      }
      closeModal();
    } catch (err) {
      setErrors({ titulo: err instanceof Error ? err.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setRecursos((prev) => prev.filter((r) => r.id !== deleteId));
    eliminarRecurso(Number(deleteId)).catch(() => { /* cambio optimista en la UI */ });
    setDeleteId(null);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: '32px 32px 48px',
        minHeight: '100vh',
        background: 'transparent',
      }}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1
            style={{
              fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontWeight: 800, fontSize: '1.6rem',
              color: 'var(--text-primary)', margin: 0,
            }}
          >
            Recursos
          </h1>
          <Badge variant="default">{recursos.length} registros</Badge>
        </div>
        {!esEstudiante && (
          <Button variant="primary" onClick={openNew}>
            <Plus size={16} />
            Nuevo recurso
          </Button>
        )}
      </motion.div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px 180px 180px',
          gap: 12,
          marginBottom: 28,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)', display: 'flex',
              alignItems: 'center', pointerEvents: 'none', zIndex: 1,
            }}
          >
            <Search size={15} />
          </span>
          <input
            placeholder="Buscar por título o descripción…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 14px 13px 40px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-glass)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <Select
          label="Tema"
          options={temaOpts}
          value={filtroTema}
          onChange={setFiltroTema}
          nullable nullLabel="Todos los temas"
        />
        <Select
          label="Estilo VARK"
          options={VARK_OPTS}
          value={filtroVark}
          onChange={setFiltroVark}
          nullable nullLabel="Todos los estilos"
        />
        <Select
          label="Estado"
          options={ESTADO_OPTS}
          value={filtroEst}
          onChange={setFiltroEst}
          nullable nullLabel="Todos los estados"
        />
      </motion.div>

      {/* ── Grid or empty ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <EmptyState key="empty" onNew={openNew} canCreate={!esEstudiante} />
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 18,
            }}
          >
            {filtered.map((r) => (
              <RecursoCard
                key={r.id}
                recurso={r}
                temaLabel={temaLabelMap[r.tema] ?? r.tema}
                hovered={hovered === r.id}
                onHover={() => setHovered(r.id)}
                onLeave={() => setHovered(null)}
                onEdit={openEdit}
                onDelete={() => setDeleteId(r.id)}
                readOnly={esEstudiante}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form modal ────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar recurso' : 'Nuevo recurso'}
        maxWidth={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Título */}
          <Input
            id="titulo"
            label="Título del recurso"
            value={form.titulo}
            onChange={(e) => setField('titulo')(e.target.value)}
            error={errors.titulo}
          />

          {/* URL */}
          <Input
            id="url"
            label="URL del recurso"
            value={form.url}
            onChange={(e) => setField('url')(e.target.value)}
            error={errors.url}
            icon={<Link2 size={15} />}
          />

          {/* URL Preview */}
          <AnimatePresence>
            {form.url.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <UrlPreview url={form.url} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Descripción */}
          <div style={{ position: 'relative' }}>
            <label
              style={{
                position: 'absolute', top: 8, left: 14,
                fontSize: '0.7rem', fontWeight: 700,
                color: errors.descripcion ? 'var(--danger)' : 'var(--text-muted)',
                fontFamily: 'var(--font-dm-sans)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                pointerEvents: 'none',
              }}
            >
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setField('descripcion')(e.target.value)}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '26px 14px 10px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${errors.descripcion ? 'var(--danger)' : 'var(--border-glass)'}`,
                background: 'var(--bg-glass)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                resize: 'vertical', outline: 'none',
              }}
            />
            {errors.descripcion && (
              <p
                style={{
                  margin: '4px 0 0 14px', fontSize: '0.72rem',
                  color: 'var(--danger)', fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {errors.descripcion}
              </p>
            )}
          </div>

          {/* Fila selects 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Tema"
              options={temaOpts}
              value={form.tema}
              onChange={setField('tema')}
              error={errors.tema}
            />
            <Select
              label="Tipo de recurso"
              options={TIPO_OPTS}
              value={form.tipo}
              onChange={setField('tipo')}
              error={errors.tipo}
            />
            <Select
              label="Estilo VARK"
              options={VARK_OPTS}
              value={form.vark}
              onChange={setField('vark')}
              error={errors.vark}
            />
            <Select
              label="Dificultad"
              options={DIFICULTAD_OPTS}
              value={form.dificultad}
              onChange={setField('dificultad')}
              error={errors.dificultad}
            />
          </div>

          {/* Botones */}
          <div
            style={{
              display: 'flex', justifyContent: 'flex-end', gap: 12,
              paddingTop: 8, borderTop: '1px solid var(--border-glass)',
            }}
          >
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingId ? 'Guardar cambios' : 'Crear recurso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Eliminar recurso"
        maxWidth={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p
            style={{
              margin: 0, fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.875rem', color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Esta acción eliminará el recurso permanentemente. ¿Deseas continuar?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Recurso Card ─────────────────────────────────────────────────────────────
interface CardProps {
  recurso:   Recurso;
  temaLabel: string;
  hovered:   boolean;
  onHover:   () => void;
  onLeave:   () => void;
  onEdit:    (r: Recurso) => void;
  onDelete:  () => void;
  readOnly?: boolean;
}

function RecursoCard({ recurso: r, temaLabel, hovered, onHover, onLeave, onEdit, onDelete, readOnly = false }: CardProps) {
  const ytThumb = r.tipo === 'video' ? getYoutubeThumbnail(r.url) : null;

  return (
    <motion.div
      variants={cardVariants}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      animate={hovered
        ? { scale: 1.025, boxShadow: '0 0 24px rgba(59,110,248,0.22)' }
        : { scale: 1,     boxShadow: 'none' }
      }
      transition={{ duration: 0.22 }}
      className="glass-card"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Thumbnail / tipo header */}
      <div
        style={{
          height: ytThumb ? 130 : 68,
          background: ytThumb
            ? undefined
            : `linear-gradient(135deg, ${TIPO_COLOR[r.tipo]}18 0%, transparent 70%)`,
          borderBottom: '1px solid var(--border-glass)',
          position: 'relative',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {ytThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ytThumb}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              background: `${TIPO_COLOR[r.tipo]}1a`,
              border: `1px solid ${TIPO_COLOR[r.tipo]}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: TIPO_COLOR[r.tipo],
            }}
          >
            {TIPO_ICON[r.tipo]}
          </div>
        )}

        {/* Estado badge top-right */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <Badge variant={ESTADO_BADGE[r.estado]} size="sm">
            {r.estado}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge variant={VARK_BADGE[r.vark]} size="sm">
            {r.vark} — {VARK_LABEL[r.vark]}
          </Badge>
          <Badge variant="ghost" size="sm">
            {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}
          </Badge>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700, fontSize: '0.92rem',
            color: 'var(--text-primary)', margin: 0,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {r.titulo}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem',
            color: 'var(--text-muted)', margin: 0,
            lineHeight: 1.5, flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {r.descripcion}
        </p>

        {/* Meta row */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8, borderTop: '1px solid var(--border-glass)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StarRating value={r.dificultad} />
            <span
              style={{
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              {temaLabel}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <ActionBtn
              title="Ver URL"
              onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={13} />
            </ActionBtn>
            {!readOnly && (
              <>
                <ActionBtn title="Editar" onClick={() => onEdit(r)}>
                  <Edit2 size={13} />
                </ActionBtn>
                <ActionBtn title="Eliminar" danger onClick={onDelete}>
                  <Trash2 size={13} />
                </ActionBtn>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Action icon button ────────────────────────────────────────────────────────
function ActionBtn({
  children, onClick, title, danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <motion.button
      title={title}
      type="button"
      onClick={onClick}
      whileHover={{
        background: danger ? 'rgba(255,82,82,0.15)' : 'rgba(59,110,248,0.15)',
        color: danger ? 'var(--danger)' : 'var(--accent-blue)',
      }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 28, height: 28,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-glass)',
        background: 'transparent',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.18s, background 0.18s',
      }}
    >
      {children}
    </motion.button>
  );
}
