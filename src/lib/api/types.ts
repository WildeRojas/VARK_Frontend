// ─── Types generated from backend serializers (accounts app) ─────────────────

// UsuarioSerializer
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  rol: 'estudiante' | 'docente' | 'administrador';
  foto?: string;
  carrera?: string;
  semestre?: string;
  fecha_registro: string;
}

// Fase 7: editar el propio perfil
export interface MeUpdatePayload {
  nombre?: string;
  apellido?: string;
  email?: string;
  foto?: string;
  carrera?: string;
  semestre?: string;
}

// RegistroSerializer (request payload)
export interface RegistroPayload {
  email: string;
  nombre: string;
  apellido: string;
  rol: 'estudiante' | 'docente';
  password: string;
}

// LoginSerializer (request payload)
export interface LoginPayload {
  email: string;
  password: string;
}

// LoginSerializer (response)
export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: Usuario;
  vark_completado: boolean;
}

// LogoutView (request payload)
export interface LogoutPayload {
  refresh: string;
}

// PerfilVARKSerializer
export interface PerfilVARK {
  puntaje_visual: number;
  puntaje_auditivo: number;
  puntaje_lectura: number;
  puntaje_kinestesico: number;
  test_completado: boolean;
  fecha_test: string | null;
  vector: { V: number; A: number; R: number; K: number };
  estilo_dominante: 'V' | 'A' | 'R' | 'K';
}

// VARKGenerarTestView (response)
export interface OpcionTest {
  id: string;   // 'a' | 'b' | 'c' | 'd'
  texto: string;
}

export interface PreguntaTest {
  id: number;
  enunciado: string;
  opciones: OpcionTest[];
}

export interface VARKTestResponse {
  sesion_id: number;
  fuente: string;
  total_preguntas: number;
  preguntas: PreguntaTest[];
  completado?: boolean; // present when test was already completed
}

// VARKCompletarTestView (request payload)
export interface CompletarTestPayload {
  sesion_id: number;
  respuestas: Record<string, string>; // { "1": "a", "2": "c", ... }
}

// VARKCompletarTestView (response)
export interface CompletarTestResponse {
  detail: string;
  perfil_vark: PerfilVARK;
}

// ─── Types from contenido app serializers (CU-09, CU-10) ─────────────────────

// TemaSimpleSerializer
export interface TemaSimple {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}

// SugerenciaIASerializer
export interface SugerenciaIA {
  id: number;
  titulo: string;
  url: string;
  descripcion: string;
  justificacion_pedagogica: string;
  tema: number;
  tema_nombre: string;
  categoria_vark: 'V' | 'A' | 'R' | 'K';
  nivel_complejidad: 'basico' | 'intermedio' | 'avanzado';
  tipo_formato: string;
  estado: string; // 'pendiente' | 'aprobado' | 'rechazado'
  estado_display: string;
  revisado_por: number | null;
  revisado_por_email: string | null;
  recurso_creado: number | null;
  fecha_sugerencia: string;
  fecha_revision: string | null;
}

// SolicitarSugerenciaIASerializer (request)
export interface SolicitarSugerenciaIAPayload {
  tema_id: number;
  categoria_vark: 'V' | 'A' | 'R' | 'K';
  nivel_complejidad: 'basico' | 'intermedio' | 'avanzado';
  cantidad: number;
}

// ─── Types from recomendacion app serializers (CU-12, CU-13) ─────────────────

// RecomendacionSerializer
export interface Recomendacion {
  id: number;
  recurso: number;
  recurso_titulo: string;
  recurso_url: string;
  recurso_tipo: string; // 'video' | 'articulo'
  recurso_tipo_display: string;
  recurso_categoria_vark: 'V' | 'A' | 'R' | 'K';
  recurso_nivel: 'basico' | 'intermedio' | 'avanzado';
  tema: number;
  tema_nombre: string;
  puntuacion: number;
  justificacion: string;
  vector_vark_snapshot: { V: number; A: number; R: number; K: number };
  fecha_recomendacion: string;
  vista: boolean;
}

// SolicitarRecomendacionSerializer (request)
export interface SolicitarRecomendacionPayload {
  tema_id: number;
  usar_groq?: boolean;
}

// ─── Types from analitica app serializers (CU-19, CU-20, CU-21, CU-22) ───────

// CU-19: Reporte docente
export interface RecursoEfectivo {
  'recurso__id': number;
  'recurso__titulo': string;
  'recurso__categoria_vark': 'V' | 'A' | 'R' | 'K';
  total_clics: number;
}

export interface EstudianteBajoEngagement {
  id: number;
  email: string;
  nombre: string;
}

