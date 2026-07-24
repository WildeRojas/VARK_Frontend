'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, X, Edit2, KeyRound, UserX, Eye, AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select, { SelectOption } from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import {
  listarUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, resetPasswordUsuario,
} from '@/lib/api/accounts';
import type { UsuarioAdmin, RolUsuario } from '@/lib/api/types';

const ROL_OPTS: SelectOption[] = [
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'docente', label: 'Docente' },
  { value: 'administrador', label: 'Administrador' },
];
const ROL_BADGE: Record<RolUsuario, 'vark-v' | 'vark-a' | 'success'> = {
  estudiante: 'vark-v', docente: 'vark-a', administrador: 'success',
};
const ROL_LABEL: Record<RolUsuario, string> = {
  estudiante: 'Estudiante', docente: 'Docente', administrador: 'Administrador',
};

const PAGE = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const ROW = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } };
const CONTAINER = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

interface FormState { email: string; nombre: string; apellido: string; rol: string; password: string }
const EMPTY: FormState = { email: '', nombre: '', apellido: '', rol: 'estudiante', password: '' };

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset password
  const [resetUser, setResetUser] = useState<UsuarioAdmin | null>(null);
  const [newPass, setNewPass] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Desactivar
  const [deactivateUser, setDeactivateUser] = useState<UsuarioAdmin | null>(null);

  const cargar = () => {
    setLoading(true);
    listarUsuarios()
      .then(setUsuarios)
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (q && !u.nombre_completo.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (filtroRol && u.rol !== filtroRol) return false;
      if (filtroEstado === 'activo' && !u.is_active) return false;
      if (filtroEstado === 'inactivo' && u.is_active) return false;
      return true;
    });
  }, [usuarios, buscar, filtroRol, filtroEstado]);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setFormErr(null); setModalOpen(true); };
  const openEdit = (u: UsuarioAdmin) => {
    setEditId(u.id);
    setForm({ email: u.email, nombre: u.nombre, apellido: u.apellido, rol: u.rol, password: '' });
    setFormErr(null); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.email.trim() || !form.nombre.trim() || !form.apellido.trim()) {
      setFormErr('Email, nombre y apellido son obligatorios.'); return;
    }
    setSaving(true); setFormErr(null);
    try {
      if (editId) {
        const upd = await actualizarUsuario(editId, {
          email: form.email.trim(), nombre: form.nombre.trim(), apellido: form.apellido.trim(), rol: form.rol as RolUsuario,
        });
        setUsuarios((prev) => prev.map((u) => (u.id === editId ? upd : u)));
      } else {
        const created = await crearUsuario({
          email: form.email.trim(), nombre: form.nombre.trim(), apellido: form.apellido.trim(),
          rol: form.rol as RolUsuario, password: form.password || undefined,
        });
        setUsuarios((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!resetUser || newPass.length < 8) { setResetMsg('Mínimo 8 caracteres.'); return; }
    try {
      await resetPasswordUsuario(resetUser.id, newPass);
      setResetMsg('✓ Contraseña restablecida.');
      setTimeout(() => { setResetUser(null); setNewPass(''); setResetMsg(null); }, 1400);
    } catch (e) { setResetMsg(e instanceof Error ? e.message : 'Error.'); }
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    try { await desactivarUsuario(deactivateUser.id); } catch { /* optimista */ }
    setUsuarios((prev) => prev.map((u) => (u.id === deactivateUser.id ? { ...u, is_active: false } : u)));
    setDeactivateUser(null);
  };

  return (
    <motion.div variants={PAGE} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--radius-md)',
            background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)',
          }}>
            <Users size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              Gestión de <span style={{ color: 'var(--accent-blue)' }}>usuarios</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estudiantes, docentes y administradores</p>
          </div>
          <Badge variant="info">{filtrados.length}</Badge>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={15} />&nbsp;Nuevo usuario</Button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 260px', maxWidth: 360 }}>
          <Input id="buscar" label="Buscar por nombre o correo..." value={buscar}
            onChange={(e) => setBuscar(e.target.value)} icon={<Search size={14} />} />
        </div>
        <div style={{ width: 200 }}>
          <Select label="Rol" options={ROL_OPTS} value={filtroRol} onChange={setFiltroRol} nullable nullLabel="Todos los roles" />
        </div>
        <div style={{ width: 180 }}>
          <Select label="Estado" options={[{ value: 'activo', label: 'Activos' }, { value: 'inactivo', label: 'Inactivos' }]}
            value={filtroEstado} onChange={setFiltroEstado} nullable nullLabel="Todos" />
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.3fr 130px 100px 130px',
          padding: '12px 20px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)',
        }}>
          {['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'].map((c) => (
            <span key={c} style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>{c}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={36} strokeWidth={1.2} />
            <p style={{ marginTop: 12, fontFamily: 'var(--font-dm-sans)' }}>No hay usuarios con esos filtros</p>
          </div>
        ) : (
          <motion.div variants={CONTAINER} initial="hidden" animate="visible">
            {filtrados.map((u, idx) => (
              <motion.div key={u.id} variants={ROW}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1.3fr 130px 100px 130px',
                  padding: '13px 20px', alignItems: 'center',
                  borderBottom: idx < filtrados.length - 1 ? '1px solid var(--border-glass)' : 'none',
                  opacity: u.is_active ? 1 : 0.5,
                }}>
                {/* Nombre + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-dm-sans)',
                  }}>
                    {(u.nombre[0] ?? '') + (u.apellido[0] ?? '')}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.nombre_completo}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                <div><Badge variant={ROL_BADGE[u.rol]} size="sm">{ROL_LABEL[u.rol]}</Badge></div>
                <div><Badge variant={u.is_active ? 'success' : 'danger'} size="sm">{u.is_active ? 'Activo' : 'Inactivo'}</Badge></div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {u.rol === 'estudiante' && (
                    <ActionBtn title="Ver perfil 360°" color="var(--accent-cyan)" onClick={() => router.push(`/admin/estudiantes/${u.id}`)}><Eye size={14} /></ActionBtn>
                  )}
                  <ActionBtn title="Editar" color="var(--text-secondary)" onClick={() => openEdit(u)}><Edit2 size={14} /></ActionBtn>
                  <ActionBtn title="Restablecer contraseña" color="var(--warning)" onClick={() => { setResetUser(u); setNewPass(''); setResetMsg(null); }}><KeyRound size={14} /></ActionBtn>
                  {u.is_active && (
                    <ActionBtn title="Desactivar" color="var(--danger)" onClick={() => setDeactivateUser(u)}><UserX size={14} /></ActionBtn>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar usuario' : 'Nuevo usuario'} maxWidth={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input id="nombre" label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <Input id="apellido" label="Apellido" value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} />
          <Input id="email" label="Correo" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Select label="Rol" options={ROL_OPTS} value={form.rol} onChange={(v) => setForm((f) => ({ ...f, rol: v }))} />
          {!editId && (
            <Input id="password" label="Contraseña (opcional, por defecto cambiar123)" type="password"
              value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          )}
          {formErr && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>{formErr}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{editId ? 'Guardar' : 'Crear'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal reset password */}
      <Modal open={!!resetUser} onClose={() => setResetUser(null)} title="Restablecer contraseña" maxWidth={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}>
            Nueva contraseña para <strong style={{ color: 'var(--text-primary)' }}>{resetUser?.nombre_completo}</strong>
          </p>
          <Input id="newpass" label="Nueva contraseña (mín. 8)" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          {resetMsg && <p style={{ margin: 0, fontSize: '0.8rem', color: resetMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>{resetMsg}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={() => setResetUser(null)}>Cancelar</Button>
            <Button variant="primary" onClick={handleReset}><KeyRound size={14} />&nbsp;Restablecer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal desactivar */}
      <Modal open={!!deactivateUser} onClose={() => setDeactivateUser(null)} title="Desactivar usuario" maxWidth={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 'var(--radius-md)', background: 'rgba(255,82,82,0.07)', border: '1px solid rgba(255,82,82,0.2)' }}>
            <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{deactivateUser?.nombre_completo}</strong> ya no podrá iniciar sesión. Puedes reactivarlo editándolo.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={() => setDeactivateUser(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeactivate}><UserX size={14} />&nbsp;Desactivar</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function ActionBtn({ children, onClick, title, color }: { children: React.ReactNode; onClick: () => void; title: string; color: string }) {
  return (
    <motion.button onClick={onClick} title={title} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color, display: 'flex', alignItems: 'center', padding: 5, borderRadius: 5 }}>
      {children}
    </motion.button>
  );
}
