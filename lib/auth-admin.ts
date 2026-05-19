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
 * Validation complète : vérifie que le JWT est signé par Supabase
 * et correspond à un utilisateur existant. À utiliser sur toutes les
 * routes admin qui modifient de la donnée (mutations, paiements).
 */
export async function verifyAdminTokenAsync(req: NextRequest): Promise<boolean> {
  const token = extractToken(req);
  if (!token) return false;

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
 * Validation rapide structurelle : vérifie uniquement que le cookie
 * contient un JWT bien formé (3 segments base64). Utile pour les routes
 * read-only où une validation pleine est trop coûteuse.
 */
export function verifyAdminToken(req: NextRequest): boolean {
  const token = extractToken(req);
  if (!token) return false;
  if (!token.startsWith('eyJ')) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts[0].length > 5 && parts[1].length > 10;
}
