import { apiRequest } from './client';
import {
  TemaSimple,
  SugerenciaIA,
  SolicitarSugerenciaIAPayload,
  Tema,
  TemaPayload,
  Subtema,
  SubtemaPayload,
  Recurso,
  RecursoPayload,
  RecursoFiltros,
  Pregunta,
  PreguntaPayload,
  QuizPreguntasResponse,
  RespuestaQuizPayload,
  ResultadoQuiz,
  SugerirPreguntasResponse,
  NivelDificultad,
} from './types';

// ─── CU-04: Temas (lista simple, usada en selects) ───────────────────────────

export function listarTemas(): Promise<TemaSimple[]> {
  return apiRequest<TemaSimple[]>('/contenido/temas/');
}

// ─── CU-04: Temas y subtemas (CRUD completo) ─────────────────────────────────
// Nota: GET /contenido/temas/ devuelve TemaSerializer (con subtemas anidados).

export function listarTemasCompletos(): Promise<Tema[]> {
  return apiRequest<Tema[]>('/contenido/temas/');
}

export function crearTema(payload: TemaPayload): Promise<Tema> {
  return apiRequest<Tema>('/contenido/temas/', { method: 'POST', body: payload });
}

export function actualizarTema(pk: number, payload: Partial<TemaPayload>): Promise<Tema> {
  return apiRequest<Tema>(`/contenido/temas/${pk}/`, { method: 'PUT', body: payload });
}

export function eliminarTema(pk: number): Promise<void> {
  return apiRequest<void>(`/contenido/temas/${pk}/`, { method: 'DELETE' });
}

export function listarSubtemas(temaPk: number): Promise<Subtema[]> {
  return apiRequest<Subtema[]>(`/contenido/temas/${temaPk}/subtemas/`);
}

export function crearSubtema(temaPk: number, payload: SubtemaPayload): Promise<Subtema> {
  return apiRequest<Subtema>(`/contenido/temas/${temaPk}/subtemas/`, {
    method: 'POST',
    body: payload,
  });
}

// ─── CU-08 / CU-11: Recursos académicos ──────────────────────────────────────

export function listarRecursos(filtros?: RecursoFiltros): Promise<Recurso[]> {
  const qs = new URLSearchParams();
  if (filtros?.categoria_vark) qs.set('categoria_vark', filtros.categoria_vark);
  if (filtros?.tema != null) qs.set('tema', String(filtros.tema));
  if (filtros?.nivel) qs.set('nivel', filtros.nivel);
  if (filtros?.tipo) qs.set('tipo', filtros.tipo);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<Recurso[]>(`/contenido/recursos/${query}`);
}

export function crearRecurso(payload: RecursoPayload): Promise<Recurso> {
  return apiRequest<Recurso>('/contenido/recursos/', { method: 'POST', body: payload });
}

export function actualizarRecurso(pk: number, payload: Partial<RecursoPayload>): Promise<Recurso> {
  return apiRequest<Recurso>(`/contenido/recursos/${pk}/`, { method: 'PUT', body: payload });
}

export function eliminarRecurso(pk: number): Promise<void> {
  return apiRequest<void>(`/contenido/recursos/${pk}/`, { method: 'DELETE' });
}

// ─── CU-05: Banco de preguntas ───────────────────────────────────────────────

export function listarPreguntas(temaId?: number, dificultad?: string): Promise<Pregunta[]> {
  const qs = new URLSearchParams();
  if (temaId != null) qs.set('tema', String(temaId));
  if (dificultad) qs.set('dificultad', dificultad);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<Pregunta[]>(`/contenido/preguntas/${query}`);
}

export function crearPregunta(payload: PreguntaPayload): Promise<Pregunta> {
  return apiRequest<Pregunta>('/contenido/preguntas/', { method: 'POST', body: payload });
}

export function actualizarPregunta(pk: number, payload: Partial<PreguntaPayload>): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/contenido/preguntas/${pk}/`, { method: 'PUT', body: payload });
}

export function eliminarPregunta(pk: number): Promise<void> {
  return apiRequest<void>(`/contenido/preguntas/${pk}/`, { method: 'DELETE' });
}

// ─── Fase 4: Generar preguntas de quiz con IA ────────────────────────────────

export function sugerirPreguntasIA(
  temaId: number,
  dificultad: NivelDificultad,
  cantidad: number,
): Promise<SugerirPreguntasResponse> {
  return apiRequest<SugerirPreguntasResponse>('/contenido/preguntas/sugerir/', {
    method: 'POST',
    body: { tema_id: temaId, dificultad, cantidad },
  });
}

// ─── CU-07: Quizzes ──────────────────────────────────────────────────────────

export function obtenerPreguntasQuiz(temaPk: number): Promise<QuizPreguntasResponse> {
  return apiRequest<QuizPreguntasResponse>(`/contenido/quiz/${temaPk}/preguntas/`);
}

export function responderQuiz(payload: RespuestaQuizPayload): Promise<ResultadoQuiz> {
  return apiRequest<ResultadoQuiz>('/contenido/quiz/responder/', {
    method: 'POST',
    body: payload,
  });
}

export function historialQuiz(): Promise<ResultadoQuiz[]> {
  return apiRequest<ResultadoQuiz[]>('/contenido/quiz/historial/');
}

// ─── CU-09: Sugerir recursos con IA ──────────────────────────────────────────

export function sugerirRecursosIA(
  payload: SolicitarSugerenciaIAPayload,
): Promise<SugerenciaIA[]> {
  return apiRequest<SugerenciaIA[]>('/contenido/recursos/sugerir/', {
    method: 'POST',
    body: payload,
  });
}

// ─── CU-10: Gestionar sugerencias IA ─────────────────────────────────────────

export function listarSugerencias(estado?: string): Promise<SugerenciaIA[]> {
  const query = estado ? `?estado=${estado}` : '';
  return apiRequest<SugerenciaIA[]>(`/contenido/sugerencias/${query}`);
}

export function aprobarSugerencia(pk: number): Promise<unknown> {
  return apiRequest<unknown>(`/contenido/sugerencias/${pk}/aprobar/`, { method: 'POST' });
}

export function rechazarSugerencia(pk: number): Promise<unknown> {
  return apiRequest<unknown>(`/contenido/sugerencias/${pk}/rechazar/`, { method: 'POST' });
}
