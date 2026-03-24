/**
 * Authentification admin simple basée sur un token JWT stocké en cookie/header.
 * Pour une V1 simple et maintenable.
 */

import { NextRequest } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'stmartin-admin-2024-secret';

/**
 * Vérifie si la requête contient un token admin valide.
 * Le token peut être dans :
 * - Le header Authorization: Bearer <token>
 * - Le cookie admin_token
 */
export function verifyAdminToken(req: NextRequest): boolean {
  // Vérifier le header Authorization
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token === ADMIN_TOKEN) return true;
  }

  // Vérifier le cookie
  const cookieToken = req.cookies.get('admin_token')?.value;
  if (cookieToken === ADMIN_TOKEN) return true;

  return false;
}

export function getAdminToken(): string {
  return ADMIN_TOKEN;
}
