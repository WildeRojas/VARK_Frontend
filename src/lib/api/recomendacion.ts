import { apiRequest } from './client';
import {
  Recomendacion,
  SolicitarRecomendacionPayload,
  EventoClickstreamPayload,
  EventoClickstream,
  ValoracionPayload,
  ValoracionRecurso,
  HistorialPerfilVARK,
  ConfiguracionMotor,
  ConfiguracionMotorPayload,
  MLEstado,
} from './types';

// ─── CU-12: Motor de recomendación CBF ───────────────────────────────────────

export function recomendarRecursos(
  payload: SolicitarRecomendacionPayload,
): Promise<Recomendacion[]> {
  return apiRequest<Recomendacion[]>('/recomendacion/recomendar/', {
    method: 'POST',
    body: payload,
  });
}

// ─── CU-13: Historial de recomendaciones ─────────────────────────────────────

export function misRecomendaciones(): Promise<Recomendacion[]> {
  return apiRequest<Recomendacion[]>('/recomendacion/mis-recomendaciones/');
}

export function marcarRecomendacionVista(pk: number): Promise<unknown> {
  return apiRequest<unknown>(`/recomendacion/${pk}/vista/`, { method: 'PATCH' });
}

// ─── CU-15: Clickstream ───────────────────────────────────────────────────────

export function registrarEventoClickstream(
  payload: EventoClickstreamPayload,
): Promise<EventoClickstream> {
  return apiRequest<EventoClickstream>('/recomendacion/clickstream/', {
    method: 'POST',
    body: payload,
  });
}

// ─── CU-14: Valoraciones ──────────────────────────────────────────────────────

export function listarValoraciones(): Promise<ValoracionRecurso[]> {
  return apiRequest<ValoracionRecurso[]>('/recomendacion/valoraciones/');
}

export function valorarRecurso(payload: ValoracionPayload): Promise<ValoracionRecurso> {
  return apiRequest<ValoracionRecurso>('/recomendacion/valoraciones/', {
    method: 'POST',
    body: payload,
  });
}

// ─── CU-16: Historial de evolución del perfil VARK ───────────────────────────

export function historialPerfilVARK(): Promise<HistorialPerfilVARK[]> {
  return apiRequest<HistorialPerfilVARK[]>('/recomendacion/perfil/historial/');
}

// ─── CU-06: Configuración del motor ──────────────────────────────────────────

export function obtenerConfiguracionMotor(): Promise<ConfiguracionMotor> {
  return apiRequest<ConfiguracionMotor>('/recomendacion/configuracion/');
}

export function actualizarConfiguracionMotor(
  payload: ConfiguracionMotorPayload,
): Promise<ConfiguracionMotor> {
  return apiRequest<ConfiguracionMotor>('/recomendacion/configuracion/', {
    method: 'PUT',
    body: payload,
  });
}

// ─── Fase 5: Estado del modelo de ML ─────────────────────────────────────────

export function estadoML(): Promise<MLEstado> {
  return apiRequest<MLEstado>('/recomendacion/ml/estado/');
}
