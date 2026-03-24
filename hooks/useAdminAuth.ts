'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_TOKEN_KEY = 'admin_token';

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
    setToken(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) return false;

    const { token: t } = await res.json();
    localStorage.setItem(ADMIN_TOKEN_KEY, t);
    setToken(t);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    router.push('/fr/admin-login');
  }, [router]);

  const authHeaders = useCallback((): HeadersInit => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return { token, isLoading, isAuthenticated: !!token, login, logout, authHeaders };
}
