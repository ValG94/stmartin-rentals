'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'sb-admin-token';

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    setToken(stored);
    setIsLoading(false);
  }, []);

  /**
   * Connexion avec email + mot de passe (Supabase Auth)
   * Compatible aussi avec l'ancien format username/password pour la transition
   */
  const login = useCallback(async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      // Détecter si c'est un email ou un username
      const isEmail = emailOrUsername.includes('@');
      const body = isEmail
        ? { email: emailOrUsername, password }
        : { email: emailOrUsername, password }; // on envoie toujours email maintenant

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) return false;

      const data = await res.json();
      // Le token est maintenant stocké dans les cookies httpOnly côté serveur
      // On stocke juste un flag en localStorage pour l'état UI
      const tokenValue = data.token || data.user?.id || 'authenticated';
      localStorage.setItem(TOKEN_KEY, tokenValue);
      setToken(tokenValue);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    router.push('/fr/admin-login');
  }, [router]);

  const authHeaders = useCallback((): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return { token, isLoading, isAuthenticated: !!token, login, logout, authHeaders };
}
