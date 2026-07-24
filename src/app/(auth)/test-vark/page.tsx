"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Brain, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import RadarChart from "@/components/ui/RadarChart";
import { generarTestVARK, completarTestVARK } from "@/lib/api/accounts";
import type { PreguntaTest } from "@/lib/api/types";

// ─── Types ───────────────────────────────────────────────────────────────────
type VarkKey = "v" | "a" | "r" | "k";

interface VarkScores {
  v: number;
  a: number;
  r: number;
  k: number;
}

// ─── VARK display config ──────────────────────────────────────────────────────
const VARK_LABELS: Record<VarkKey, string> = {
  v: "Visual",
  a: "Auditivo",
  r: "Lectura/Escritura",
  k: "Kinestésico",
};

const VARK_COLORS: Record<VarkKey, string> = {
  v: "var(--vark-v)",
  a: "var(--vark-a)",
  r: "var(--vark-r)",
  k: "var(--vark-k)",
};

const VARK_DESCRIPTIONS: Record<VarkKey, string> = {
  v: "Aprendes mejor con imágenes, diagramas, gráficos y representaciones visuales.",
  a: "Aprendes mejor escuchando, debatiendo y procesando información de forma auditiva.",
  r: "Aprendes mejor leyendo y escribiendo: textos, listas, notas y resúmenes.",
  k: "Aprendes mejor con la práctica, la experiencia directa y los ejercicios concretos.",
};

// ─── Animation variants ───────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      delay: i * 0.06,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

