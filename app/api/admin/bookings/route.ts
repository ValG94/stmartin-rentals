import { NextRequest, NextResponse } from 'next/server';
import { adminGetBookings, adminUpdateBookingStatus } from '@/lib/api-admin';
import { verifyAdminToken } from '@/lib/auth-admin';

export async function GET(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const result = await adminGetBookings();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id, status } = await req.json();
  const result = await adminUpdateBookingStatus(id, status);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
