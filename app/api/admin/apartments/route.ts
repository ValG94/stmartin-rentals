import { NextRequest, NextResponse } from 'next/server';
import { adminGetAllApartments, adminCreateApartment } from '@/lib/api-admin';
import { verifyAdminToken } from '@/lib/auth-admin';

export async function GET(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const result = await adminGetAllApartments();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const result = await adminCreateApartment(body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}
