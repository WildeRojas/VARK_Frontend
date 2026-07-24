import { apiRequest, getAccessToken } from './client';
import type {
  ReporteDocente,
  ExperimentoAB,
  AsignarEstudiantesPayload,
  ResultadosExperimento,
  ExportReporteParams,
  NotificacionAPI,
  DashboardEstudiante,
  HistorialVARKDetalle,
  DashboardAdmin,
  Perfil360,
} from './types';

// ─── CU-17: Dashboard personal del estudiante ────────────────────────────────

export function dashboardEstudiante(): Promise<DashboardEstudiante> {
  return apiRequest<DashboardEstudiante>('/analitica/dashboard/');
}

// ─── Fase 2: Dashboard del administrador y vista 360° del estudiante ─────────

export function dashboardAdmin(): Promise<DashboardAdmin> {
  return apiRequest<DashboardAdmin>('/analitica/dashboard/admin/');
}

export function perfil360Estudiante(id: number): Promise<Perfil360> {
  return apiRequest<Perfil360>(`/analitica/estudiantes/${id}/perfil-360/`);
}

// ─── CU-18: Historial detallado de evolución del perfil VARK ─────────────────

export function historialVARKDetalle(): Promise<HistorialVARKDetalle[]> {
  return apiRequest<HistorialVARKDetalle[]>('/analitica/perfil/historial-detalle/');
}

// ─── CU-19: Reporte docente ───────────────────────────────────────────────────

export function reporteDocente(): Promise<ReporteDocente> {
  return apiRequest<ReporteDocente>('/analitica/reporte/docente/');
}

// ─── CU-21: Exportar reporte (descarga de archivo) ───────────────────────────

export async function exportarReporte(params: ExportReporteParams): Promise<void> {
  const token = getAccessToken();
  const qs = new URLSearchParams({ formato: params.formato });
  if (params.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin)    qs.set('fecha_fin',    params.fecha_fin);
  if (params.tema_id != null) qs.set('tema_id', String(params.tema_id));

  const response = await fetch(
    `http://localhost:8000/api/analitica/reporte/exportar/?${qs.toString()}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );

  if (!response.ok) throw new Error('Error al exportar el reporte');

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = match?.[1]?.replace(/['"]/g, '')
    ?? `reporte.${params.formato === 'pdf' ? 'txt' : 'csv'}`;

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CU-20: Experimentos A/B ──────────────────────────────────────────────────

export function listarExperimentos(): Promise<ExperimentoAB[]> {
  return apiRequest<ExperimentoAB[]>('/analitica/experimentos/');
}

export function crearExperimento(
  data: Pick<ExperimentoAB, 'nombre' | 'descripcion'> & Partial<Pick<ExperimentoAB, 'estado'>>,
): Promise<ExperimentoAB> {
  return apiRequest<ExperimentoAB>('/analitica/experimentos/', {
    method: 'POST',
    body: data,
  });
}

export function actualizarExperimento(
  pk: number,
  data: Partial<Pick<ExperimentoAB, 'nombre' | 'descripcion' | 'estado'>>,
): Promise<ExperimentoAB> {
  return apiRequest<ExperimentoAB>(`/analitica/experimentos/${pk}/`, {
    method: 'PUT',
    body: data,
  });
}

export function asignarEstudiantes(
  pk: number,
  payload: AsignarEstudiantesPayload,
): Promise<{ asignados: number; omitidos: number; grupo: string }> {
  return apiRequest(`/analitica/experimentos/${pk}/asignar/`, {
    method: 'POST',
    body: payload,
  });
}

export function resultadosExperimento(pk: number): Promise<ResultadosExperimento> {
  return apiRequest<ResultadosExperimento>(`/analitica/experimentos/${pk}/resultados/`);
}

// ─── CU-22: Notificaciones ────────────────────────────────────────────────────

export function listarNotificaciones(soloNoLeidas?: boolean): Promise<NotificacionAPI[]> {
  const qs = soloNoLeidas ? '?no_leidas=true' : '';
  return apiRequest<NotificacionAPI[]>(`/analitica/notificaciones/${qs}`);
}

export function marcarNotificacionLeida(pk: number): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>(`/analitica/notificaciones/${pk}/leer/`, {
    method: 'PATCH',
  });
}

export function marcarTodasLeidas(): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>('/analitica/notificaciones/leer-todas/', {
    method: 'POST',
  });
}

// CU-22: Enviar notificación de nuevo recurso (docente/admin)
export function enviarNotificacionNuevoRecurso(
  recursoId: number,
): Promise<{ detail: string; categoria_vark: string }> {
  return apiRequest('/analitica/notificaciones/nuevo-recurso/', {
    method: 'POST',
    body: { recurso_id: recursoId },
  });
}
