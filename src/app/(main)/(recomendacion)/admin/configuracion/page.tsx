'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, Clock, Filter, FlaskConical,
  Save, CheckCircle2, AlertCircle, Info,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { obtenerConfiguracionMotor, actualizarConfiguracionMotor } from '@/lib/api/recomendacion';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VarkWeights  { V: number; A: number; R: number; K: number }
interface DecayConfig  { speed: number; enabled: boolean }
interface FilterConfig { maxDifficulty: string; onlyApproved: boolean; includeUnrated: boolean }
interface ABConfig     { enabled: boolean; groupBPercent: number }

interface Config {
  vark:    VarkWeights;
  decay:   DecayConfig;
  filter:  FilterConfig;
  ab:      ABConfig;
}

// ─── Mock initial config ──────────────────────────────────────────────────────
const INITIAL_CONFIG: Config = {
  vark:   { V: 40, A: 20, R: 25, K: 15 },
  decay:  { speed: 0.3, enabled: true },
  filter: { maxDifficulty: 'Difícil', onlyApproved: true, includeUnrated: false },
  ab:     { enabled: false, groupBPercent: 30 },
};

// ─── Sections ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'vark',   label: 'Pesos VARK',           icon: Sliders },
  { id: 'decay',  label: 'Decaimiento temporal',  icon: Clock   },
  { id: 'filter', label: 'Filtro de contenido',   icon: Filter  },
  { id: 'ab',     label: 'Experimento A/B',        icon: FlaskConical },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const DIFFICULTY_OPTIONS = [
  { value: 'Fácil',   label: 'Solo fácil'  },
  { value: 'Media',   label: 'Fácil y media' },
  { value: 'Difícil', label: 'Todos los niveles' },
];

// ─── Page variants ────────────────────────────────────────────────────────────
const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const panelVariants = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -8, transition: { duration: 0.18 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Inline slider with label, value display, and color accent */
function VarkSlider({
  label, color, value, onChange,
}: { label: string; color: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: color, flexShrink: 0,
              boxShadow: `0 0 6px ${color}80`,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {label}
          </span>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.2, color }}
          animate={{ scale: 1, color: 'var(--text-primary)' }}
          transition={{ duration: 0.25 }}
          style={{
            fontFamily: 'var(--font-dm-sans)', fontWeight: 700,
            fontSize: '0.95rem', minWidth: 36, textAlign: 'right',
          }}
        >
          {value}%
        </motion.span>
      </div>
      <SliderInput value={value} min={0} max={100} accentColor={color} onChange={onChange} />
    </div>
  );
}

