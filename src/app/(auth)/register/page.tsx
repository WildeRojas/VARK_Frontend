'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { registro as registroService } from '@/lib/api/accounts';
import { login as loginService } from '@/lib/api/accounts';
import { setTokens } from '@/lib/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = 'estudiante' | 'docente' | '';

interface FormState {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  teacherCode: string;
}

interface FormErrors {
  name?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  teacherCode?: string;
  server?: string;
}

// ─── Validators ──────────────────────────────────────────────────────────────
function validateField(field: keyof FormState, value: string, form: FormState): string | undefined {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'El nombre completo es requerido.';
      if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      break;
    case 'lastName':
      if (!value.trim()) return 'El apellido es requerido.';
      if (value.trim().length < 3) return 'El apellido debe tener al menos 3 caracteres.';
      break;
    case 'email':
      if (!value.trim()) return 'El correo electrónico es requerido.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo válido.';
      break;
    case 'password':
      if (!value) return 'La contraseña es requerida.';
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
      break;
    case 'confirmPassword':
      if (!value) return 'Confirma tu contraseña.';
      if (value !== form.password) return 'Las contraseñas no coinciden.';
      break;
    case 'role':
      if (!value) return 'Selecciona un rol.';
      break;
    // case 'teacherCode':
    //   if (form.role === 'docente' && !value.trim()) return 'El código de docente es requerido.';
    //   break;
  }
  return undefined;
}

// ─── Animation variants ───────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Role selector button ────────────────────────────────────────────────────
function RoleButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        flex: 1,
        padding: '14px 12px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
        background: active ? 'rgba(59,110,248,0.12)' : 'var(--bg-glass)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        boxShadow: active ? '0 0 16px rgba(59,110,248,0.2)' : 'none',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          fontWeight: 600,
          color: active ? 'var(--accent-blue)' : 'var(--text-primary)',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        }}
      >
        {description}
      </p>
    </motion.button>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    teacherCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value, { ...form, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: error }));

      // Re-validate confirmPassword if password changes
      if (field === 'password' && touched.confirmPassword) {
        const confirmError = validateField('confirmPassword', form.confirmPassword, {
          ...form,
          [field]: value,
        });
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }
  };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field], form);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleRoleSelect = (role: Role) => {
    setForm((prev) => ({ ...prev, role, teacherCode: '' }));
    setTouched((prev) => ({ ...prev, role: true }));
    setErrors((prev) => ({ ...prev, role: undefined, teacherCode: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const fieldsToValidate: (keyof FormState)[] = [
      'name','lastName', 'email', 'password', 'confirmPassword', 'role',
    ];
    if (form.role === 'docente') fieldsToValidate.push('teacherCode');

    const newErrors: FormErrors = {};
    fieldsToValidate.forEach((field) => {
      const error = validateField(field, form[field], form);
      if (error) newErrors[field] = error;
    });

    setTouched(Object.fromEntries(fieldsToValidate.map((f) => [f, true])));
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, server: undefined }));

    try {
      // Split name into nombre + apellido (first word / rest)
      // const nameTrimmed = form.name.trim();
      // const spaceIdx = nameTrimmed.indexOf(' ');
      // const nombre = spaceIdx === -1 ? nameTrimmed : nameTrimmed.slice(0, spaceIdx);
      // const apellido = spaceIdx === -1 ? '' : nameTrimmed.slice(spaceIdx + 1);

      await registroService({
        email: form.email.trim().toLowerCase(),
        nombre: form.name.trim(),
        apellido: form.lastName.trim(),
        rol: form.role as 'estudiante' | 'docente',
        password: form.password,
      });

      // Auto-login after successful registration
      const loginData = await loginService({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setTokens(loginData.access, loginData.refresh);

      router.push('/test-vark');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.';
      setErrors((prev) => ({ ...prev, server: message }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{
        width: '100%',
        maxWidth: 460,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: 28 }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(59,110,248,0.15)',
            border: '1px solid rgba(59,110,248,0.3)',
            marginBottom: 12,
          }}
        >
          <ShieldCheck size={24} color="var(--accent-blue)" />
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.75rem',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          Únete a{' '}
          <span style={{ color: 'var(--accent-blue)' }}>VARK</span>
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          }}
        >
          Crea tu cuenta y descubre tu estilo de aprendizaje
        </p>
      </motion.div>

      {/* Card */}
      <div
        className="glass-card"
        style={{ padding: '32px 28px' }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Nombre completo */}
            <motion.div variants={itemVariants}>
              <Input
                id="name"
                label="Nombre completo"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name ? errors.name : undefined}
                icon={<User size={16} />}
              />
            </motion.div>

            {/* Apellido */}
            <motion.div variants={itemVariants}>
              <Input
                id="lastName"
                label="Apellidos"
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={handleChange('lastName')}
                onBlur={handleBlur('lastName')}
                error={touched.lastName ? errors.lastName : undefined}
                icon={<User size={16} />}
              />
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email ? errors.email : undefined}
                icon={<Mail size={16} />}
              />
            </motion.div>

            {/* Contraseña */}
            <motion.div variants={itemVariants}>
              <Input
                id="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                icon={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </motion.div>

            {/* Confirmar contraseña */}
            <motion.div variants={itemVariants}>
              <Input
                id="confirmPassword"
                label="Confirmar contraseña"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                icon={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </motion.div>

            {/* Selector de rol */}
            <motion.div variants={itemVariants}>
              <p
                style={{
                  margin: '0 0 10px 2px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: errors.role && touched.role ? 'var(--danger)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Selecciona tu rol
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <RoleButton
                  label="Estudiante"
                  description="Aprendo con recursos adaptativos"
                  active={form.role === 'estudiante'}
                  onClick={() => handleRoleSelect('estudiante')}
                />
                <RoleButton
                  label="Docente"
                  description="Gestiono contenido y estudiantes"
                  active={form.role === 'docente'}
                  onClick={() => handleRoleSelect('docente')}
                />
              </div>
              <AnimatePresence>
                {errors.role && touched.role && (
                  <motion.p
                    key="role-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      margin: '4px 0 0 4px',
                      fontSize: '0.75rem',
                      color: 'var(--danger)',
                      fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                    }}
                  >
                    {errors.role}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Campo de código docente — aparece animado */}
            <AnimatePresence>
              {form.role === 'docente' && (
                <motion.div
                  key="teacher-code"
                  initial={{ opacity: 0, height: 0, marginTop: -8 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: -8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <Input
                    id="teacherCode"
                    label="Código de docente"
                    type="text"
                    value={form.teacherCode}
                    onChange={handleChange('teacherCode')}
                    onBlur={handleBlur('teacherCode')}
                    error={touched.teacherCode ? errors.teacherCode : undefined}
                    icon={<ShieldCheck size={16} />}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error de servidor */}
            <AnimatePresence>
              {errors.server && (
                <motion.div
                  key="server-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,82,82,0.1)',
                    border: '1px solid rgba(255,82,82,0.3)',
                    color: 'var(--danger)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  }}
                >
                  {errors.server}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón submit */}
            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
                style={{ marginTop: 4 }}
              >
                Crear cuenta
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </div>

      {/* Link a login */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        }}
      >
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          style={{
            color: 'var(--accent-blue)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Iniciar sesión
        </Link>
      </motion.p>
    </motion.div>
  );
}
