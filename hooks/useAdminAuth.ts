'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'sb-admin-token';

// URL absolue pour éviter que le préfixe de locale (/fr/, /en/) s'ajoute à l'URL de l'API
function apiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      // Le token Supabase est stocké dans les cookies httpOnly côté serveur
      // On stocke l'ID utilisateur en localStorage pour l'état UI
      const tokenValue = data.user?.id || 'authenticated';
      localStorage.setItem(TOKEN_KEY, tokenValue);
      setToken(tokenValue);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(apiUrl('/api/admin/login'), { method: 'DELETE' });
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    router.push('/fr/admin-login');
  }, [router]);

  const authHeaders = useCallback((): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return { token, isLoading, isAuthenticated: !!token, login, logout, authHeaders };
}