/** Generic slider input styled to match design system */
function SliderInput({
  value, min, max, accentColor = 'var(--accent-blue)', step = 1, onChange,
}: {
  value: number; min: number; max: number;
  accentColor?: string; step?: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
      {/* Track background */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          borderRadius: 999, background: 'var(--border-glass)',
        }}
      />
      {/* Track fill */}
      <div
        style={{
          position: 'absolute', left: 0, height: 4,
          width: `${pct}%`, borderRadius: 999,
          background: accentColor,
          boxShadow: `0 0 8px ${accentColor}70`,
          transition: 'width 0.1s',
        }}
      />
      {/* Native input (transparent, on top) */}
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute', left: 0, right: 0, width: '100%',
          opacity: 0, cursor: 'pointer', height: 20, margin: 0,
          zIndex: 2,
        }}
      />
      {/* Thumb visual */}
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 8px)`,
          width: 16, height: 16,
          borderRadius: '50%',
          background: accentColor,
          border: '2px solid var(--bg-primary)',
          boxShadow: `0 0 8px ${accentColor}90`,
          pointerEvents: 'none',
          transition: 'left 0.1s',
          zIndex: 1,
        }}
      />
    </div>
  );
}

/** Toggle switch */
function Toggle({
  checked, onChange, label, description,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p
          style={{
            margin: 0, fontSize: '0.875rem', fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          }}
        >
          {label}
        </p>
        {description && (
          <p
            style={{
              margin: '3px 0 0', fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <motion.button
        type="button"
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.93 }}
        style={{
          flexShrink: 0,
          width: 44, height: 24,
          borderRadius: 999,
          border: 'none',
          background: checked ? 'var(--accent-blue)' : 'var(--border-glass)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.25s',
          boxShadow: checked ? '0 0 12px rgba(59,110,248,0.4)' : 'none',
        }}
      >
        <motion.span
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'absolute', top: 2,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--text-primary)',
            display: 'block',
          }}
        />
      </motion.button>
    </div>
  );
}

/** Custom select (inline, not from /ui/) */
function InlineSelect({
  label, value, options, onChange, description,
}: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div>
      <p
        style={{
          margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 700,
          color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        }}
      >
        {label}
      </p>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%', padding: '11px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${open ? 'var(--border-active)' : 'var(--border-glass)'}`,
            background: 'var(--bg-glass)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
            fontWeight: 500, cursor: 'pointer',
            textAlign: 'left',
            boxShadow: open ? '0 0 0 3px rgba(59,110,248,0.2)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          {selected?.label ?? '—'}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden', zIndex: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: opt.value === value ? 'rgba(59,110,248,0.12)' : 'none',
                    border: 'none',
                    color: opt.value === value ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem',
                    fontWeight: opt.value === value ? 600 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-glass-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = opt.value === value ? 'rgba(59,110,248,0.12)' : 'none'; }}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {description && (
        <p
          style={{
            margin: '6px 0 0', fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** Section divider */
function SectionDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '4px 0 2px',
      }}
    >
      <span
        style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-dm-sans)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('vark');
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [savedConfig, setSavedConfig] = useState<Config>(INITIAL_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date(Date.now() - 1000 * 60 * 8));

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  // CU-06: Cargar la configuración del motor (mapeamos factor_decaimiento → decay.speed)
  useEffect(() => {
    let mounted = true;
    obtenerConfiguracionMotor()
      .then((cfg) => {
        if (!mounted) return;
        setConfig((prev) => {
          const next = { ...prev, decay: { ...prev.decay, speed: cfg.factor_decaimiento } };
          setSavedConfig(next);
          return next;
        });
      })
      .catch(() => { /* se mantienen los valores por defecto */ });
    return () => { mounted = false; };
  }, []);

  // ─── VARK constraint helper ─────────────────────────────────────────────────
  const varkSum = config.vark.V + config.vark.A + config.vark.R + config.vark.K;

  const updateVark = useCallback((key: keyof VarkWeights, value: number) => {
    setConfig((prev) => ({ ...prev, vark: { ...prev.vark, [key]: value } }));
  }, []);

  // ─── Save handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveState('idle');
    try {
      // CU-06: el modelo del motor solo persiste factor_decaimiento de esta vista.
      await actualizarConfiguracionMotor({ factor_decaimiento: config.decay.speed });
      setSaveState('success');
      setSavedConfig(config);
      setLastSaved(new Date());
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render sections ─────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {

      // ── 1. Pesos VARK ────────────────────────────────────────────────────────
      case 'vark':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h3 style={sectionTitle}>Pesos VARK</h3>
              <p style={sectionDesc}>
                Define la importancia relativa de cada estilo de aprendizaje en el motor de
                recomendación. Los cuatro valores deben sumar exactamente 100.
              </p>
            </div>

            {/* Sum indicator */}
            <motion.div
              animate={{
                borderColor: varkSum === 100
                  ? 'rgba(0,230,118,0.35)'
                  : 'rgba(255,82,82,0.35)',
                background: varkSum === 100
                  ? 'rgba(0,230,118,0.06)'
                  : 'rgba(255,82,82,0.06)',
              }}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {varkSum === 100
                  ? <CheckCircle2 size={16} color="var(--success)" />
                  : <AlertCircle  size={16} color="var(--danger)"  />
                }
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem',
                    color: varkSum === 100 ? 'var(--success)' : 'var(--danger)',
                    fontWeight: 600,
                  }}
                >
                  {varkSum === 100
                    ? 'Los pesos suman correctamente 100'
                    : `Los pesos suman ${varkSum} — deben sumar 100`
                  }
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans)', fontWeight: 800,
                  fontSize: '1.15rem',
                  color: varkSum === 100 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {varkSum}
              </span>
            </motion.div>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <VarkSlider label="Visual"      color="var(--vark-v)" value={config.vark.V} onChange={(v) => updateVark('V', v)} />
              <VarkSlider label="Auditivo"    color="var(--vark-a)" value={config.vark.A} onChange={(v) => updateVark('A', v)} />
              <VarkSlider label="Lectura"     color="var(--vark-r)" value={config.vark.R} onChange={(v) => updateVark('R', v)} />
              <VarkSlider label="Kinestésico" color="var(--vark-k)" value={config.vark.K} onChange={(v) => updateVark('K', v)} />
            </div>

            {/* Info tip */}
            <div style={infoTipStyle}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Ajustar los pesos modifica la función de similitud del motor Content-Based Filtering.
                Un peso mayor prioriza recursos de ese estilo para todos los usuarios.
              </span>
            </div>
          </div>
        );

      // ── 2. Decaimiento temporal ───────────────────────────────────────────────
      case 'decay':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h3 style={sectionTitle}>Decaimiento temporal</h3>
              <p style={sectionDesc}>
                Controla cómo el sistema reduce el peso de las interacciones antiguas al
                recalcular el perfil VARK del estudiante.
              </p>
            </div>

            <Toggle
              checked={config.decay.enabled}
              onChange={(v) => setConfig((p) => ({ ...p, decay: { ...p.decay, enabled: v } }))}
              label="Activar decaimiento temporal"
              description="Cuando está activo, las sesiones más recientes tienen mayor impacto en el perfil que las antiguas."
            />

            <AnimatePresence>
              {config.decay.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '20px 0',
                      borderTop: '1px solid var(--border-glass)',
                      display: 'flex', flexDirection: 'column', gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)' }}>
                          Velocidad de decaimiento
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}>
                          Valor bajo = decaimiento lento · Valor alto = perfil cambia rápido
                        </p>
                      </div>
                      <motion.span
                        key={config.decay.speed}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        style={{
                          fontFamily: 'var(--font-dm-sans)', fontWeight: 800,
                          fontSize: '1.1rem', color: 'var(--accent-cyan)',
                          minWidth: 40, textAlign: 'right',
                        }}
                      >
                        {config.decay.speed.toFixed(1)}
                      </motion.span>
                    </div>
                    <SliderInput
                      value={config.decay.speed * 10}
                      min={1} max={10} step={1}
                      accentColor="var(--accent-cyan)"
                      onChange={(v) =>
                        setConfig((p) => ({ ...p, decay: { ...p.decay, speed: v / 10 } }))
                      }
                    />
                    {/* Scale labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'].map((v) => (
                        <span
                          key={v}
                          style={{
                            fontSize: '0.62rem', color: 'var(--text-muted)',
                            fontFamily: 'var(--font-dm-sans)',
                          }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={infoTipStyle}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                El decaimiento se aplica en el job Celery <code style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem' }}>update_vark_profiles</code>{' '}
                que se ejecuta diariamente. Un valor de 0.3 es el recomendado para cursos semestrales.
              </span>
            </div>
          </div>
        );

      // ── 3. Filtro de contenido ────────────────────────────────────────────────
      case 'filter':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h3 style={sectionTitle}>Filtro de contenido</h3>
              <p style={sectionDesc}>
                Define qué recursos del repositorio son elegibles para ser recomendados a los estudiantes.
              </p>
            </div>

            <InlineSelect
              label="Dificultad máxima recomendada"
              value={config.filter.maxDifficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={(v) => setConfig((p) => ({ ...p, filter: { ...p.filter, maxDifficulty: v } }))}
              description="Los recursos con nivel superior al seleccionado quedan excluidos del motor de recomendación."
            />

            <div
              style={{
                height: 1, background: 'var(--border-glass)',
                margin: '0 0 4px',
              }}
            />

            <Toggle
              checked={config.filter.onlyApproved}
              onChange={(v) => setConfig((p) => ({ ...p, filter: { ...p.filter, onlyApproved: v } }))}
              label="Solo recursos aprobados"
              description="Cuando está activo, solo se recomiendan recursos que han sido validados por un docente o administrador."
            />
            <Toggle
              checked={config.filter.includeUnrated}
              onChange={(v) => setConfig((p) => ({ ...p, filter: { ...p.filter, includeUnrated: v } }))}
              label="Incluir recursos sin valoraciones"
              description="Permite recomendar recursos nuevos que aún no tienen calificaciones de estudiantes."
            />

            <div style={infoTipStyle}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Los filtros se aplican antes del cálculo de similitud. Desactivar "solo aprobados"
                puede exponer recursos sin revisar en producción.
              </span>
            </div>
          </div>
        );

      // ── 4. Experimento A/B ────────────────────────────────────────────────────
      case 'ab':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h3 style={sectionTitle}>Experimento A/B</h3>
                <p style={sectionDesc}>
                  Divide a los estudiantes activos en dos grupos para validar la efectividad
                  del motor de recomendación personalizada.
                </p>
              </div>
              <Badge variant={config.ab.enabled ? 'success' : 'ghost'} size="md">
                {config.ab.enabled ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <Toggle
              checked={config.ab.enabled}
              onChange={(v) => setConfig((p) => ({ ...p, ab: { ...p.ab, enabled: v } }))}
              label="Activar experimento A/B"
              description="El grupo A recibe recomendaciones personalizadas VARK. El grupo B recibe recursos sin personalización."
            />

            <AnimatePresence>
              {config.ab.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      paddingTop: 20,
                      borderTop: '1px solid var(--border-glass)',
                      display: 'flex', flexDirection: 'column', gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)' }}>
                          Porcentaje — Grupo B (Control)
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}>
                          El resto ({100 - config.ab.groupBPercent}%) forma el Grupo A (personalizado)
                        </p>
                      </div>
                      <motion.span
                        key={config.ab.groupBPercent}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        style={{
                          fontFamily: 'var(--font-dm-sans)', fontWeight: 800,
                          fontSize: '1.1rem', color: 'var(--accent-purple)',
                          minWidth: 42, textAlign: 'right',
                        }}
                      >
                        {config.ab.groupBPercent}%
                      </motion.span>
                    </div>
                    <SliderInput
                      value={config.ab.groupBPercent}
                      min={0} max={50} step={5}
                      accentColor="var(--accent-purple)"
                      onChange={(v) =>
                        setConfig((p) => ({ ...p, ab: { ...p.ab, groupBPercent: v } }))
                      }
                    />

                    {/* Group visual breakdown */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {[
                        {
                          label: 'Grupo A',
                          sub: 'Personalizado',
                          pct: 100 - config.ab.groupBPercent,
                          color: 'var(--accent-blue)',
                          bg:   'rgba(59,110,248,0.1)',
                          border: 'rgba(59,110,248,0.3)',
                        },
                        {
                          label: 'Grupo B',
                          sub: 'Control',
                          pct: config.ab.groupBPercent,
                          color: 'var(--accent-purple)',
                          bg:   'rgba(108,99,255,0.1)',
                          border: 'rgba(108,99,255,0.3)',
                        },
                      ].map((g) => (
                        <div
                          key={g.label}
                          style={{
                            flex: 1, padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            background: g.bg,
                            border: `1px solid ${g.border}`,
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '0.72rem', color: g.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-dm-sans)' }}>
                            {g.label}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '1.3rem', fontWeight: 800, color: g.color, fontFamily: 'var(--font-syne), Syne, sans-serif' }}>
                            {g.pct}%
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>
                            {g.sub}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={infoTipStyle}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                La asignación de grupos es aleatoria y persiste durante toda la duración del experimento.
                Los resultados se comparan en el módulo de Reportes (CU-20).
              </span>
            </div>
          </div>
        );
    }
  };

  // ─── Layout ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: 1040, margin: '0 auto' }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontWeight: 700, fontSize: '1.5rem',
            color: 'var(--text-primary)', margin: 0,
          }}
        >
          Configuración del{' '}
          <span style={{ color: 'var(--accent-blue)' }}>motor</span>
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}>
          Parámetros del sistema de recomendación adaptativa · Solo Admin
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: vertical tabs ──────────────────────────────────────────── */}
        <div
          className="glass-card"
          style={{ padding: '8px', position: 'sticky', top: 'calc(var(--topbar-height) + 20px)' }}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 13px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none', cursor: 'pointer',
                    background: 'none',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                    fontSize: '0.84rem', fontWeight: isActive ? 600 : 400,
                    transition: 'color 0.2s',
                    width: '100%', textAlign: 'left',
                    zIndex: 1,
                  }}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      style={{
                        position: 'absolute', inset: 0,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(59,110,248,0.12)',
                        border: '1px solid rgba(59,110,248,0.22)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={15}
                    color={isActive ? 'var(--accent-blue)' : 'var(--text-muted)'}
                    style={{ flexShrink: 0, transition: 'color 0.2s' }}
                  />
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: section content + save bar ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Content card */}
          <div className="glass-card" style={{ padding: '28px 28px 24px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Save bar */}
          <div
            className="glass-card"
            style={{
              padding: '14px 20px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AnimatePresence mode="wait">
                {saveState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                  >
                    <CheckCircle2 size={15} color="var(--success)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                      Configuración guardada
                    </span>
                  </motion.div>
                ) : saveState === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                  >
                    <AlertCircle size={15} color="var(--danger)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                      Error al guardar
                    </span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" exit={{ opacity: 0 }}>
                    {lastSaved && (
                      <span
                        style={{
                          fontSize: '0.78rem', color: 'var(--text-muted)',
                          fontFamily: 'var(--font-dm-sans)',
                        }}
                      >
                        Último guardado:{' '}
                        {lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {lastSaved.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isDirty && saveState === 'idle' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    color: 'var(--warning)',
                    background: 'rgba(255,215,64,0.1)',
                    border: '1px solid rgba(255,215,64,0.3)',
                    borderRadius: 999,
                    padding: '2px 9px',
                    fontFamily: 'var(--font-dm-sans)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Sin guardar
                </motion.span>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty || varkSum !== 100}
            >
              <Save size={15} />
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const sectionTitle: React.CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-syne), Syne, sans-serif',
  fontWeight: 700, fontSize: '1.15rem',
  color: 'var(--text-primary)',
};

const sectionDesc: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
  fontSize: '0.83rem', color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

const infoTipStyle: React.CSSProperties = {
  display: 'flex', gap: 9, alignItems: 'flex-start',
  padding: '11px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(0,212,255,0.05)',
  border: '1px solid rgba(0,212,255,0.15)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
  fontSize: '0.78rem', lineHeight: 1.55,
};
