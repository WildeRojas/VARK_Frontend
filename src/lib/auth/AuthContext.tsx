'use client';

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { me as fetchMe, logout as apiLogout } from '@/lib/api/accounts';
import { getAccessToken, getRefreshToken, clearTokens } from '@/lib/api/client';
import type { Usuario } from '@/lib/api/types';

export type Rol = 'administrador' | 'docente' | 'estudiante';

// ─── Ruta de inicio por rol ───────────────────────────────────────────────────
export const HOME_BY_ROLE: Record<Rol, string> = {
  administrador: '/admin/dashboard',
  docente:       '/temas',
  estudiante:    '/dashboard',
};

// ─── Qué rutas puede ver cada rol (por prefijo) ───────────────────────────────
// El primer prefijo que coincida decide. Rutas no listadas: permitidas a autenticados.
const ROUTE_ROLES: { prefix: string; roles: Rol[] }[] = [
  { prefix: '/admin',           roles: ['administrador'] },
  { prefix: '/dashboard',       roles: ['estudiante'] },
  { prefix: '/recomendaciones', roles: ['estudiante'] },
  { prefix: '/historial',       roles: ['estudiante'] },
  { prefix: '/preguntas',       roles: ['administrador', 'docente'] },
  { prefix: '/reportes',        roles: ['administrador', 'docente'] },
  // /temas y /recursos quedan abiertos a cualquier autenticado (lectura compartida)
];

export function rolePuedeVer(rol: Rol, pathname: string): boolean {
  const match = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
  if (!match) return true;
  return match.roles.includes(rol);
}

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await fetchMe();
      setUser(u);
      if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await apiLogout(refresh);
    } catch {
      /* nunca bloquear al usuario si el backend falla */
    } finally {
      clearTokens();
      if (typeof window !== 'undefined') localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // Hidratar usuario: cache local + refresco con /me
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      router.replace('/login');
      return;
    }

    // 1) Pintar de inmediato lo cacheado para evitar parpadeo
    const cached = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
    }

    // 2) Confirmar con el backend
    fetchMe()
      .then((u) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {
        // token inválido/expirado → cerrar sesión
        clearTokens();
        localStorage.removeItem('user');
        setUser(null);
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda de rol: si el usuario no puede ver la ruta, lo mandamos a su home
  useEffect(() => {
    if (loading || !user) return;
    if (!rolePuedeVer(user.rol as Rol, pathname)) {
      router.replace(HOME_BY_ROLE[user.rol as Rol] ?? '/login');
    }
  }, [loading, user, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
