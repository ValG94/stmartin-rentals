import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { loadMonthlyRows, monthlyCsv } from '@/lib/documents/monthly-export';

/**
 * GET /api/admin/exports/monthly?month=YYYY-MM[&company=chenille|goldenIsland]
 *
 * CSV des paiements (reçus) et remboursements (avoirs) du mois, pour la
 * comptable : taxe de séjour par société émettrice.
 */
export async function GET(req: NextRequest) {
  if (!(await verifyAdminTokenAsync(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const month = req.nextUrl.searchParams.get('month') ?? '';
  const company = req.nextUrl.searchParams.get('company') || undefined;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: 'month doit être au format AAAA-MM' }, { status: 400 });
  }
  if (company && company !== 'chenille' && company !== 'goldenIsland') {
    return NextResponse.json({ error: 'company invalide' }, { status: 400 });
  }

  try {
    const rows = await loadMonthlyRows(supabaseAdmin, month, company as 'chenille' | 'goldenIsland' | undefined);
    const suffix = company === 'chenille' ? '-CI' : company === 'goldenIsland' ? '-GI' : '';
    return new NextResponse(monthlyCsv(month, rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payments-room-tax-${month}${suffix}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export/monthly]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
