'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Settings, Sparkles, Database, Eye, Plus, Edit2, Trash2,
  Check, X, AlertCircle, Save, Wand2, RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import {
  obtenerConfigVARK, actualizarConfigVARK,
  generarPreguntasVARK, listarBancoVARK, crearPreguntaVARK,
  actualizarPreguntaVARK, desactivarPreguntaVARK, previewTestVARK,
} from '@/lib/api/accounts';
import type {
  ConfiguracionTestVARK, PreguntaVARKAdmin, PreguntaCandidataVARK,
  EstiloVARK, PreviewTestVARKResponse,
} from '@/lib/api/types';

// ─── Config visual de estilos VARK ────────────────────────────────────────────
const ESTILOS: EstiloVARK[] = ['V', 'A', 'R', 'K'];
const ESTILO_LABEL: Record<EstiloVARK, string> = {
  V: 'Visual', A: 'Auditivo', R: 'Lectura/Escritura', K: 'Kinestésico',
};
const ESTILO_COLOR: Record<EstiloVARK, string> = {
  V: 'var(--vark-v)', A: 'var(--vark-a)', R: 'var(--vark-r)', K: 'var(--vark-k)',
};

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};
const PAGE = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ─── Forma editable de una pregunta (enunciado + 1 opción por estilo) ─────────
interface EditorState { enunciado: string; V: string; A: string; R: string; K: string }
const EDITOR_VACIO: EditorState = { enunciado: '', V: '', A: '', R: '', K: '' };

function preguntaAEditor(p: PreguntaVARKAdmin): EditorState {
  const base: EditorState = { ...EDITOR_VACIO };
  base.enunciado = p.enunciado;
  for (const o of p.opciones) base[o.estilo] = o.texto;
  return base;
}
function candidataAEditor(c: PreguntaCandidataVARK): EditorState {
  const base: EditorState = { ...EDITOR_VACIO };
  base.enunciado = c.enunciado;
  for (const o of c.opciones) base[o.estilo] = o.texto;
  return base;
}
function editorAPayload(e: EditorState, origen: 'ia' | 'manual') {
  return {
    enunciado: e.enunciado.trim(),
    origen,
    opciones: ESTILOS.map((est) => ({ texto: e[est].trim(), estilo: est })),
  };
}
function editorValido(e: EditorState): boolean {
  return e.enunciado.trim().length > 0 && ESTILOS.every((est) => e[est].trim().length > 0);
}

type TabId = 'config' | 'generar' | 'banco' | 'preview';
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'config', label: 'Configuración', icon: Settings },
  { id: 'generar', label: 'Generar con IA', icon: Sparkles },
  { id: 'banco', label: 'Banco de preguntas', icon: Database },
  { id: 'preview', label: 'Vista previa', icon: Eye },
];