// ─── Page Component ───────────────────────────────────────────────────────────
export default function TestVarkPage() {
  const router = useRouter();

  // step: -1 = welcome, 0..n-1 = questions, questions.length = results
  const [step, setStep] = useState(-1);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<VarkScores | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Questions loaded from API
  const [questions, setQuestions] = useState<PreguntaTest[]>([]);
  const [sesionId, setSesionId] = useState<number | null>(null);

  const currentQuestion = questions[step] ?? null;
  const selectedAnswer = step >= 0 ? answers[step] : undefined;
  const progress = step < 0 ? 0 : ((step + 1) / questions.length) * 100;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step === questions.length - 1) {
      handleFinish();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleStart = async () => {
    setLoadError(null);
    setCalculating(true);
    try {
      const data = await generarTestVARK();
      if (data.completado === true) {
        // Already completed - go straight to dashboard
        router.push("/dashboard");
        return;
      }
      setQuestions(data.preguntas);
      setSesionId(data.sesion_id);
      setDirection(1);
      setStep(0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo cargar el test.";
      setLoadError(message);
    } finally {
      setCalculating(false);
    }
  };

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [step]: optionId }));
  };

  const handleFinish = async () => {
    if (sesionId === null) return;
    setCalculating(true);
    setSubmitError(null);
    setDirection(1);

    // Build respuestas map: { "questionId": "optionId" }
    const respuestas: Record<string, string> = {};
    questions.forEach((q, idx) => {
      if (answers[idx]) {
        respuestas[String(q.id)] = answers[idx];
      }
    });

    try {
      const data = await completarTestVARK({ sesion_id: sesionId, respuestas });
      const vec = data.perfil_vark.vector;
      setResults({ v: vec.V, a: vec.A, r: vec.R, k: vec.K });
      setStep(questions.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al enviar respuestas.";
      setSubmitError(message);
    } finally {
      setCalculating(false);
    }
  };

  const dominantStyle = results
    ? (Object.entries(results).sort(([, a], [, b]) => b - a)[0][0] as VarkKey)
    : null;

  const isLastQuestion = step === questions.length - 1;

  // ─── Welcome screen ─────────────────────────────────────────────────────────
  const renderWelcome = () => (
    <motion.div
      key="welcome"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ width: "100%" }}
    >
      <div
        className="glass-card"
        style={{
          padding: "40px 36px",
          textAlign: "center",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "var(--radius-lg)",
            background: "rgba(59,110,248,0.12)",
            border: "1px solid rgba(59,110,248,0.25)",
            marginBottom: 28,
            boxShadow: "0 0 32px rgba(59,110,248,0.2)",
          }}
        >
          <Brain size={36} color="var(--accent-blue)" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            margin: "0 0 12px",
            fontSize: "1.9rem",
            fontWeight: 800,
            fontFamily: "var(--font-syne), Syne, sans-serif",
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Descubre tu{" "}
          <span style={{ color: "var(--accent-blue)" }}>estilo VARK</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          style={{
            margin: "0 0 28px",
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
            lineHeight: 1.65,
          }}
        >
          El modelo VARK identifica tu estilo de aprendizaje preferido:{" "}
          <strong style={{ color: "var(--vark-v)" }}>Visual</strong>,{" "}
          <strong style={{ color: "var(--vark-a)" }}>Auditivo</strong>,{" "}
          <strong style={{ color: "var(--vark-r)" }}>Lectura/Escritura</strong>{" "}
          o <strong style={{ color: "var(--vark-k)" }}>Kinestésico</strong>.
          Responde 10 preguntas cortas y recibirás recomendaciones de recursos
          personalizadas para ti.
        </motion.p>

        {/* VARK badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 36,
          }}
        >
          {(["v", "a", "r", "k"] as VarkKey[]).map((key) => (
            <span
              key={key}
              style={{
                padding: "5px 14px",
                borderRadius: 999,
                border: `1px solid ${VARK_COLORS[key]}`,
                background: `${VARK_COLORS[key]}18`,
                color: VARK_COLORS[key],
                fontSize: "0.72rem",
                fontWeight: 700,
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {VARK_LABELS[key]}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4 }}
        >
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={calculating}
          >
            {calculating ? "Cargando…" : "Comenzar test"} &nbsp;
            <ArrowRight size={16} />
          </Button>
        </motion.div>

        {loadError && (
          <p
            style={{
              marginTop: 14,
              fontSize: "0.8rem",
              color: "var(--error, #f87171)",
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
            }}
          >
            {loadError}
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            marginTop: 18,
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
          }}
        >
          ~3 minutos · Sin respuestas correctas o incorrectas
        </motion.p>
      </div>
    </motion.div>
  );

  // ─── Question screen ─────────────────────────────────────────────────────────
  const renderQuestion = () => (
    <motion.div
      key={`question-${step}`}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ width: "100%" }}
    >
      <div
        className="glass-card"
        style={{ padding: "36px 32px", maxWidth: 620, margin: "0 auto" }}
      >
        {/* Question number + text */}
        <div style={{ marginBottom: 28 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.7rem",
              fontWeight: 700,
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent-blue)",
              marginBottom: 10,
            }}
          >
            Pregunta {step + 1} de {questions.length}
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "1.15rem",
              fontWeight: 700,
              fontFamily: "var(--font-syne), Syne, sans-serif",
              color: "var(--text-primary)",
              lineHeight: 1.4,
            }}
          >
            {currentQuestion?.enunciado}
          </h2>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {currentQuestion?.opciones.map((opt, i) => {
            const isSelected = selectedAnswer === opt.id;
            const color = "var(--accent-blue)";
            return (
              <motion.button
                key={opt.id}
                type="button"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                onClick={() => handleSelectOption(opt.id)}
                whileHover={{
                  scale: 1.015,
                  boxShadow: `0 0 18px rgba(59,110,248,0.14)`,
                }}
                whileTap={{ scale: 0.985 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSelected ? color : "var(--border-glass)"}`,
                  background: isSelected
                    ? "rgba(59,110,248,0.12)"
                    : "var(--bg-glass)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.2s, background 0.2s",
                  boxShadow: isSelected
                    ? "0 0 14px rgba(59,110,248,0.2)"
                    : "none",
                }}
              >
                {/* Option letter badge */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected
                      ? "rgba(59,110,248,0.25)"
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.1)"}`,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                    color: isSelected ? color : "var(--text-muted)",
                    letterSpacing: "0.05em",
                    transition: "all 0.2s",
                  }}
                >
                  {opt.id.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                    color: isSelected
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    lineHeight: 1.5,
                    fontWeight: isSelected ? 500 : 400,
                    transition: "color 0.2s",
                  }}
                >
                  {opt.texto}
                </span>
                {/* Check icon on selected */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18 }}
                      style={{ marginLeft: "auto", flexShrink: 0, color }}
                    >
                      <CheckCircle2 size={18} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  // ─── Calculating screen ───────────────────────────────────────────────────────
  const renderCalculating = () => (
    <motion.div
      key="calculating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ textAlign: "center", padding: "60px 24px" }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "3px solid rgba(59,110,248,0.2)",
          borderTop: "3px solid var(--accent-blue)",
          margin: "0 auto 24px",
          boxShadow: "0 0 20px rgba(59,110,248,0.3)",
        }}
      />
      <p
        style={{
          fontSize: "1rem",
          fontFamily: "var(--font-syne), Syne, sans-serif",
          color: "var(--text-secondary)",
          fontWeight: 600,
        }}
      >
        Analizando tus respuestas…
      </p>
    </motion.div>
  );

  // ─── Results screen ───────────────────────────────────────────────────────────
  const renderResults = () => (
    <motion.div
      key="results"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ width: "100%" }}
    >
      <div
        className="glass-card"
        style={{
          padding: "40px 36px",
          maxWidth: 620,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: "0.7rem",
              fontWeight: 700,
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent-cyan)",
              marginBottom: 12,
            }}
          >
            Resultados del test
          </span>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "1.7rem",
              fontWeight: 800,
              fontFamily: "var(--font-syne), Syne, sans-serif",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Tu estilo dominante es{" "}
            <span
              style={{
                color: dominantStyle
                  ? VARK_COLORS[dominantStyle]
                  : "var(--accent-blue)",
              }}
            >
              {dominantStyle ? VARK_LABELS[dominantStyle] : ""}
            </span>
          </h2>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              lineHeight: 1.6,
              maxWidth: 440,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {dominantStyle ? VARK_DESCRIPTIONS[dominantStyle] : ""}
          </p>
        </motion.div>

        {/* Radar chart */}
        {results && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            style={{ marginBottom: 32 }}
          >
            <RadarChart data={results} size={300} />
          </motion.div>
        )}

        {/* Score bars */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 36,
              textAlign: "left",
            }}
          >
            {(["v", "a", "r", "k"] as VarkKey[]).map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07, duration: 0.35 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                      color: VARK_COLORS[key],
                    }}
                  >
                    {VARK_LABELS[key]}
                  </span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                      color: "var(--text-primary)",
                    }}
                  >
                    {results[key]}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${results[key]}%` }}
                    transition={{
                      delay: 0.45 + i * 0.07,
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: VARK_COLORS[key],
                      boxShadow: `0 0 8px ${VARK_COLORS[key]}88`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.35 }}
        >
          <Button variant="primary" onClick={() => router.push("/dashboard")}>
            Ir al dashboard &nbsp;
            <ArrowRight size={16} />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 680, paddingBottom: 80 }}>
      {/* Progress bar (visible during questions) */}
      <AnimatePresence>
        {step >= 0 && step < questions.length && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: 28 }}
          >
            {/* Step indicators */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {questions.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    background:
                      i < step
                        ? "var(--accent-blue)"
                        : i === step
                          ? "var(--accent-cyan)"
                          : "rgba(255,255,255,0.1)",
                    scale: i === step ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  style={{
                    width: i === step ? 24 : 8,
                    height: 8,
                    borderRadius: 999,
                    transition: "width 0.3s ease",
                  }}
                />
              ))}
            </div>
            {/* Progress track */}
            <div
              style={{
                height: 3,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))",
                  boxShadow: "0 0 8px rgba(0,212,255,0.5)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        {calculating
          ? renderCalculating()
          : step === -1
            ? renderWelcome()
            : step === questions.length
              ? renderResults()
              : renderQuestion()}
      </AnimatePresence>

      {/* Navigation buttons (visible during questions) */}
      <AnimatePresence>
        {step >= 0 && step < questions.length && !calculating && (
          <motion.div
            key="nav"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              maxWidth: 620,
              margin: "20px auto 0",
            }}
          >
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={step === 0}
              style={{
                opacity: step === 0 ? 0 : 1,
                pointerEvents: step === 0 ? "none" : "auto",
              }}
            >
              <ArrowLeft size={16} />
              &nbsp; Anterior
            </Button>

            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              }}
            >
              {step + 1} / {questions.length}
            </span>

            <Button
              variant="primary"
              onClick={goNext}
              disabled={!selectedAnswer || calculating}
            >
              {calculating
                ? "Enviando…"
                : isLastQuestion
                  ? "Ver resultados"
                  : "Siguiente"}
              &nbsp; <ArrowRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* Submit error */}
        {submitError && (
          <p
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: "0.8rem",
              color: "var(--error, #f87171)",
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
            }}
          >
            {submitError}
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}
