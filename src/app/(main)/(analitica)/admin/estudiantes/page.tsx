'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Search, ArrowUpRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { listarUsuarios } from '@/lib/api/accounts';
import type { UsuarioAdmin } from '@/lib/api/types';

const CARD: React.CSSProperties = {
  background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};
const PAGE = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const CONTAINER = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const ITEM = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function EstudiantesPage() {
  const router = useRouter();
  const [estudiantes, setEstudiantes] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    let mounted = true;
    listarUsuarios({ rol: 'estudiante' })
      .then((d) => { if (mounted) setEstudiantes(d); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter((e) => e.nombre_completo.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
  }, [estudiantes, buscar]);

  return (
    <motion.div variants={PAGE} initial="hidden" animate="visible">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 'var(--radius-md)',
          background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)',
        }}>
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-syne), Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            Estudiantes
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selecciona un estudiante para ver toda su actividad</p>
        </div>
        <Badge variant="info">{filtrados.length}</Badge>
      </div>

      <div style={{ maxWidth: 380, margin: '18px 0 22px' }}>
        <Input id="buscar" label="Buscar estudiante..." value={buscar} onChange={(e) => setBuscar(e.target.value)} icon={<Search size={14} />} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : (
        <motion.div variants={CONTAINER} initial="hidden" animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtrados.map((e) => (
            <motion.div key={e.id} variants={ITEM} whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 22px rgba(59,110,248,0.16)' }}
              onClick={() => router.push(`/admin/estudiantes/${e.id}`)}
              style={{ ...CARD, padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-dm-sans)',
              }}>
                {(e.nombre[0] ?? '') + (e.apellido[0] ?? '')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.nombre_completo}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</p>
                {!e.is_active && <Badge variant="danger" size="sm">Inactivo</Badge>}
              </div>
              <ArrowUpRight size={16} color="var(--text-muted)" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
