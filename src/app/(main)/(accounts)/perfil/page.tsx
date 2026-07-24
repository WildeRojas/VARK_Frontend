'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, GraduationCap, KeyRound, Trash2, Save, CheckCircle2, AlertCircle, Image as ImageIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useAuth, type Rol } from '@/lib/auth/AuthContext';
import { actualizarMiPerfil, cambiarMiPassword, eliminarMiCuenta } from '@/lib/api/accounts';

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card), inset 0 1px 0 var(--glass-highlight)',
};
const PAGE = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const ROL_LABEL: Record<Rol, string> = { administrador: 'Administrador', docente: 'Docente', estudiante: 'Estudiante' };
const ROL_BADGE: Record<Rol, 'vark-v' | 'vark-a' | 'success'> = { estudiante: 'vark-v', docente: 'vark-a', administrador: 'success' };

export default function PerfilPage() {
  const { user, loading, refresh, logout } = useAuth();
  const rol = (user?.rol ?? 'estudiante') as Rol;
  const esEstudiante = rol === 'estudiante';

  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', foto: '', carrera: '', semestre: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Cambiar contraseña
  const [pwModal, setPwModal] = useState(false);
  const [pwActual, setPwActual] = useState('');
  const [pwNueva, setPwNueva] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Eliminar cuenta
  const [delModal, setDelModal] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre, apellido: user.apellido, email: user.email,
        foto: user.foto ?? '', carrera: user.carrera ?? '', semestre: user.semestre ?? '',
      });
    }
  }, [user]);

  if (loading || !user) {
    return <div style={{ ...CARD, padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</div>;
  }

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await actualizarMiPerfil({
        nombre: form.nombre.trim(), apellido: form.apellido.trim(), email: form.email.trim(),
        foto: form.foto.trim(), carrera: form.carrera.trim(), semestre: form.semestre.trim(),
      });
      await refresh();
      setMsg({ ok: true, text: 'Perfil actualizado correctamente.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al guardar.' });
    } finally { setSaving(false); }
  };

  const handleChangePw = async () => {
    if (pwNueva.length < 8) { setPwMsg({ ok: false, text: 'La nueva contraseña debe tener al menos 8 caracteres.' }); return; }
    try {
      await cambiarMiPassword(pwActual, pwNueva);
      setPwMsg({ ok: true, text: '✓ Contraseña actualizada.' });
      setTimeout(() => { setPwModal(false); setPwActual(''); setPwNueva(''); setPwMsg(null); }, 1400);
    } catch (e) { setPwMsg({ ok: false, text: e instanceof Error ? e.message : 'Error.' }); }
  };

  const handleDelete = async () => {
    try { await eliminarMiCuenta(); } catch { /* igual cerramos sesión */ }
    await logout();
  };

  const iniciales = (user.nombre[0] ?? '') + (user.apellido[0] ?? '');

  return (
    <motion.div variants={PAGE} initial="hidden" animate="visible" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
        Mi <span style={{ color: 'var(--accent-blue)' }}>perfil</span>
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Administra tu información y seguridad</p>

      {/* Cabecera con avatar */}
      <div style={{ ...CARD, padding: '24px 26px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: form.foto ? `url(${form.foto}) center/cover` : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-syne), Syne, sans-serif',
        }}>
          {!form.foto && iniciales}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-syne), Syne, sans-serif' }}>{user.nombre_completo}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge variant={ROL_BADGE[rol]} size="sm">{ROL_LABEL[rol]}</Badge>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</span>
          </div>
        </div>
      </div>

      {/* Datos editables */}
      <div style={{ ...CARD, padding: '24px 26px', marginBottom: 20 }}>
        <h2 style={ttl}>Datos personales</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
          <Input id="nombre" label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} icon={<User size={14} />} />
          <Input id="apellido" label="Apellido" value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} icon={<User size={14} />} />
          <Input id="email" label="Correo" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} icon={<Mail size={14} />} />
          <Input id="foto" label="URL de foto (opcional)" value={form.foto} onChange={(e) => setForm((f) => ({ ...f, foto: e.target.value }))} icon={<ImageIcon size={14} />} />
          {esEstudiante && (
            <>
              <Input id="carrera" label="Carrera" value={form.carrera} onChange={(e) => setForm((f) => ({ ...f, carrera: e.target.value }))} icon={<GraduationCap size={14} />} />
              <Input id="semestre" label="Semestre" value={form.semestre} onChange={(e) => setForm((f) => ({ ...f, semestre: e.target.value }))} />
            </>
          )}
        </div>
        {msg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: '0.82rem', color: msg.ok ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>
            {msg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {msg.text}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="primary" onClick={handleSave} loading={saving}><Save size={15} />&nbsp;Guardar cambios</Button>
        </div>
      </div>

      {/* Seguridad */}
      <div style={{ ...CARD, padding: '24px 26px' }}>
        <h2 style={ttl}>Seguridad y cuenta</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingBottom: 16, borderBottom: '1px solid var(--border-glass)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)' }}>Contraseña</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>Cambia tu contraseña de acceso</p>
          </div>
          <Button variant="outline" onClick={() => { setPwModal(true); setPwMsg(null); }}><KeyRound size={14} />&nbsp;Cambiar</Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>Eliminar cuenta</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>Tu cuenta se desactivará y cerrarás sesión</p>
          </div>
          <Button variant="danger" onClick={() => setDelModal(true)}><Trash2 size={14} />&nbsp;Eliminar</Button>
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Cambiar contraseña" maxWidth={440}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input id="pwactual" label="Contraseña actual" type="password" value={pwActual} onChange={(e) => setPwActual(e.target.value)} />
          <Input id="pwnueva" label="Nueva contraseña (mín. 8)" type="password" value={pwNueva} onChange={(e) => setPwNueva(e.target.value)} />
          {pwMsg && <p style={{ margin: 0, fontSize: '0.8rem', color: pwMsg.ok ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-dm-sans)' }}>{pwMsg.text}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={() => setPwModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleChangePw}><KeyRound size={14} />&nbsp;Actualizar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal eliminar cuenta */}
      <Modal open={delModal} onClose={() => setDelModal(false)} title="Eliminar mi cuenta" maxWidth={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 'var(--radius-md)', background: 'rgba(255,82,82,0.07)', border: '1px solid rgba(255,82,82,0.2)' }}>
            <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.6 }}>
              Tu cuenta se desactivará y se cerrará tu sesión. Para reactivarla, contacta a un administrador.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onClick={() => setDelModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}><Trash2 size={14} />&nbsp;Eliminar cuenta</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

const ttl: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' };
