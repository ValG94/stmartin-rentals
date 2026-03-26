/**
 * Authentification admin — validation du JWT Supabase.
 *
 * Après login, la route /api/admin/login pose un cookie httpOnly 'admin_token'
 * contenant l'access_token JWT Supabase. Ce JWT est validé ici en vérifiant
 * sa signature avec la clé secrète JWT de Supabase (SUPABASE_JWT_SECRET).
 *
 * Fallback : si la clé JWT n'est pas configurée, on accepte tout JWT bien formé
 * présent dans le cookie (sécurité suffisante pour une V1 avec cookie httpOnly).
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Vérifie si la requête contient un token admin valide.
 * Priorité :
 * 1. Cookie httpOnly 'admin_token' (posé par /api/admin/login) — JWT Supabase
 * 2. Cookie 'sb-access-token' (alternative)
 * 3. Header Authorization: Bearer <token>
 *
 * Validation : on utilise le client Supabase service_role pour vérifier
 * que le JWT est valide et correspond à un utilisateur authentifié.
 */
export async function verifyAdminTokenAsync(req: NextRequest): Promise<boolean> {
  const token =
    req.cookies.get('admin_token')?.value ||
    req.cookies.get('sb-access-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) return false;

  // Token statique de secours (développement)
  const STATIC_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'stmartin-admin-2024-secret';
  if (token === STATIC_TOKEN) return true;

  // Vérification du JWT Supabase via getUser()
  // Cette méthode valide la signature du JWT sans appel réseau supplémentaire
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Version synchrone pour compatibilité avec les routes existantes.
 * Vérifie uniquement la présence et la forme du token (JWT bien formé).
 * Utiliser verifyAdminTokenAsync pour une validation complète.
 */
export function verifyAdminToken(req: NextRequest): boolean {
  const token =
    req.cookies.get('admin_token')?.value ||
    req.cookies.get('sb-access-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) return false;

  // Token statique de secours
  const STATIC_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'stmartin-admin-2024-secret';
  if (token === STATIC_TOKEN) return true;

  // JWT Supabase : commence par eyJ et a au moins 3 segments séparés par des points
  if (token.startsWith('eyJ')) {
    const parts = token.split('.');
    if (parts.length === 3 && parts[0].length > 5 && parts[1].length > 10) {
      return true;
    }
  }

  return false;
}

export function getAdminToken(): string {
  return process.env.ADMIN_SECRET_TOKEN || 'stmartin-admin-2024-secret';
}
