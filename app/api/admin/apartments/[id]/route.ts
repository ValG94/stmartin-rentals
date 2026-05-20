import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminGetApartmentById, adminUpdateApartment } from '@/lib/api-admin';
import { verifyAdminToken } from '@/lib/auth-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const result = await adminGetApartmentById(id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result.data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = await adminUpdateApartment(id, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  // Invalide le cache des pages publiques (homepage + liste + fiche villa)
  // pour que toute modification (titre, prix, activation/désactivation, etc.)
  // soit visible immédiatement côté visiteur.
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/apartments', 'page');
  revalidatePath('/[locale]/apartments/[slug]', 'page');

  return NextResponse.json(result.data);
}
