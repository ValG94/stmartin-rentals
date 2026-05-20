/**
 * Authentification admin — validation du JWT Supabase.
 *
 * Après login, /api/admin/login pose un cookie httpOnly 'admin_token'
 * contenant l'access_token JWT Supabase. Ce JWT est validé ici en demandant
 * à Supabase de le déchiffrer (signature + expiration + utilisateur existant).
 *
 * verifyAdminTokenAsync() : validation complète (recommandé, requiert async)
 * verifyAdminToken()      : validation rapide structurelle (JWT bien formé)
 *
 * Aucune voie d'authentification par "token statique" n'existe — toute
 * authentification doit passer par Supabase Auth.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function extractToken(req: NextRequest): string | null {
  return (
    req.cookies.get('admin_token')?.value ||
    req.cookies.get('sb-access-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    null
  );
}

/**
 * Validation complète d'un token JWT Supabase : vérifie la signature
 * et l'existence de l'utilisateur. Utilisable depuis un Server Component
 * (où on n'a pas de NextRequest) en lui passant la valeur du cookie.
 */
export async function isAdminTokenValid(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}

/**
 * Validation complète depuis une NextRequest (routes API).
 */
export async function verifyAdminTokenAsync(req: NextRequest): Promise<boolean> {
  return isAdminTokenValid(extractToken(req));
}

/**
 * Vérifie qu'une chaîne ressemble à un JWT bien formé (3 segments
 * séparés par des points, premier segment commençant par "eyJ").
 * Synchrone, n'effectue aucun appel réseau — à utiliser dans les
 * Server Components où on veut éviter la latence/faux négatifs
 * d'un round-trip Supabase, et où la sécurité réelle est assurée
 * par les routes API mutation qui font le check async strict.
 */
export function isJWTFormat(token: string | null | undefined): boolean {
  if (!token || !token.startsWith('eyJ')) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts[0].length > 5 && parts[1].length > 10;
}

/**
 * Validation rapide structurelle pour les routes API read-only.
 */
export function verifyAdminToken(req: NextRequest): boolean {
  return isJWTFormat(extractToken(req));
}
