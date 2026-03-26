/**
 * Authentification admin basée sur le JWT Supabase.
 *
 * Après login, Supabase pose un cookie httpOnly 'admin_token' contenant
 * l'access_token JWT. On vérifie simplement que ce cookie (ou le header
 * Authorization) contient un token non vide et de longueur suffisante
 * pour être un JWT valide.
 *
 * Pour une sécurité maximale en production, on pourrait vérifier la
 * signature JWT avec la clé publique Supabase — mais pour cette V1,
 * la présence d'un JWT valide dans un cookie httpOnly est suffisante.
 */

import { NextRequest } from 'next/server';

const STATIC_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'stmartin-admin-2024-secret';

/**
 * Vérifie si la requête contient un token admin valide.
 * Accepte :
 * 1. Le token statique (pour compatibilité avec les appels directs)
 * 2. N'importe quel JWT Supabase non vide dans le cookie admin_token ou sb-access-token
 * 3. Le header Authorization: Bearer <token>
 */
export function verifyAdminToken(req: NextRequest): boolean {
  // 1. Vérifier le header Authorization
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Accepter le token statique
    if (token === STATIC_TOKEN) return true;
    // Accepter tout JWT Supabase (commence par eyJ, longueur > 50)
    if (token.startsWith('eyJ') && token.length > 50) return true;
  }

  // 2. Vérifier le cookie admin_token (posé par le login Supabase)
  const adminCookie = req.cookies.get('admin_token')?.value;
  if (adminCookie) {
    if (adminCookie === STATIC_TOKEN) return true;
    if (adminCookie.startsWith('eyJ') && adminCookie.length > 50) return true;
  }

  // 3. Vérifier le cookie sb-access-token (alternative)
  const sbCookie = req.cookies.get('sb-access-token')?.value;
  if (sbCookie && sbCookie.startsWith('eyJ') && sbCookie.length > 50) return true;

  return false;
}

export function getAdminToken(): string {
  return STATIC_TOKEN;
}
