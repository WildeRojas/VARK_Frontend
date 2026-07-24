import { apiRequest } from './client';
import type {
  CompletarTestPayload,
  CompletarTestResponse,
  LoginPayload,
  LoginResponse,
  PerfilVARK,
  RegistroPayload,
  Usuario,
  VARKTestResponse,
  UsuarioAdmin,
  UsuarioAdminPayload,
  UsuarioFiltros,
  MeUpdatePayload,
  ConfiguracionTestVARK,
  PreguntaVARKAdmin,
  PreguntaVARKPayload,
  GenerarPreguntasResponse,
  PreviewTestVARKResponse,
} from './types';

// CU-01: Registro
export function registro(payload: RegistroPayload): Promise<Usuario> {
  return apiRequest<Usuario>('/accounts/registro/', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

// CU-02: Login
export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/accounts/login/', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

// CU-02: Logout
export function logout(refresh: string): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>('/accounts/logout/', {
    method: 'POST',
    body: { refresh },
  });
}

// CU-02: Me (current user)
export function me(): Promise<Usuario> {
  return apiRequest<Usuario>('/accounts/me/');
}

// ─── Fase 7: Perfil propio ────────────────────────────────────────────────────

export function actualizarMiPerfil(payload: MeUpdatePayload): Promise<Usuario> {
  return apiRequest<Usuario>('/accounts/me/', { method: 'PATCH', body: payload });
}

export function cambiarMiPassword(
  passwordActual: string,
  passwordNueva: string,
): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>('/accounts/me/cambiar-password/', {
    method: 'POST',
    body: { password_actual: passwordActual, password_nueva: passwordNueva },
  });
}

export function eliminarMiCuenta(): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>('/accounts/me/', { method: 'DELETE' });
}

// CU-03: Generar test VARK
export function generarTestVARK(): Promise<VARKTestResponse> {
  return apiRequest<VARKTestResponse>('/accounts/vark/test/');
}

// CU-03: Completar test VARK
export function completarTestVARK(
  payload: CompletarTestPayload,
): Promise<CompletarTestResponse> {
  return apiRequest<CompletarTestResponse>('/accounts/vark/completar/', {
    method: 'POST',
    body: payload,
  });
}

// CU-03: Perfil VARK
export function perfilVARK(): Promise<PerfilVARK> {
  return apiRequest<PerfilVARK>('/accounts/vark/perfil/');
}

// ─── Fase 2: Gestión de usuarios (Administrador) ─────────────────────────────

export function listarUsuarios(filtros?: UsuarioFiltros): Promise<UsuarioAdmin[]> {
  const qs = new URLSearchParams();
  if (filtros?.rol) qs.set('rol', filtros.rol);
  if (filtros?.activo != null) qs.set('activo', String(filtros.activo));
  if (filtros?.buscar) qs.set('buscar', filtros.buscar);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<UsuarioAdmin[]>(`/accounts/usuarios/${query}`);
}

export function crearUsuario(payload: UsuarioAdminPayload): Promise<UsuarioAdmin> {
  return apiRequest<UsuarioAdmin>('/accounts/usuarios/', { method: 'POST', body: payload });
}

export function obtenerUsuario(id: number): Promise<UsuarioAdmin> {
  return apiRequest<UsuarioAdmin>(`/accounts/usuarios/${id}/`);
}

export function actualizarUsuario(id: number, payload: Partial<UsuarioAdminPayload>): Promise<UsuarioAdmin> {
  return apiRequest<UsuarioAdmin>(`/accounts/usuarios/${id}/`, { method: 'PATCH', body: payload });
}

export function desactivarUsuario(id: number): Promise<void> {
  return apiRequest<void>(`/accounts/usuarios/${id}/`, { method: 'DELETE' });
}

export function resetPasswordUsuario(id: number, passwordNueva: string): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>(`/accounts/usuarios/${id}/reset-password/`, {
    method: 'POST',
    body: { password_nueva: passwordNueva },
  });
}

// ─── Fase 3: Edición del test VARK (Administrador) ───────────────────────────

export function obtenerConfigVARK(): Promise<ConfiguracionTestVARK> {
  return apiRequest<ConfiguracionTestVARK>('/accounts/vark/config/');
}

export function actualizarConfigVARK(
  payload: Partial<ConfiguracionTestVARK>,
): Promise<ConfiguracionTestVARK> {
  return apiRequest<ConfiguracionTestVARK>('/accounts/vark/config/', { method: 'PUT', body: payload });
}

export function generarPreguntasVARK(
  cantidad: number,
  contexto?: string,
): Promise<GenerarPreguntasResponse> {
  return apiRequest<GenerarPreguntasResponse>('/accounts/vark/generar-preguntas/', {
    method: 'POST',
    body: { cantidad, contexto },
  });
}

export function listarBancoVARK(): Promise<PreguntaVARKAdmin[]> {
  return apiRequest<PreguntaVARKAdmin[]>('/accounts/vark/banco/');
}

export function crearPreguntaVARK(payload: PreguntaVARKPayload): Promise<PreguntaVARKAdmin> {
  return apiRequest<PreguntaVARKAdmin>('/accounts/vark/banco/', { method: 'POST', body: payload });
}

export function actualizarPreguntaVARK(
  id: number,
  payload: Partial<PreguntaVARKPayload>,
): Promise<PreguntaVARKAdmin> {
  return apiRequest<PreguntaVARKAdmin>(`/accounts/vark/banco/${id}/`, { method: 'PUT', body: payload });
}

export function desactivarPreguntaVARK(id: number): Promise<void> {
  return apiRequest<void>(`/accounts/vark/banco/${id}/`, { method: 'DELETE' });
}

export function previewTestVARK(): Promise<PreviewTestVARKResponse> {
  return apiRequest<PreviewTestVARKResponse>('/accounts/vark/preview/');
}
