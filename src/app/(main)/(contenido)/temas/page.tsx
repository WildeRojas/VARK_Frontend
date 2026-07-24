'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, ChevronRight, Edit2, Trash2,
  FolderPlus, BookOpen, X, Layers, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import {
  listarTemasCompletos, crearTema, actualizarTema, eliminarTema,
  crearSubtema,
} from '@/lib/api/contenido';
import type { Tema as TemaAPI } from '@/lib/api/types';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Subtema {
  id: string;
  nombre: string;
  descripcion: string;
  creadoPor: string;
  fecha: string;
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  creadoPor: string;
  fecha: string;
  subtemas: Subtema[];
}

interface FormState {
  nombre: string;
  descripcion: string;
  parentId: string;
}

interface FormErrors {
  nombre?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_TEMAS: Tema[] = [
  {
    id: '1',
    nombre: 'Programación',
    descripcion: 'Fundamentos de programación y desarrollo de software',
    creadoPor: 'Admin',
    fecha: '15 Ene 2026',
    subtemas: [
      { id: '1-1', nombre: 'Variables y tipos de datos', descripcion: '', creadoPor: 'Admin',      fecha: '16 Ene 2026' },
      { id: '1-2', nombre: 'Estructuras de control',     descripcion: '', creadoPor: 'Dr. García', fecha: '17 Ene 2026' },
      { id: '1-3', nombre: 'Funciones y modularidad',    descripcion: '', creadoPor: 'Dr. García', fecha: '18 Ene 2026' },
    ],
  },
  {
    id: '2',
    nombre: 'Bases de Datos',
    descripcion: 'Diseño y gestión de sistemas de bases de datos relacionales',
    creadoPor: 'Dr. López',
    fecha: '01 Feb 2026',
    subtemas: [
      { id: '2-1', nombre: 'Modelo Entidad-Relación', descripcion: '', creadoPor: 'Dr. López', fecha: '02 Feb 2026' },
      { id: '2-2', nombre: 'SQL básico y avanzado',   descripcion: '', creadoPor: 'Dr. López', fecha: '03 Feb 2026' },
    ],
  },
  {
    id: '3',
    nombre: 'Redes y Comunicaciones',
    descripcion: 'Protocolos, arquitecturas y seguridad en redes de computadoras',
    creadoPor: 'Ing. Martínez',
    fecha: '15 Feb 2026',
    subtemas: [],
  },
  {
    id: '4',
    nombre: 'Inteligencia Artificial',
    descripcion: 'Fundamentos de IA, aprendizaje automático y deep learning',
    creadoPor: 'Dr. García',
    fecha: '01 Mar 2026',
    subtemas: [
      { id: '4-1', nombre: 'Machine Learning supervisado', descripcion: '', creadoPor: 'Dr. García', fecha: '02 Mar 2026' },
    ],
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

// ─── API → UI mapping ─────────────────────────────────────────────────────────
function mapTemaAPI(t: TemaAPI): Tema {
  return {
    id: String(t.id),
    nombre: t.nombre,
    descripcion: t.descripcion ?? '',
    creadoPor: 'Sistema',
    fecha: '',
    subtemas: (t.subtemas ?? []).map((s) => ({
      id: String(s.id),
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      creadoPor: 'Sistema',
      fecha: '',
    })),
  };
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function TemasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const esEstudiante = user?.rol === 'estudiante';
  const [temas, setTemas] = useState<Tema[]>(INITIAL_TEMAS);

  // Carga inicial desde el backend (CU-04)
  useEffect(() => {
    let mounted = true;
    listarTemasCompletos()
      .then((data) => { if (mounted) setTemas(data.map(mapTemaAPI)); })
      .catch(() => { /* se mantienen los datos de respaldo */ });
    return () => { mounted = false; };
  }, []);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemaId, setEditingTemaId] = useState<string | null>(null);
  const [editingSubtemaId, setEditingSubtemaId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: '', descripcion: '', parentId: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // ─── Filter ─────────────────────────────────────────────────────────────────
  const filteredTemas = useMemo(() => {
    if (!search.trim()) return temas;
    const q = search.toLowerCase();
    return temas.filter(
      (t) =>
        t.nombre.toLowerCase().includes(q) ||
        t.subtemas.some((s) => s.nombre.toLowerCase().includes(q)),
    );
  }, [temas, search]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateTema = () => {
    setEditingTemaId(null);
    setEditingSubtemaId(null);
    setForm({ nombre: '', descripcion: '', parentId: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openCreateSubtema = (parentId: string) => {
    setEditingTemaId(null);
    setEditingSubtemaId(null);
    setForm({ nombre: '', descripcion: '', parentId });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditTema = (tema: Tema) => {
    setEditingTemaId(tema.id);
    setEditingSubtemaId(null);
    setForm({ nombre: tema.nombre, descripcion: tema.descripcion, parentId: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditSubtema = (sub: Subtema, parentId: string) => {
    setEditingTemaId(null);
    setEditingSubtemaId(sub.id);
    setForm({ nombre: sub.nombre, descripcion: sub.descripcion, parentId });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTemaId(null);
    setEditingSubtemaId(null);
  };

  const deleteTema = (id: string) => {
    setTemas((prev) => prev.filter((t) => t.id !== id));
    eliminarTema(Number(id)).catch(() => { /* el cambio ya es optimista en la UI */ });
  };

  const deleteSubtema = (parentId: string, subId: string) => {
    setTemas((prev) =>
      prev.map((t) =>
        t.id === parentId ? { ...t, subtemas: t.subtemas.filter((s) => s.id !== subId) } : t,
      ),
    );
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'nombre' && formErrors.nombre) {
      setFormErrors((prev) => ({ ...prev, nombre: undefined }));
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setFormErrors({ nombre: 'El nombre es requerido.' });
      return;
    }
    setSaving(true);
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();

    try {
      if (editingTemaId) {
        // CU-04: Editar tema
        const updated = await actualizarTema(Number(editingTemaId), { nombre, descripcion });
        setTemas((prev) =>
          prev.map((t) => (t.id === editingTemaId ? { ...mapTemaAPI(updated) } : t)),
        );
      } else if (editingSubtemaId) {
        // El backend no expone edición de subtema: se actualiza localmente.
        setTemas((prev) =>
          prev.map((t) =>
            t.id === form.parentId
              ? {
                  ...t,
                  subtemas: t.subtemas.map((s) =>
                    s.id === editingSubtemaId ? { ...s, nombre, descripcion } : s,
                  ),
                }
              : t,
          ),
        );
      } else if (form.parentId) {
        // CU-04: Crear subtema
        const sub = await crearSubtema(Number(form.parentId), { nombre, descripcion });
        setTemas((prev) =>
          prev.map((t) =>
            t.id === form.parentId
              ? {
                  ...t,
                  subtemas: [
                    ...t.subtemas,
                    { id: String(sub.id), nombre: sub.nombre, descripcion: sub.descripcion ?? '', creadoPor: 'Sistema', fecha: '' },
                  ],
                }
              : t,
          ),
        );
        setExpandedIds((prev) => new Set(prev).add(form.parentId));
      } else {
        // CU-04: Crear tema
        const created = await crearTema({ nombre, descripcion });
        setTemas((prev) => [...prev, mapTemaAPI(created)]);
      }
      closeModal();
    } catch (err) {
      setFormErrors({ nombre: err instanceof Error ? err.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const temaOptions = temas.map((t) => ({ value: t.id, label: t.nombre }));

  const modalTitle = editingTemaId
    ? 'Editar tema'
    : editingSubtemaId
      ? 'Editar subtema'
      : form.parentId
        ? 'Nuevo subtema'
        : 'Nuevo tema';

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div variants={pageVariants} initial="hidden" animate="visible">
        {/* Page header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59,110,248,0.12)',
                border: '1px solid rgba(59,110,248,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={18} color="var(--accent-blue)" strokeWidth={1.8} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Temas
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                }}
              >
                {esEstudiante
                  ? 'Explora los temas disponibles y toma tu test por tema'
                  : 'Gestiona la jerarquía de temas y subtemas'}
              </p>
            </div>
            <Badge variant="info">{filteredTemas.length}</Badge>
          </div>
          {!esEstudiante && (
            <Button variant="primary" onClick={openCreateTema}>
              <Plus size={14} />
              &nbsp;Nuevo tema
            </Button>
          )}
        </div>

        {/* Search */}
        <div style={{ maxWidth: 360, marginBottom: 20 }}>
          <Input
            id="search-temas"
            label="Buscar temas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
            rightElement={
              search ? (
                <motion.button
                  type="button"
                  onClick={() => setSearch('')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-muted)',
                    padding: 0,
                  }}
                >
                  <X size={13} />
                </motion.button>
              ) : undefined
            }
          />
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 120px 110px 100px',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-glass)',
              background: 'var(--bg-glass)',
            }}
          >
            {['Nombre', 'Subtemas', 'Creado por', 'Fecha', 'Acciones'].map((col) => (
              <span
                key={col}
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          {filteredTemas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '60px 24px', textAlign: 'center' }}
            >
              <div style={{ marginBottom: 14, color: 'var(--text-muted)' }}>
                <Layers size={40} strokeWidth={1.2} />
              </div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-syne), Syne, sans-serif',
                }}
              >
                {search ? 'Sin resultados' : 'No hay temas creados aún'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                }}
              >
                {search
                  ? `No se encontraron temas con "${search}"`
                  : 'Crea el primer tema con el botón "Nuevo tema"'}
              </p>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {filteredTemas.map((tema) => {
                const isExpanded = expandedIds.has(tema.id);

                return (
                  <motion.div key={tema.id} variants={rowVariants}>
                    {/* Main row */}
                    <motion.div
                      onHoverStart={() => setHoveredRowId(tema.id)}
                      onHoverEnd={() => setHoveredRowId(null)}
                      animate={{
                        background:
                          hoveredRowId === tema.id ? 'var(--bg-glass-hover)' : 'transparent',
                      }}
                      transition={{ duration: 0.12 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 90px 120px 110px 100px',
                        padding: '13px 20px',
                        borderBottom: '1px solid var(--border-glass)',
                        alignItems: 'center',
                      }}
                    >
                      {/* Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <motion.button
                          onClick={() => toggleExpand(tema.id)}
                          whileHover={{ scale: tema.subtemas.length > 0 ? 1.15 : 1 }}
                          whileTap={{ scale: tema.subtemas.length > 0 ? 0.9 : 1 }}
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.18 }}
                          disabled={tema.subtemas.length === 0}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: tema.subtemas.length > 0 ? 'pointer' : 'default',
                            display: 'flex',
                            padding: 3,
                            color: tema.subtemas.length > 0 ? 'var(--accent-blue)' : 'var(--border-glass)',
                            flexShrink: 0,
                          }}
                        >
                          <ChevronRight size={13} />
                        </motion.button>
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                            }}
                          >
                            {tema.nombre}
                          </p>
                          {tema.descripcion && (
                            <p
                              style={{
                                margin: '2px 0 0',
                                fontSize: '0.73rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 340,
                              }}
                            >
                              {tema.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subtemas count */}
                      <div>
                        {tema.subtemas.length > 0 ? (
                          <Badge variant="info">{tema.subtemas.length}</Badge>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                            }}
                          >
                            —
                          </span>
                        )}
                      </div>

                      {/* Created by */}
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                        }}
                      >
                        {tema.creadoPor}
                      </span>

                      {/* Date */}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                        }}
                      >
                        {tema.fecha}
                      </span>

                      {/* Actions */}
                      {esEstudiante ? (
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); router.push(`/quiz/${tema.id}`); }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          title="Tomar test de este tema"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(59,110,248,0.12)',
                            border: '1px solid rgba(59,110,248,0.28)',
                            color: 'var(--accent-blue)', cursor: 'pointer',
                            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                            fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        >
                          <GraduationCap size={13} />
                          Tomar test
                        </motion.button>
                      ) : (
                        <AnimatePresence>
                          {hoveredRowId === tema.id ? (
                            <motion.div
                              key="actions"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.12 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                            >
                              <ActionBtn onClick={() => openEditTema(tema)} title="Editar tema" color="var(--text-secondary)">
                                <Edit2 size={13} />
                              </ActionBtn>
                              <ActionBtn onClick={() => openCreateSubtema(tema.id)} title="Añadir subtema" color="var(--accent-cyan)">
                                <FolderPlus size={13} />
                              </ActionBtn>
                              <ActionBtn onClick={() => deleteTema(tema.id)} title="Eliminar tema" color="var(--danger)">
                                <Trash2 size={13} />
                              </ActionBtn>
                            </motion.div>
                          ) : (
                            <div key="empty" />
                          )}
                        </AnimatePresence>
                      )}
                    </motion.div>

                    {/* Subtemas */}
                    <AnimatePresence initial={false}>
                      {isExpanded && tema.subtemas.length > 0 && (
                        <motion.div
                          key="subtemas"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                          style={{ overflow: 'hidden' }}
                        >
                          {tema.subtemas.map((sub, si) => {
                            const subRowId = `${tema.id}-${sub.id}`;
                            const isSubHovered = hoveredRowId === subRowId;

                            return (
                              <motion.div
                                key={sub.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: si * 0.04, duration: 0.22 }}
                                onHoverStart={() => setHoveredRowId(subRowId)}
                                onHoverEnd={() => setHoveredRowId(null)}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 90px 120px 110px 100px',
                                  padding: '10px 20px',
                                  borderBottom:
                                    si < tema.subtemas.length - 1
                                      ? '1px solid var(--border-glass)'
                                      : '1px solid var(--border-glass)',
                                  alignItems: 'center',
                                  background: isSubHovered
                                    ? 'rgba(59,110,248,0.05)'
                                    : 'rgba(59,110,248,0.02)',
                                  transition: 'background 0.12s',
                                }}
                              >
                                {/* Indented name */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    paddingLeft: 34,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderLeft: '1.5px solid rgba(59,110,248,0.3)',
                                      borderBottom: '1.5px solid rgba(59,110,248,0.3)',
                                      borderRadius: '0 0 0 4px',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '0.83rem',
                                      fontWeight: 500,
                                      color: 'var(--text-secondary)',
                                      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                                    }}
                                  >
                                    {sub.nombre}
                                  </p>
                                </div>

                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>—</span>

                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                                  {sub.creadoPor}
                                </span>

                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                                  {sub.fecha}
                                </span>

                                <AnimatePresence>
                                  {isSubHovered && !esEstudiante ? (
                                    <motion.div
                                      key="sub-actions"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.12 }}
                                      style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                                    >
                                      <ActionBtn onClick={() => openEditSubtema(sub, tema.id)} title="Editar subtema" color="var(--text-secondary)">
                                        <Edit2 size={12} />
                                      </ActionBtn>
                                      <ActionBtn onClick={() => deleteSubtema(tema.id, sub.id)} title="Eliminar subtema" color="var(--danger)">
                                        <Trash2 size={12} />
                                      </ActionBtn>
                                    </motion.div>
                                  ) : (
                                    <div key="sub-empty" />
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={modalTitle} maxWidth={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Parent badge (when pre-selected via "+ subtema" button) */}
          {form.parentId && !editingSubtemaId && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <Layers size={12} color="var(--accent-cyan)" />
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  fontWeight: 500,
                }}
              >
                Subtema de:{' '}
                <strong>{temas.find((t) => t.id === form.parentId)?.nombre}</strong>
              </span>
            </motion.div>
          )}

          {/* Name */}
          <Input
            id="tema-nombre"
            label="Nombre"
            value={form.nombre}
            onChange={(e) => handleFormChange('nombre', e.target.value)}
            error={formErrors.nombre}
            autoFocus
          />

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.67rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Descripción (opcional)
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => handleFormChange('descripcion', e.target.value)}
              rows={3}
              placeholder="Describe el contenido de este tema..."
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,110,248,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glass)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Parent selector (only when creating from scratch) */}
          {!editingTemaId && !editingSubtemaId && !form.parentId && (
            <Select
              label="Tema padre (opcional)"
              options={temaOptions}
              value={form.parentId}
              onChange={(v) => handleFormChange('parentId', v)}
              nullable
              nullLabel="Sin tema padre (tema principal)"
            />
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingTemaId || editingSubtemaId ? 'Guardar cambios' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  title,
  color,
  children,
}: {
  onClick: () => void;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color,
        display: 'flex',
        alignItems: 'center',
        padding: 5,
        borderRadius: 5,
      }}
    >
      {children}
    </motion.button>
  );
}
