import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'stmartin2024';
const ADMIN_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'stmartin-admin-2024-secret';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, token: ADMIN_TOKEN });

  // Stocker le token dans un cookie httpOnly sécurisé
  response.cookies.set('admin_token', ADMIN_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  });

  return response;
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token');
  return response;
}