export default function AdminTestVarkPage() {
  const [tab, setTab] = useState<TabId>('config');

  return (
    <motion.div variants={PAGE} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 'var(--radius-md)',
          background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)',
        }}>
          <Brain size={20} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Test <span style={{ color: 'var(--accent-purple)' }}>VARK</span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configura, genera y administra el test de estilos de aprendizaje
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
                color: active ? 'var(--accent-purple)' : 'var(--text-muted)',
                fontSize: '0.85rem', fontWeight: active ? 700 : 500,
                fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              }}>
              <t.icon size={15} />
              {t.label}
              {active && (
                <motion.div layoutId="vark-tab" style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                  background: 'var(--accent-purple)', borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}>
          {tab === 'config' && <TabConfig />}
          {tab === 'generar' && <TabGenerar />}
          {tab === 'banco' && <TabBanco />}
          {tab === 'preview' && <TabPreview />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Pestaña 1: Configuración ─────────────────────────────────────────────────
function TabConfig() {
  const [config, setConfig] = useState<ConfiguracionTestVARK | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    obtenerConfigVARK().then(setConfig).catch(() => setConfig(null)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true); setMsg(null);
    try {
      const upd = await actualizarConfigVARK({
        modo: config.modo, num_preguntas: config.num_preguntas,
        contexto_tematico: config.contexto_tematico, usar_fallback: config.usar_fallback,
      });
      setConfig(upd);
      setMsg({ ok: true, text: 'Configuración guardada correctamente.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al guardar.' });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner /></div>;
  if (!config) return <p style={{ color: 'var(--danger)' }}>No se pudo cargar la configuración.</p>;

  return (
    <div style={{ ...CARD, padding: '26px 28px', maxWidth: 640 }}>
      <h2 style={ttl}>Modo de aplicación del test</h2>
      <p style={sub}>Define cómo se generan las preguntas cuando un estudiante toma el test.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <Select label="Modo" value={config.modo}
          onChange={(v) => setConfig({ ...config, modo: v as ConfiguracionTestVARK['modo'] })}
          options={[
            { value: 'dinamico_ia', label: 'Dinámico con IA (preguntas distintas cada vez)' },
            { value: 'banco_fijo', label: 'Banco fijo (preguntas aprobadas del banco)' },
          ]} />

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(59,110,248,0.06)', border: '1px solid rgba(59,110,248,0.15)' }}>
          <AlertCircle size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-dm-sans)' }}>
            {config.modo === 'dinamico_ia'
              ? 'La IA (Groq) genera preguntas nuevas en cada aplicación para evitar que se memoricen. Si la IA falla, se usa el respaldo.'
              : 'Se muestrean preguntas del banco oficial que has aprobado. Asegúrate de tener suficientes preguntas activas.'}
          </p>
        </div>

        <Input id="num" label="Número de preguntas (12–20)" type="number"
          value={String(config.num_preguntas)}
          onChange={(e) => setConfig({ ...config, num_preguntas: Number(e.target.value) || 0 })} />

        <div>
          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', display: 'block', marginBottom: 8 }}>
            Contexto temático
          </label>
          <textarea value={config.contexto_tematico}
            onChange={(e) => setConfig({ ...config, contexto_tematico: e.target.value })}
            rows={2} style={textareaStyle} />
        </div>

        <Toggle label="Usar test de respaldo si la IA falla"
          desc="Garantiza que el estudiante siempre pueda responder el test."
          checked={config.usar_fallback}
          onChange={(v) => setConfig({ ...config, usar_fallback: v })} />

        {msg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: msg.ok ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>
            {msg.ok ? <Check size={15} /> : <AlertCircle size={15} />} {msg.text}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={save} loading={saving}><Save size={15} />&nbsp;Guardar configuración</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Pestaña 2: Generar con IA ────────────────────────────────────────────────
function TabGenerar() {
  const [cantidad, setCantidad] = useState(10);
  const [loading, setLoading] = useState(false);
  const [fuente, setFuente] = useState<string | null>(null);
  const [editores, setEditores] = useState<EditorState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aprobadas, setAprobadas] = useState(0);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  const generar = async () => {
    setLoading(true); setError(null); setFuente(null);
    try {
      const data = await generarPreguntasVARK(cantidad);
      setEditores(data.preguntas.map(candidataAEditor));
      setFuente(data.fuente);
      setAprobadas(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar.');
    } finally { setLoading(false); }
  };

  const aprobar = async (idx: number) => {
    const e = editores[idx];
    if (!editorValido(e)) { setError('Completa el enunciado y las 4 opciones antes de aprobar.'); return; }
    setSavingIdx(idx); setError(null);
    try {
      await crearPreguntaVARK(editorAPayload(e, 'ia'));
      setEditores((prev) => prev.filter((_, i) => i !== idx));
      setAprobadas((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar.');
    } finally { setSavingIdx(null); }
  };

  const descartar = (idx: number) => setEditores((prev) => prev.filter((_, i) => i !== idx));
  const setEd = (idx: number, patch: Partial<EditorState>) =>
    setEditores((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  return (
    <div>
      <div style={{ ...CARD, padding: '20px 24px', marginBottom: 18, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 200 }}>
          <Input id="cantidad" label="Cantidad de preguntas" type="number"
            value={String(cantidad)} onChange={(e) => setCantidad(Number(e.target.value) || 0)} />
        </div>
        <Button variant="primary" onClick={generar} loading={loading}>
          <Wand2 size={15} />&nbsp;Generar con IA
        </Button>
        {fuente && (
          <Badge variant={fuente === 'groq' ? 'success' : 'warning'}>
            {fuente === 'groq' ? 'Generado por IA (Groq)' : 'Respaldo estático (IA no disponible)'}
          </Badge>
        )}
        {aprobadas > 0 && <Badge variant="info">{aprobadas} aprobada(s)</Badge>}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 14, fontFamily: 'var(--font-dm-sans)' }}>{error}</p>}

      {editores.length === 0 && !loading && (
        <div style={{ ...CARD, padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={34} strokeWidth={1.2} />
          <p style={{ marginTop: 12, fontFamily: 'var(--font-dm-sans)' }}>
            Genera preguntas con IA, revísalas/edítalas y aprueba las que quieras añadir al banco oficial.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {editores.map((e, idx) => (
          <motion.div key={idx} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
                Candidata #{idx + 1}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" onClick={() => descartar(idx)}><X size={14} />&nbsp;Descartar</Button>
                <Button variant="primary" onClick={() => aprobar(idx)} loading={savingIdx === idx}>
                  <Check size={14} />&nbsp;Aprobar
                </Button>
              </div>
            </div>
            <EditorPregunta value={e} onChange={(patch) => setEd(idx, patch)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Pestaña 3: Banco de preguntas ────────────────────────────────────────────
function TabBanco() {
  const [items, setItems] = useState<PreguntaVARKAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState>(EDITOR_VACIO);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [delItem, setDelItem] = useState<PreguntaVARKAdmin | null>(null);

  const cargar = () => {
    setLoading(true);
    listarBancoVARK().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const openNuevo = () => { setEditId(null); setEditor(EDITOR_VACIO); setFormErr(null); setModalOpen(true); };
  const openEditar = (p: PreguntaVARKAdmin) => { setEditId(p.id); setEditor(preguntaAEditor(p)); setFormErr(null); setModalOpen(true); };

  const guardar = async () => {
    if (!editorValido(editor)) { setFormErr('Completa el enunciado y las 4 opciones.'); return; }
    setSaving(true); setFormErr(null);
    try {
      if (editId) {
        const upd = await actualizarPreguntaVARK(editId, editorAPayload(editor, 'manual'));
        setItems((prev) => prev.map((p) => (p.id === editId ? upd : p)));
      } else {
        const creada = await crearPreguntaVARK(editorAPayload(editor, 'manual'));
        setItems((prev) => [creada, ...prev]);
      }
      setModalOpen(false);
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const desactivar = async () => {
    if (!delItem) return;
    try { await desactivarPreguntaVARK(delItem.id); } catch { /* optimista */ }
    setItems((prev) => prev.map((p) => (p.id === delItem.id ? { ...p, activo: false } : p)));
    setDelItem(null);
  };

  const activas = items.filter((p) => p.activo).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge variant="success">{activas} activas</Badge>
          <Badge variant="default">{items.length} en total</Badge>
        </div>
        <Button variant="primary" onClick={openNuevo}><Plus size={15} />&nbsp;Nueva pregunta</Button>
      </div>

      {loading ? (
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
      ) : items.length === 0 ? (
        <div style={{ ...CARD, padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Database size={34} strokeWidth={1.2} />
          <p style={{ marginTop: 12, fontFamily: 'var(--font-dm-sans)' }}>
            El banco está vacío. Crea preguntas manualmente o aprueba candidatas desde &ldquo;Generar con IA&rdquo;.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((p) => (
            <div key={p.id} style={{ ...CARD, padding: '14px 18px', opacity: p.activo ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.4 }}>
                    {p.enunciado}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[...p.opciones].sort((a, b) => ESTILOS.indexOf(a.estilo) - ESTILOS.indexOf(b.estilo)).map((o) => (
                      <span key={o.estilo} title={o.texto} style={{
                        fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        color: ESTILO_COLOR[o.estilo], background: `${ESTILO_COLOR[o.estilo]}1a`,
                        border: `1px solid ${ESTILO_COLOR[o.estilo]}40`, fontFamily: 'var(--font-dm-sans)',
                      }}>{o.estilo}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Badge variant={p.origen === 'ia' ? 'vark-a' : 'default'} size="sm">{p.origen === 'ia' ? 'IA' : 'Manual'}</Badge>
                  {!p.activo && <Badge variant="danger" size="sm">Inactiva</Badge>}
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => openEditar(p)} title="Editar"
                    style={iconBtn('var(--text-secondary)')}><Edit2 size={14} /></motion.button>
                  {p.activo && (
                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setDelItem(p)} title="Desactivar"
                      style={iconBtn('var(--danger)')}><Trash2 size={14} /></motion.button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar pregunta' : 'Nueva pregunta'} maxWidth={580}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <EditorPregunta value={editor} onChange={(patch) => setEditor((e) => ({ ...e, ...patch }))} />
          {formErr && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>{formErr}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={guardar} loading={saving}>{editId ? 'Guardar' : 'Crear'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!delItem} onClose={() => setDelItem(null)} title="Desactivar pregunta" maxWidth={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 'var(--radius-md)', background: 'rgba(255,82,82,0.07)', border: '1px solid rgba(255,82,82,0.2)' }}>
            <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6 }}>
              La pregunta dejará de usarse en el test. Puedes reactivarla editándola más adelante.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={() => setDelItem(null)}>Cancelar</Button>
            <Button variant="danger" onClick={desactivar}><Trash2 size={14} />&nbsp;Desactivar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Pestaña 4: Vista previa ──────────────────────────────────────────────────
function TabPreview() {
  const [data, setData] = useState<PreviewTestVARKResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true); setError(null);
    try { setData(await previewTestVARK()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error al generar la vista previa.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ ...CARD, padding: '18px 22px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1, minWidth: 200, fontFamily: 'var(--font-dm-sans)' }}>
          Genera un test de ejemplo tal como lo recibiría un estudiante (según la configuración actual). El estilo de cada opción se muestra solo aquí, para tu revisión.
        </p>
        <Button variant="primary" onClick={cargar} loading={loading}><RefreshCw size={15} />&nbsp;Generar vista previa</Button>
        {data && (
          <Badge variant={data.fuente === 'groq' ? 'success' : data.fuente === 'banco' ? 'info' : 'warning'}>
            Fuente: {data.fuente === 'groq' ? 'IA (Groq)' : data.fuente === 'banco' ? 'Banco fijo' : 'Respaldo estático'}
          </Badge>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 14, fontFamily: 'var(--font-dm-sans)' }}>{error}</p>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.preguntas.map((p, i) => (
            <div key={i} style={{ ...CARD, padding: '16px 20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)' }}>
                <span style={{ color: 'var(--accent-purple)' }}>{i + 1}.</span> {p.enunciado}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.opciones.map((o) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                    <span style={{
                      flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, width: 22, height: 22, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: ESTILO_COLOR[o.estilo], background: `${ESTILO_COLOR[o.estilo]}1a`, border: `1px solid ${ESTILO_COLOR[o.estilo]}40`,
                    }}>{o.estilo}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}>{o.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Editor reutilizable de pregunta (enunciado + 4 estilos) ──────────────────
function EditorPregunta({ value, onChange }: { value: EditorState; onChange: (patch: Partial<EditorState>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={editorLabel}>Enunciado</label>
        <textarea value={value.enunciado} onChange={(e) => onChange({ enunciado: e.target.value })}
          rows={2} style={textareaStyle} placeholder="¿Cómo prefieres aprender un nuevo concepto de programación?" />
      </div>
      {ESTILOS.map((est) => (
        <div key={est}>
          <label style={{ ...editorLabel, color: ESTILO_COLOR[est] }}>
            Opción {ESTILO_LABEL[est]} ({est})
          </label>
          <textarea value={value[est]} onChange={(e) => onChange({ [est]: e.target.value } as Partial<EditorState>)}
            rows={2} style={{ ...textareaStyle, borderColor: `${ESTILO_COLOR[est]}33` }}
            placeholder={`Respuesta orientada a ${ESTILO_LABEL[est].toLowerCase()}`} />
        </div>
      ))}
    </div>
  );
}

// ─── Toggle simple ────────────────────────────────────────────────────────────
function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} style={{
        flexShrink: 0, width: 44, height: 24, borderRadius: 99, cursor: 'pointer', position: 'relative',
        background: checked ? 'var(--accent-blue)' : 'rgba(255,255,255,0.12)',
        border: '1px solid var(--border-glass)', transition: 'background 0.2s',
      }}>
        <motion.div animate={{ x: checked ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ position: 'absolute', top: 2, left: 0, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
      </button>
    </div>
  );
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────
const ttl: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' };
const sub: React.CSSProperties = { margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' };
const editorLabel: React.CSSProperties = { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', display: 'block', marginBottom: 6, color: 'var(--text-muted)' };
const textareaStyle: React.CSSProperties = {
  width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 'var(--radius-md)',
  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)',
  fontSize: '0.85rem', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', lineHeight: 1.5, outline: 'none',
};
function iconBtn(color: string): React.CSSProperties {
  return { background: 'none', border: 'none', cursor: 'pointer', color, display: 'flex', alignItems: 'center', padding: 5, borderRadius: 5 };
}