export interface ReporteDocente {
  total_estudiantes: number;
  promedio_puntaje_quizzes: number;
  recursos_mas_efectivos: RecursoEfectivo[];
  estudiantes_bajo_engagement: EstudianteBajoEngagement[];
  distribucion_vark: { V: number; A: number; R: number; K: number };
}

// CU-20: Experimento A/B
export interface ExperimentoAB {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'finalizado';
  creado_por: number;
  creado_por_email: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  total_asignados: number;
}

export interface AsignarEstudiantesPayload {
  estudiante_ids: number[];
  grupo: 'experimental' | 'control';
}

export interface GrupoResultados {
  total: number;
  promedio_puntaje: number | null;
  total_clics: number;
}

export interface ResultadosExperimento {
  experimento: ExperimentoAB;
  resultados: {
    experimental: GrupoResultados;
    control: GrupoResultados;
  };
}

// CU-21: Export params (query params sent as GET request)
export interface ExportReporteParams {
  formato: 'csv' | 'pdf';
  fecha_inicio?: string;
  fecha_fin?: string;
  tema_id?: number;
}

// CU-22: Notificaciones
export interface NotificacionAPI {
  id: number;
  tipo: 'nuevo_recurso' | 'nuevo_quiz' | 'sistema';
  tipo_display: string;
  titulo: string;
  mensaje: string;
  recurso: number | null;
  recurso_titulo: string | null;
  leida: boolean;
  fecha: string;
}

// ─── CU-04: Jerarquía de temas y subtemas (contenido) ────────────────────────

