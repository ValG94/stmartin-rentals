import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/change-password
 *
 * Permet à un admin authentifié de modifier son mot de passe.
 * Body: { currentPassword: string, newPassword: string }
 *
 * Sécurité :
 * 1. Récupère le user via le cookie admin_token (JWT Supabase)
 * 2. Re-vérifie le mot de passe actuel via signInWithPassword
 *    → empêche un attaquant qui aurait volé un cookie de changer le mdp
 *      sans connaître le mot de passe actuel
 * 3. Met à jour le mot de passe via auth.admin.updateUserById (service_role)
 */
export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get('admin_token')?.value ||
      req.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. Identifier l'utilisateur depuis son token JWT
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user?.email) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }
    const email = userData.user.email;
    const userId = userData.user.id;

    // 2. Vérifier le mot de passe actuel en tentant un sign-in (avec anon key)
    const supabasePublic = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    const { error: verifyErr } = await supabasePublic.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyErr) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 },
      );
    }

    // 3. Mettre à jour le mot de passe via le service_role
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[change-password]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
