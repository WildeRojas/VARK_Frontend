'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { login as loginService } from '@/lib/api/accounts';
import { setTokens } from '@/lib/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  server?: string;
}

// ─── Validators ──────────────────────────────────────────────────────────────
function validateField(field: keyof FormState, value: string): string | undefined {
  switch (field) {
    case 'email':
      if (!value.trim()) return 'El correo electrónico es requerido.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo válido.';
      break;
    case 'password':
      if (!value) return 'La contraseña es requerida.';
      break;
  }
  return undefined;
}

// ─── Animation variants ───────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};


// ─── Page Component ───────────────────────────────────────────────────────────

// ─── Page Component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error, server: undefined }));
    }
  };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = (): boolean => {
    return !validateField('email', form.email) && !validateField('password', form.password);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Touch all fields to show any pending errors
    setTouched({ email: true, password: true });
    const emailErr = validateField('email', form.email);
    const passwordErr = validateField('password', form.password);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const data = await loginService({ email: form.email, password: form.password });

      setTokens(data.access, data.refresh);
      localStorage.setItem('user', JSON.stringify(data.usuario));

      const role = data.usuario.rol;
      if (role === 'administrador') {
        router.push('/admin/dashboard');
      } else if (!data.vark_completado && role === 'estudiante') {
        router.push('/test-vark');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error del servidor. Intenta de nuevo.';
      setErrors({ server: message });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      style={{ width: '100%', maxWidth: 420 }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo */}
      <motion.div
        variants={itemVariants}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(59,110,248,0.15)',
            border: '1px solid rgba(59,110,248,0.3)',
            marginBottom: 16,
            boxShadow: '0 0 24px rgba(59,110,248,0.2)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 3L4 8.5V19.5L14 25L24 19.5V8.5L14 3Z"
              stroke="var(--accent-blue)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M14 3V25M4 8.5L14 14L24 8.5"
              stroke="var(--accent-cyan)"
              strokeWidth="1.4"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: '1.65rem',
            fontWeight: 800,
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Bienvenido de{' '}
          <span style={{ color: 'var(--accent-blue)' }}>vuelta</span>
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          }}
        >
          Inicia sesión para continuar aprendiendo
        </p>
      </motion.div>

      {/* Card */}
      <div className="glass-card" style={{ padding: '32px 28px' }}>
        <form onSubmit={handleSubmit} noValidate>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Server error banner */}
            <AnimatePresence>
              {errors.server && (
                <motion.div
                  key="server-error"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    marginBottom: 20,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,82,82,0.1)',
                    border: '1px solid rgba(255,82,82,0.3)',
                    color: 'var(--danger)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                    lineHeight: 1.5,
                  }}
                >
                  {errors.server}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <motion.div variants={itemVariants} style={{ marginBottom: 20 }}>
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                autoComplete="email"
                icon={<Mail size={16} />}
                error={errors.email}
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} style={{ marginBottom: 8 }}>
              <Input
                id="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                autoComplete="current-password"
                icon={<Lock size={16} />}
                error={errors.password}
                rightElement={
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                    }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.button>
                }
              />
            </motion.div>

            {/* Forgot password link */}
            <motion.div
              variants={itemVariants}
              style={{ textAlign: 'right', marginBottom: 28 }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                  opacity: 0.85,
                }}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || !isFormValid()}
              >
                Iniciar sesión
              </Button>
            </motion.div>

          </motion.div>
        </form>
      </div>

      {/* Register link */}
      <motion.p
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        }}
      >
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          style={{
            color: 'var(--accent-blue)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Regístrate
        </Link>
      </motion.p>
    </motion.div>
  );
}