// SubtemaSerializer
export interface Subtema {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

// TemaSerializer (con subtemas anidados)
export interface Tema {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  activo: boolean;
  subtemas: Subtema[];
}

// Payload para crear/editar Tema (TemaSerializer escribible)
export interface TemaPayload {
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}

// Payload para crear Subtema (SubtemaSerializer escribible)
export interface SubtemaPayload {
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}

// ─── CU-08 / CU-11: Recursos académicos (contenido) ──────────────────────────

export type CategoriaVARK = 'V' | 'A' | 'R' | 'K';
export type NivelComplejidad = 'basico' | 'intermedio' | 'avanzado';
export type TipoFormato = 'video' | 'articulo' | 'ejercicio' | 'documento';

// RecursoSerializer
export interface Recurso {
  id: number;
  titulo: string;
  url: string;
  descripcion: string;
  tema: number;
  tema_nombre: string;
  subtema: number | null;
  subtema_nombre: string | null;
  categoria_vark: CategoriaVARK;
  categoria_vark_display: string;
  nivel_complejidad: NivelComplejidad;
  nivel_complejidad_display: string;
  tipo_formato: TipoFormato;
  tipo_formato_display: string;
  activo: boolean;
  url_valida: boolean;
  ultima_verificacion: string | null;
  sugerido_por_ia: boolean;
  validado_por: number | null;
  validado_por_email: string | null;
  creado_por: number | null;
  creado_por_email: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

// Payload para crear/editar Recurso (campos escribibles del serializer)
export interface RecursoPayload {
  titulo: string;
  url: string;
  descripcion?: string;
  tema: number;
  subtema?: number | null;
  categoria_vark: CategoriaVARK;
  nivel_complejidad: NivelComplejidad;
  tipo_formato: TipoFormato;
  activo?: boolean;
}

// Filtros de búsqueda de recursos (CU-11, query params)
export interface RecursoFiltros {
  categoria_vark?: CategoriaVARK;
  tema?: number;
  nivel?: NivelComplejidad;
  tipo?: TipoFormato;
}

// ─── CU-05: Banco de preguntas (contenido) ───────────────────────────────────

export type NivelDificultad = 'facil' | 'media' | 'dificil';

// OpcionPreguntaSerializer (con respuesta correcta — vista docente)
export interface OpcionPregunta {
  id: number;
  texto: string;
  es_correcta: boolean;
}

export type OrigenPregunta = 'manual' | 'ia';

// PreguntaSerializer (vista docente, incluye es_correcta)
export interface Pregunta {
  id: number;
  enunciado: string;
  tema: number;
  tema_nombre: string;
  subtema: number | null;
  subtema_nombre: string | null;
  nivel_dificultad: NivelDificultad;
  origen: OrigenPregunta;
  explicacion: string;
  activo: boolean;
  opciones: OpcionPregunta[];
  fecha_creacion: string;
}

// Payload para crear/editar Pregunta
export interface PreguntaPayload {
  enunciado: string;
  tema: number;
  subtema?: number | null;
  nivel_dificultad: NivelDificultad;
  origen?: OrigenPregunta;
  explicacion?: string;
  activo?: boolean;
  opciones: { texto: string; es_correcta: boolean }[];
}

// ─── Fase 4: Generar preguntas de quiz con IA ────────────────────────────────

export interface PreguntaCandidataQuiz {
  enunciado: string;
  explicacion: string;
  opciones: { texto: string; es_correcta: boolean }[];
}

export interface SugerirPreguntasResponse {
  tema: number;
  tema_nombre: string;
  dificultad: NivelDificultad;
  total: number;
  preguntas: PreguntaCandidataQuiz[];
}

// ─── CU-07: Quizzes (contenido) ──────────────────────────────────────────────

// OpcionPreguntaFrontendSerializer (sin revelar la correcta)
export interface OpcionPreguntaFrontend {
  id: number;
  texto: string;
}

// PreguntaFrontendSerializer (vista estudiante)
export interface PreguntaFrontend {
  id: number;
  enunciado: string;
  tema_nombre: string;
  nivel_dificultad: NivelDificultad;
  opciones: OpcionPreguntaFrontend[];
}

// QuizObtenerPreguntasView (response)
export interface QuizPreguntasResponse {
  tema_id: number;
  total_preguntas: number;
  preguntas: PreguntaFrontend[];
}

// RespuestaQuizSerializer (request)
export interface RespuestaQuizPayload {
  tema_id: number;
  respuestas: { pregunta_id: number; opcion_id: number }[];
}

// ResultadoQuizSerializer (response)
export interface ResultadoQuiz {
  id: number;
  tema: number;
  tema_nombre: string;
  puntaje: number;             // 0.0 - 1.0
  puntaje_porcentaje: string;  // ej. "80%"
  total_preguntas: number;
  respuestas_correctas: number;
  respuestas_json: { pregunta_id: number; opcion_id: number; es_correcta: boolean }[];
  fecha_realizacion: string;
}

// ─── CU-15: Clickstream (recomendacion) ──────────────────────────────────────

export type TipoEventoClickstream = 'clic' | 'permanencia' | 'retorno' | 'cierre';

// EventoClickstreamSerializer (request/response)
export interface EventoClickstreamPayload {
  recurso: number;
  tipo_evento: TipoEventoClickstream;
  duracion_segundos?: number | null;
}

export interface EventoClickstream extends EventoClickstreamPayload {
  id: number;
  timestamp: string;
}

// ─── CU-14: Valoraciones (recomendacion) ─────────────────────────────────────

export type TipoValoracion = 'util' | 'no_util';

// ValoracionRecursoSerializer (request: recurso, valoracion, comentario)
export interface ValoracionPayload {
  recurso: number;
  valoracion: TipoValoracion;
  comentario?: string;
}

export interface ValoracionRecurso {
  id: number;
  recurso: number;
  recurso_titulo: string;
  valoracion: TipoValoracion;
  comentario: string;
  fecha: string;
}

// ─── CU-16: Historial de perfil VARK (recomendacion) ─────────────────────────

export type OrigenHistorial = 'clickstream' | 'quiz' | 'test_inicial';

// HistorialPerfilVARKSerializer
export interface HistorialPerfilVARK {
  id: number;
  vector_anterior: { V: number; A: number; R: number; K: number };
  vector_nuevo: { V: number; A: number; R: number; K: number };
  origen: OrigenHistorial;
  origen_display: string;
  fecha: string;
}

// ─── CU-06: Configuración del motor (recomendacion) ──────────────────────────

// ConfiguracionMotorSerializer
export interface ConfiguracionMotor {
  factor_decaimiento: number;
  umbral_similitud: number;
  max_recomendaciones: number;
  peso_valoracion_util: number;
  dias_ventana_clickstream: number;
  actualizado_en: string;
}

export type ConfiguracionMotorPayload = Partial<Omit<ConfiguracionMotor, 'actualizado_en'>>;

// ─── CU-17: Dashboard estudiante (analitica) ─────────────────────────────────

export interface ProgresoTema {
  tema_id: number;
  tema: string;
  puntaje_promedio: number;
  quizzes_realizados: number;
}

export interface EvolucionSemanal {
  fecha: string;
  origen: string;
  V: number;
  A: number;
  R: number;
  K: number;
}

// DashboardEstudianteView (response)
export interface DashboardEstudiante {
  perfil_vark: { V: number; A: number; R: number; K: number };
  estilo_dominante: string;
  evolucion_semanal: EvolucionSemanal[];
  progreso_por_tema: ProgresoTema[];
  total_recursos_vistos: number;
  total_quizzes_realizados: number;
}

// ─── Fase 2: Gestión de usuarios (accounts, solo Admin) ──────────────────────

export type RolUsuario = 'administrador' | 'docente' | 'estudiante';

// UsuarioAdminSerializer
export interface UsuarioAdmin {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  rol: RolUsuario;
  is_active: boolean;
  fecha_registro: string;
}

export interface UsuarioAdminPayload {
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  password?: string;
  is_active?: boolean;
}

export interface UsuarioFiltros {
  rol?: RolUsuario;
  activo?: boolean;
  buscar?: string;
}

// ─── Fase 2: Vista 360° del estudiante (analitica) ───────────────────────────

export interface TopRecursoClick {
  'recurso__id': number;
  'recurso__titulo': string;
  clics: number;
}

export interface Perfil360 {
  usuario: {
    id: number;
    nombre_completo: string;
    email: string;
    fecha_registro: string;
    is_active: boolean;
  };
  perfil_vark: { V: number; A: number; R: number; K: number };
  estilo_dominante: string;
  test_completado: boolean;
  evolucion: { fecha: string; origen: string; V: number; A: number; R: number; K: number }[];
  clickstream: {
    total_clics: number;
    tiempo_total_segundos: number;
    recursos_unicos: number;
    top_recursos: TopRecursoClick[];
  };
  recomendaciones: { recurso_titulo: string; tema: string; puntuacion: number; vista: boolean; fecha: string }[];
  valoraciones: { recurso_titulo: string; valoracion: 'util' | 'no_util'; comentario: string; fecha: string }[];
  quizzes: { tema: string; puntaje: number; total_preguntas: number; respuestas_correctas: number; fecha: string }[];
  engagement: 'activo' | 'en_riesgo';
}

// ─── Fase 2: Dashboard del administrador (analitica) ─────────────────────────

export interface DashboardAdmin {
  totales: { estudiantes: number; docentes: number; recursos: number; quizzes_realizados: number };
  distribucion_vark: { V: number; A: number; R: number; K: number };
  recursos_mas_efectivos: RecursoEfectivo[];
  estudiantes_bajo_engagement: EstudianteBajoEngagement[];
  tasa_aceptacion_ia: number | null;
}

// ─── CU-18: Historial detallado VARK (analitica) ─────────────────────────────

// HistorialVARKDetalleView (response)
export interface HistorialVARKDetalle {
  id: number;
  fecha: string;
  origen: string; // ya viene como display
  vector_anterior: { V: number; A: number; R: number; K: number };
  vector_nuevo: { V: number; A: number; R: number; K: number };
  delta: { V: number; A: number; R: number; K: number };
}

// ─── Fase 3: Edición del test VARK por el administrador ──────────────────────

export type EstiloVARK = 'V' | 'A' | 'R' | 'K';
export type ModoTestVARK = 'dinamico_ia' | 'banco_fijo';
export type OrigenPreguntaVARK = 'ia' | 'manual';

export interface OpcionVARKAdmin {
  id?: number;
  texto: string;
  estilo: EstiloVARK;
  peso?: number;
  orden?: number;
}

export interface PreguntaVARKAdmin {
  id: number;
  enunciado: string;
  contexto: string;
  activo: boolean;
  origen: OrigenPreguntaVARK;
  opciones: OpcionVARKAdmin[];
  creado_en: string;
}

// Para crear/editar (sin id ni creado_en)
export interface PreguntaVARKPayload {
  enunciado: string;
  contexto?: string;
  activo?: boolean;
  origen?: OrigenPreguntaVARK;
  opciones: OpcionVARKAdmin[];
}

export interface ConfiguracionTestVARK {
  modo: ModoTestVARK;
  num_preguntas: number;
  contexto_tematico: string;
  usar_fallback: boolean;
  actualizado_en?: string;
}

// Candidata generada por IA (incluye estilo visible para revisión del admin)
export interface PreguntaCandidataVARK {
  id: number;
  enunciado: string;
  opciones: { id: string; texto: string; estilo: EstiloVARK }[];
}

export interface GenerarPreguntasResponse {
  fuente: 'groq' | 'estatico';
  total: number;
  preguntas: PreguntaCandidataVARK[];
}

export interface PreviewTestVARKResponse {
  fuente: 'groq' | 'banco' | 'estatico';
  total_preguntas: number;
  preguntas: PreguntaCandidataVARK[];
}

// ─── Fase 5: Estado y métricas del modelo de ML ──────────────────────────────

export interface MLClasificadorMetricas {
  n_muestras: number;
  n_test: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  matriz_confusion: number[][];
  importancia_features: Record<string, number>;
  baseline_mayoria: number;
}

export interface MLClusteringMetricas {
  n_clusters: number;
  silhouette: number | null;
  tamanos: number[];
  centroides_vark: { V: number; A: number; R: number; K: number }[];
}

export interface MLMetricas {
  entrenado_en: string;
  clasificador: MLClasificadorMetricas;
  clustering: MLClusteringMetricas;
  n_estudiantes: number;
}

export interface MLEstado {
  modelo_disponible: boolean;
  usar_ml: boolean;
  peso_cbf: number;
  peso_ml: number;
  metricas: MLMetricas | null;
}
